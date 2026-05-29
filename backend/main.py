from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import os
import secrets
import struct
import time
from collections import deque
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState

try:
    from backend.agents.context_agent import Commitment, ContextAgent, ContextAgentError
    from backend.agents.whisper_agent import TranscriptionError, WhisperAgent
    from backend.routers.sessions import create_sessions_router
except ModuleNotFoundError:
    from agents.context_agent import Commitment, ContextAgent, ContextAgentError
    from agents.whisper_agent import TranscriptionError, WhisperAgent
    from routers.sessions import create_sessions_router


logger = logging.getLogger("voicecontract.capture")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())

MAGIC = 0x56435031
PROTOCOL_VERSION = 1
HEADER = struct.Struct("<IHHIIIdI")
MAX_AUDIO_PAYLOAD_BYTES = int(os.getenv("MAX_AUDIO_PAYLOAD_BYTES", "65536"))
MAX_CONTROL_BYTES = int(os.getenv("MAX_CONTROL_BYTES", "8192"))
MAX_QUEUE_CHUNKS = int(os.getenv("MAX_QUEUE_CHUNKS", "192"))
MAX_OUTBOUND_MESSAGES = int(os.getenv("MAX_OUTBOUND_MESSAGES", "256"))
SESSION_IDLE_TIMEOUT_SECONDS = float(os.getenv("SESSION_IDLE_TIMEOUT_SECONDS", "30"))
TRANSCRIBE_CHUNK_SECONDS = float(os.getenv("TRANSCRIBE_CHUNK_SECONDS", "2.4"))
TRANSCRIBE_MAX_CHUNK_SECONDS = float(os.getenv("TRANSCRIBE_MAX_CHUNK_SECONDS", "3.2"))
MAX_AI_TASKS_PER_SESSION = int(os.getenv("MAX_AI_TASKS_PER_SESSION", "8"))
CONTEXT_MIN_DELTA_CHARS = int(os.getenv("CONTEXT_MIN_DELTA_CHARS", "120"))
CONTEXT_MIN_INTERVAL_SECONDS = float(os.getenv("CONTEXT_MIN_INTERVAL_SECONDS", "2.0"))
TRANSCRIPT_WINDOW_SEGMENTS = int(os.getenv("TRANSCRIPT_WINDOW_SEGMENTS", "80"))
SESSION_ARCHIVE_LIMIT = int(os.getenv("SESSION_ARCHIVE_LIMIT", "128"))
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://localhost:3000",
    ).split(",")
    if origin.strip()
}
CAPTURE_SHARED_SECRET = os.getenv("CAPTURE_SHARED_SECRET", "")


class AudioChannel(IntEnum):
    MICROPHONE = 1
    SYSTEM = 2
    MIXED = 3


@dataclass(slots=True)
class AudioPacket:
    channel: AudioChannel
    sequence: int
    sample_rate: int
    frames: int
    sent_at_ms: float
    received_at_monotonic: float
    payload: memoryview


@dataclass(slots=True)
class AudioAccumulator:
    channel: AudioChannel
    sample_rate: int | None = None
    frames: int = 0
    chunks: list[bytes] = field(default_factory=list)
    started_at_ms: float = 0

    def append(self, packet: AudioPacket) -> None:
        if self.sample_rate is not None and self.sample_rate != packet.sample_rate:
            self.clear()
        if self.sample_rate is None:
            self.sample_rate = packet.sample_rate
            self.started_at_ms = packet.sent_at_ms
        self.chunks.append(packet.payload.tobytes())
        self.frames += packet.frames

    @property
    def duration_seconds(self) -> float:
        if not self.sample_rate:
            return 0.0
        return self.frames / self.sample_rate

    def pop_chunk(self) -> tuple[bytes, int, int, float] | None:
        if not self.sample_rate or not self.chunks:
            return None
        pcm = b"".join(self.chunks)
        sample_rate = self.sample_rate
        frames = self.frames
        started_at_ms = self.started_at_ms
        self.clear()
        return pcm, sample_rate, frames, started_at_ms

    def clear(self) -> None:
        self.sample_rate = None
        self.frames = 0
        self.chunks.clear()
        self.started_at_ms = 0


@dataclass(slots=True)
class TranscriptSegment:
    channel: AudioChannel
    text: str
    started_at_ms: float
    duration_seconds: float
    created_at: float = field(default_factory=time.time)

    def render(self) -> str:
        speaker = "User" if self.channel == AudioChannel.MICROPHONE else "Client/System"
        return f"[{speaker}] {self.text}"


@dataclass(slots=True)
class CaptureSession:
    session_id: str
    client_id: str
    started_at: float
    queue: asyncio.Queue[AudioPacket | None] = field(default_factory=lambda: asyncio.Queue(MAX_QUEUE_CHUNKS))
    outbound: asyncio.Queue[dict[str, Any] | None] = field(default_factory=lambda: asyncio.Queue(MAX_OUTBOUND_MESSAGES))
    packets_received: int = 0
    packets_dropped: int = 0
    bytes_received: int = 0
    transcript_segments: deque[TranscriptSegment] = field(default_factory=lambda: deque(maxlen=TRANSCRIPT_WINDOW_SEGMENTS))
    full_transcript_segments: list[TranscriptSegment] = field(default_factory=list)
    total_transcript_segments: int = 0
    committed_terms: dict[str, Commitment] = field(default_factory=dict)
    context_cursor: int = 0
    last_context_run: float = 0
    active_ai_tasks: set[asyncio.Task[None]] = field(default_factory=set)
    last_seen: float = field(default_factory=time.monotonic)
    expected_sequence: dict[AudioChannel, int] = field(default_factory=dict)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    closed: asyncio.Event = field(default_factory=asyncio.Event)

    def mark_packet(self, packet: AudioPacket) -> None:
        expected = self.expected_sequence.get(packet.channel)
        if expected is not None and packet.sequence != expected:
            delta = packet.sequence - expected
            if delta > 0:
                self.packets_dropped += delta
                logger.warning(
                    "capture_gap session=%s channel=%s expected=%s actual=%s missed=%s",
                    self.session_id,
                    packet.channel.name,
                    expected,
                    packet.sequence,
                    delta,
                )
        self.expected_sequence[packet.channel] = packet.sequence + 1
        self.packets_received += 1
        self.bytes_received += len(packet.payload)
        self.last_seen = time.monotonic()

    async def emit(self, payload: dict[str, Any]) -> None:
        if self.outbound.full():
            logger.warning("outbound_drop session=%s type=%s", self.session_id, payload.get("type"))
            return
        await self.outbound.put(payload)

    def remember_task(self, task: asyncio.Task[None]) -> None:
        self.active_ai_tasks.add(task)
        task.add_done_callback(self.active_ai_tasks.discard)

    def export_legal_inputs(self) -> dict[str, Any]:
        transcript = "\n".join(segment.render() for segment in self.full_transcript_segments)
        return {
            "session_id": self.session_id,
            "client_id": self.client_id,
            "started_at": self.started_at,
            "transcript": transcript,
            "commitments": [_commitment_payload(commitment) for commitment in self.committed_terms.values()],
            "identity": {
                "client_id": self.client_id,
                "session_id": self.session_id,
                "live_commitments": [_commitment_payload(commitment) for commitment in self.committed_terms.values()],
            },
        }


class SessionRegistry:
    def __init__(self) -> None:
        self._sessions: dict[str, CaptureSession] = {}
        self._archives: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def create(self, client_id: str) -> CaptureSession:
        async with self._lock:
            session_id = secrets.token_urlsafe(24)
            session = CaptureSession(session_id=session_id, client_id=client_id, started_at=time.time())
            self._sessions[session_id] = session
            return session

    async def remove(self, session_id: str) -> None:
        async with self._lock:
            session = self._sessions.pop(session_id, None)
            if session is not None:
                self._archives[session_id] = session.export_legal_inputs()
                while len(self._archives) > SESSION_ARCHIVE_LIMIT:
                    oldest_key = next(iter(self._archives))
                    self._archives.pop(oldest_key, None)
                session.closed.set()

    async def get_legal_inputs(self, session_id: str) -> dict[str, Any] | None:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is not None:
                return session.export_legal_inputs()
            archived = self._archives.get(session_id)
            return dict(archived) if archived is not None else None

    async def snapshot(self) -> dict[str, Any]:
        async with self._lock:
            return {
                "active_sessions": len(self._sessions),
                "archived_sessions": len(self._archives),
                "sessions": [
                    {
                        "session_id": session.session_id,
                        "client_id": session.client_id,
                        "age_seconds": round(time.time() - session.started_at, 3),
                        "packets_received": session.packets_received,
                        "packets_dropped": session.packets_dropped,
                        "bytes_received": session.bytes_received,
                        "transcript_segments": len(session.transcript_segments),
                        "total_transcript_segments": session.total_transcript_segments,
                        "committed_terms": len(session.committed_terms),
                        "active_ai_tasks": len(session.active_ai_tasks),
                    }
                    for session in self._sessions.values()
                ],
            }


registry = SessionRegistry()
whisper_agent: WhisperAgent | None = None
context_agent: ContextAgent | None = None

app = FastAPI(title="VoiceContract Pro Capture Engine", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["authorization", "content-type", "x-capture-timestamp", "x-capture-signature"],
)
app.include_router(create_sessions_router(registry))


@app.on_event("startup")
async def startup() -> None:
    global whisper_agent, context_agent
    try:
        whisper_agent = WhisperAgent()
        context_agent = ContextAgent()
        logger.info("linguistic_agents_ready whisper_model=%s context_model=%s", whisper_agent.model, context_agent.model)
    except (TranscriptionError, ContextAgentError) as exc:
        logger.error("linguistic_agents_unavailable error=%s", exc)


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    return {
        "ok": True,
        "agents": {
            "whisper": whisper_agent is not None,
            "context": context_agent is not None,
        },
        "capture": await registry.snapshot(),
    }


def _origin_allowed(websocket: WebSocket) -> bool:
    origin = websocket.headers.get("origin")
    return origin is None or origin in ALLOWED_ORIGINS


def _authorized(websocket: WebSocket) -> bool:
    if not CAPTURE_SHARED_SECRET:
        return True

    timestamp = websocket.query_params.get("ts") or websocket.headers.get("x-capture-timestamp", "")
    signature = websocket.query_params.get("sig") or websocket.headers.get("x-capture-signature", "")
    client_id = websocket.query_params.get("client_id", "")
    if not timestamp or not signature or not client_id:
        return False

    try:
        age_seconds = abs(time.time() - float(timestamp))
    except ValueError:
        return False

    if age_seconds > 30:
        return False

    expected = hmac.new(
        CAPTURE_SHARED_SECRET.encode("utf-8"),
        f"{client_id}.{timestamp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def _parse_audio_packet(data: bytes) -> AudioPacket:
    if len(data) < HEADER.size:
        raise ValueError("audio packet smaller than protocol header")
    if len(data) - HEADER.size > MAX_AUDIO_PAYLOAD_BYTES:
        raise ValueError("audio packet exceeds maximum payload size")

    magic, version, channel_value, sequence, sample_rate, frames, sent_at_ms, _reserved = HEADER.unpack_from(data)
    if magic != MAGIC:
        raise ValueError("invalid audio packet magic")
    if version != PROTOCOL_VERSION:
        raise ValueError("unsupported audio protocol version")
    if sample_rate < 8000 or sample_rate > 192000:
        raise ValueError("invalid sample rate")
    if frames <= 0 or frames > sample_rate:
        raise ValueError("invalid frame count")

    try:
        channel = AudioChannel(channel_value)
    except ValueError as exc:
        raise ValueError("invalid audio channel") from exc

    payload = memoryview(data)[HEADER.size:]
    expected_payload_bytes = frames * 2
    if len(payload) != expected_payload_bytes:
        raise ValueError("payload length does not match int16 frame count")

    return AudioPacket(
        channel=channel,
        sequence=sequence,
        sample_rate=sample_rate,
        frames=frames,
        sent_at_ms=sent_at_ms,
        received_at_monotonic=time.monotonic(),
        payload=payload,
    )


async def _audio_consumer(session: CaptureSession) -> None:
    accumulators = {
        AudioChannel.MICROPHONE: AudioAccumulator(AudioChannel.MICROPHONE),
        AudioChannel.SYSTEM: AudioAccumulator(AudioChannel.SYSTEM),
        AudioChannel.MIXED: AudioAccumulator(AudioChannel.MIXED),
    }
    try:
        while True:
            packet = await session.queue.get()
            if packet is None:
                await _flush_accumulators(session, accumulators)
                return

            latency_ms = max(0.0, (time.time() * 1000.0) - packet.sent_at_ms)
            if latency_ms > 100:
                logger.info(
                    "capture_latency session=%s channel=%s seq=%s latency_ms=%.2f queue=%s",
                    session.session_id,
                    packet.channel.name,
                    packet.sequence,
                    latency_ms,
                    session.queue.qsize(),
                )

            accumulator = accumulators[packet.channel]
            accumulator.append(packet)
            packet.payload.release()

            if accumulator.duration_seconds >= TRANSCRIBE_CHUNK_SECONDS:
                await _schedule_transcription(session, accumulator)
            elif accumulator.duration_seconds >= TRANSCRIBE_MAX_CHUNK_SECONDS:
                await _schedule_transcription(session, accumulator)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("audio_consumer_failed session=%s", session.session_id)
        session.closed.set()


async def _flush_accumulators(session: CaptureSession, accumulators: dict[AudioChannel, AudioAccumulator]) -> None:
    for accumulator in accumulators.values():
        if accumulator.duration_seconds >= 0.5:
            await _schedule_transcription(session, accumulator)


async def _schedule_transcription(session: CaptureSession, accumulator: AudioAccumulator) -> None:
    if len(session.active_ai_tasks) >= MAX_AI_TASKS_PER_SESSION:
        logger.warning("ai_task_drop session=%s channel=%s active=%s", session.session_id, accumulator.channel.name, len(session.active_ai_tasks))
        accumulator.clear()
        return

    chunk = accumulator.pop_chunk()
    if chunk is None:
        return

    pcm, sample_rate, frames, started_at_ms = chunk
    task = asyncio.create_task(
        _process_audio_chunk(
            session=session,
            channel=accumulator.channel,
            pcm=pcm,
            sample_rate=sample_rate,
            frames=frames,
            started_at_ms=started_at_ms,
        ),
        name=f"linguistic-{session.session_id}-{accumulator.channel.name}",
    )
    session.remember_task(task)


async def _process_audio_chunk(
    *,
    session: CaptureSession,
    channel: AudioChannel,
    pcm: bytes,
    sample_rate: int,
    frames: int,
    started_at_ms: float,
) -> None:
    if whisper_agent is None:
        await session.emit({"type": "error", "code": "whisper_unavailable", "detail": "Transcription agent is not configured."})
        return

    try:
        result = await whisper_agent.transcribe_pcm16(pcm=pcm, sample_rate=sample_rate)
    except TranscriptionError as exc:
        logger.warning("transcription_failed session=%s channel=%s error=%s", session.session_id, channel.name, exc)
        await session.emit({"type": "error", "code": "transcription_failed", "detail": str(exc)})
        return

    if not result.text:
        return

    segment = TranscriptSegment(
        channel=channel,
        text=result.text,
        started_at_ms=started_at_ms,
        duration_seconds=frames / sample_rate,
    )

    async with session.lock:
        session.transcript_segments.append(segment)
        session.full_transcript_segments.append(segment)
        session.total_transcript_segments += 1
        transcript_index = session.total_transcript_segments

    await session.emit(
        {
            "type": "transcript",
            "session_id": session.session_id,
            "channel": channel.name.lower(),
            "text": result.text,
            "duration_seconds": round(result.duration_seconds, 3),
            "model": result.model,
        }
    )
    await _maybe_schedule_context_analysis(session, transcript_index)


async def _maybe_schedule_context_analysis(session: CaptureSession, transcript_index: int) -> None:
    if context_agent is None:
        return
    now = time.monotonic()
    if now - session.last_context_run < CONTEXT_MIN_INTERVAL_SECONDS:
        return

    async with session.lock:
        segments = list(session.transcript_segments)
        available_start = session.total_transcript_segments - len(segments)
        start_offset = max(0, session.context_cursor - available_start)
        delta_segments = segments[start_offset:]
        delta_text = "\n".join(segment.render() for segment in delta_segments)
        if len(delta_text) < CONTEXT_MIN_DELTA_CHARS:
            return
        session.context_cursor = transcript_index
        session.last_context_run = now
        recent_text = "\n".join(segment.render() for segment in segments[-24:])
        known = [_commitment_payload(commitment) for commitment in session.committed_terms.values()]

    if len(session.active_ai_tasks) >= MAX_AI_TASKS_PER_SESSION:
        return

    task = asyncio.create_task(
        _run_context_analysis(session=session, recent_text=recent_text, known_commitments=known),
        name=f"context-{session.session_id}",
    )
    session.remember_task(task)


async def _run_context_analysis(
    *,
    session: CaptureSession,
    recent_text: str,
    known_commitments: list[dict[str, Any]],
) -> None:
    if context_agent is None:
        return
    try:
        analysis = await context_agent.analyze_delta(
            recent_transcript=recent_text,
            known_commitments=known_commitments,
            meeting_context={"session_id": session.session_id, "locale": "India", "currency": "INR"},
        )
    except ContextAgentError as exc:
        logger.warning("context_analysis_failed session=%s error=%s", session.session_id, exc)
        await session.emit({"type": "error", "code": "context_failed", "detail": str(exc)})
        return

    new_commitments: list[Commitment] = []
    async with session.lock:
        for commitment in analysis.commitments:
            if commitment.dedupe_key in session.committed_terms:
                continue
            session.committed_terms[commitment.dedupe_key] = commitment
            new_commitments.append(commitment)

    for commitment in new_commitments:
        await session.emit(
            {
                "type": "pulse",
                "session_id": session.session_id,
                "pulse": {
                    "kind": "firm_commitment",
                    "term": _commitment_payload(commitment),
                    "summary": analysis.summary,
                    "created_at": time.time(),
                },
            }
        )


def _commitment_payload(commitment: Commitment) -> dict[str, Any]:
    return {
        "type": commitment.type,
        "value": commitment.value,
        "confidence": commitment.confidence,
        "speaker": commitment.speaker,
        "evidence": commitment.evidence,
        "legal_weight": commitment.legal_weight,
        "normalized": commitment.normalized,
    }


async def _send_json(websocket: WebSocket, payload: dict[str, Any]) -> None:
    if websocket.client_state == WebSocketState.CONNECTED:
        await websocket.send_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))


async def _websocket_sender(session: CaptureSession, websocket: WebSocket) -> None:
    try:
        while True:
            payload = await session.outbound.get()
            if payload is None:
                return
            await _send_json(websocket, payload)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("websocket_sender_failed session=%s", session.session_id)
        session.closed.set()


async def _shutdown_session(session: CaptureSession, tasks: list[asyncio.Task[Any]]) -> None:
    await registry.remove(session.session_id)
    try:
        session.queue.put_nowait(None)
    except asyncio.QueueFull:
        pass
    try:
        session.outbound.put_nowait(None)
    except asyncio.QueueFull:
        pass

    for task in list(session.active_ai_tasks):
        task.cancel()

    try:
        await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=1.5)
    except asyncio.TimeoutError:
        for task in tasks:
            task.cancel()

    await asyncio.gather(*session.active_ai_tasks, *tasks, return_exceptions=True)


@app.websocket("/ws/capture")
async def capture_websocket(websocket: WebSocket) -> None:
    if not _origin_allowed(websocket):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="origin not allowed")
        return
    if not _authorized(websocket):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="capture authentication failed")
        return

    client_id = websocket.query_params.get("client_id") or secrets.token_urlsafe(12)
    await websocket.accept(subprotocol="vcp.audio.v1")
    session = await registry.create(client_id=client_id)
    consumer_task = asyncio.create_task(_audio_consumer(session), name=f"capture-consumer-{session.session_id}")
    sender_task = asyncio.create_task(_websocket_sender(session, websocket), name=f"capture-sender-{session.session_id}")

    await session.emit(
        {
            "type": "ready",
            "session_id": session.session_id,
            "protocol": "vcp.audio.v1",
            "max_payload_bytes": MAX_AUDIO_PAYLOAD_BYTES,
            "queue_capacity": MAX_QUEUE_CHUNKS,
            "linguistic_layer": {
                "whisper": whisper_agent is not None,
                "context": context_agent is not None,
                "chunk_seconds": TRANSCRIBE_CHUNK_SECONDS,
            },
        }
    )

    try:
        while not session.closed.is_set():
            try:
                message = await asyncio.wait_for(websocket.receive(), timeout=SESSION_IDLE_TIMEOUT_SECONDS)
            except asyncio.TimeoutError:
                await session.emit({"type": "ping", "ts": time.time()})
                continue

            if message["type"] == "websocket.disconnect":
                break

            if "text" in message:
                if len(message["text"].encode("utf-8")) > MAX_CONTROL_BYTES:
                    await websocket.close(code=status.WS_1009_MESSAGE_TOO_BIG, reason="control message too large")
                    break
                try:
                    control = json.loads(message["text"])
                except json.JSONDecodeError:
                    await session.emit({"type": "error", "code": "bad_control_json"})
                    continue

                if control.get("type") == "stop":
                    await session.emit({"type": "stopping", "session_id": session.session_id})
                    break
                if control.get("type") == "pong":
                    session.last_seen = time.monotonic()
                    continue
                await session.emit({"type": "ack", "received": control.get("type", "unknown")})
                continue

            data = message.get("bytes")
            if data is None:
                continue

            try:
                packet = _parse_audio_packet(data)
            except ValueError as exc:
                logger.warning("bad_audio_packet session=%s error=%s", session.session_id, exc)
                await session.emit({"type": "error", "code": "bad_audio_packet", "detail": str(exc)})
                continue

            if session.queue.full():
                session.packets_dropped += 1
                packet.payload.release()
                await session.emit({"type": "backpressure", "queue": session.queue.qsize()})
                continue

            session.mark_packet(packet)
            session.queue.put_nowait(packet)

    except WebSocketDisconnect:
        pass
    finally:
        await _shutdown_session(session, [consumer_task, sender_task])
        logger.info(
            "capture_closed session=%s packets=%s dropped=%s bytes=%s terms=%s",
            session.session_id,
            session.packets_received,
            session.packets_dropped,
            session.bytes_received,
            len(session.committed_terms),
        )
