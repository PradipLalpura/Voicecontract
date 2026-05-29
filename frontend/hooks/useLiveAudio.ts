"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CaptureStatus =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "capturing"
  | "reconnecting"
  | "stopped"
  | "error";

type CaptureSource = "microphone" | "system";

type LiveAudioOptions = {
  wsUrl?: string;
  clientId?: string;
  enableMicrophone?: boolean;
  enableSystemAudio?: boolean;
  chunkFrames?: number;
  maxBufferedAmount?: number;
  reconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  sharedSecretSigner?: (clientId: string, timestamp: string) => Promise<string> | string;
  onEvent?: (event: LiveAudioEvent) => void;
};

type LiveAudioEvent =
  | { type: "ready"; sessionId: string }
  | { type: "dropped"; source: CaptureSource; reason: string }
  | { type: "backpressure"; queue?: number }
  | { type: "error"; message: string }
  | { type: "stopped" };

type WorkletMessage =
  | {
      type: "audio";
      source: CaptureSource;
      sequence: number;
      sampleRate: number;
      frames: number;
      sentAtMs: number;
      pcm: ArrayBuffer;
    }
  | { type: "overflow"; source: CaptureSource; droppedFrames: number }
  | { type: "ready"; source: CaptureSource };

const MAGIC = 0x56435031;
const VERSION = 1;
const CHANNELS: Record<CaptureSource, number> = {
  microphone: 1,
  system: 2,
};
const HEADER_BYTES = 32;

function defaultWsUrl(): string {
  if (typeof window === "undefined") {
    return "ws://localhost:8000/ws/capture";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST || "localhost:8000";
  return `${protocol}//${host}/ws/capture`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function makeClientId(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    return `client_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildAudioPacket(message: Extract<WorkletMessage, { type: "audio" }>): ArrayBuffer {
  const packet = new ArrayBuffer(HEADER_BYTES + message.pcm.byteLength);
  const view = new DataView(packet);
  view.setUint32(0, MAGIC, true);
  view.setUint16(4, VERSION, true);
  view.setUint16(6, CHANNELS[message.source], true);
  view.setUint32(8, message.sequence, true);
  view.setUint32(12, message.sampleRate, true);
  view.setUint32(16, message.frames, true);
  view.setFloat64(20, message.sentAtMs, true);
  view.setUint32(28, 0, true);
  new Uint8Array(packet, HEADER_BYTES).set(new Uint8Array(message.pcm));
  return packet;
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useLiveAudio(options: LiveAudioOptions = {}) {
  const {
    wsUrl = defaultWsUrl(),
    clientId: providedClientId,
    enableMicrophone = true,
    enableSystemAudio = true,
    chunkFrames = 960,
    maxBufferedAmount = 512 * 1024,
    reconnectAttempts = 3,
    reconnectBaseDelayMs = 250,
    sharedSecretSigner,
    onEvent,
  } = options;

  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);

  const clientIdRef = useRef(providedClientId || makeClientId());
  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const stoppingRef = useRef(false);
  const reconnectingRef = useRef(false);
  const pendingRef = useRef<ArrayBuffer[]>([]);

  const emit = useCallback(
    (event: LiveAudioEvent) => {
      onEvent?.(event);
    },
    [onEvent],
  );

  const closeGraph = useCallback(async () => {
    nodesRef.current.forEach((node) => node.disconnect());
    nodesRef.current = [];
    stopStream(micStreamRef.current);
    stopStream(systemStreamRef.current);
    micStreamRef.current = null;
    systemStreamRef.current = null;
    setIsMicrophoneActive(false);
    setIsSystemAudioActive(false);

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") {
      await audioContext.close();
    }
  }, []);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop" }));
      socket.close(1000, "capture stopped");
    } else if (socket && socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  }, []);

  const stop = useCallback(async () => {
    stoppingRef.current = true;
    closeSocket();
    await closeGraph();
    pendingRef.current = [];
    setStatus("stopped");
    emit({ type: "stopped" });
  }, [closeGraph, closeSocket, emit]);

  const connectSocket = useCallback(async (): Promise<WebSocket> => {
    const timestamp = String(Date.now() / 1000);
    const url = new URL(wsUrl, window.location.href);
    url.searchParams.set("client_id", clientIdRef.current);
    if (sharedSecretSigner) {
      const signature = await sharedSecretSigner(clientIdRef.current, timestamp);
      url.searchParams.set("ts", timestamp);
      url.searchParams.set("sig", signature);
    }

    const protocols = ["vcp.audio.v1"];
    const socket = new WebSocket(url.toString(), protocols);
    socket.binaryType = "arraybuffer";

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        socket.close();
        reject(new Error("Timed out connecting to capture WebSocket"));
      }, 8000);

      socket.onopen = () => {
        window.clearTimeout(timeout);
        resolve(socket);
      };
      socket.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Capture WebSocket connection failed"));
      };
    });
  }, [sharedSecretSigner, wsUrl]);

  const sendPacket = useCallback(
    (packet: ArrayBuffer, source: CaptureSource) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        if (pendingRef.current.length < 8) {
          pendingRef.current.push(packet);
        } else {
          emit({ type: "dropped", source, reason: "socket_not_open" });
        }
        return;
      }

      if (socket.bufferedAmount > maxBufferedAmount) {
        emit({ type: "dropped", source, reason: "websocket_backpressure" });
        return;
      }

      socket.send(packet);
    },
    [emit, maxBufferedAmount],
  );

  const attachSource = useCallback(
    async (audioContext: AudioContext, stream: MediaStream, source: CaptureSource) => {
      const mediaSource = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "vcp-capture-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
        processorOptions: { source, chunkFrames },
      });

      worklet.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
        const message = event.data;
        if (message.type === "audio") {
          sendPacket(buildAudioPacket(message), message.source);
        } else if (message.type === "overflow") {
          emit({ type: "dropped", source: message.source, reason: `worklet_overflow:${message.droppedFrames}` });
        }
      };

      mediaSource.connect(worklet);
      nodesRef.current.push(mediaSource, worklet);
    },
    [chunkFrames, emit, sendPacket],
  );

  const requestStreams = useCallback(async () => {
    setStatus("requesting-permission");
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      throw new Error("Live capture requires HTTPS or localhost because browsers protect audio devices.");
    }

    if (enableMicrophone) {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });
      setIsMicrophoneActive(true);
    }

    if (enableSystemAudio) {
      systemStreamRef.current = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        } as MediaTrackConstraints,
      });
      systemStreamRef.current.getVideoTracks().forEach((track) => track.stop());
      if (systemStreamRef.current.getAudioTracks().length === 0) {
        stopStream(systemStreamRef.current);
        systemStreamRef.current = null;
        throw new Error("No system audio track was shared. Select a browser tab/window that offers audio sharing.");
      }
      setIsSystemAudioActive(true);
    }
  }, [enableMicrophone, enableSystemAudio]);

  const start = useCallback(async () => {
    if (status === "capturing" || status === "connecting" || status === "requesting-permission") {
      return;
    }

    stoppingRef.current = false;
    reconnectingRef.current = false;
    setError(null);

    try {
      await requestStreams();
      setStatus("connecting");

      const audioContext = new AudioContext({ latencyHint: "interactive", sampleRate: 48000 });
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule("/audio-processor.js");

      const socket = await connectSocket();
      socketRef.current = socket;

      const installSocketHandlers = (activeSocket: WebSocket) => {
        activeSocket.onmessage = (event) => {
          if (typeof event.data !== "string") {
            return;
          }
          let payload: { type?: string; [key: string]: unknown };
          try {
            payload = JSON.parse(event.data);
          } catch {
            emit({ type: "error", message: "Capture server sent an invalid control message." });
            return;
          }
          if (payload.type === "ready") {
            const readySessionId = String(payload.session_id || "");
            setSessionId(readySessionId);
            emit({ type: "ready", sessionId: readySessionId });
            pendingRef.current.splice(0).forEach((packet) => activeSocket.send(packet));
          } else if (payload.type === "backpressure") {
            emit({ type: "backpressure", queue: typeof payload.queue === "number" ? payload.queue : undefined });
          } else if (payload.type === "ping") {
            activeSocket.send(JSON.stringify({ type: "pong", ts: Date.now() }));
          } else if (payload.type === "error") {
            const serverMessage = payload.detail || payload.code || "Capture server error";
            emit({ type: "error", message: String(serverMessage) });
          }
        };

        activeSocket.onclose = async () => {
          if (stoppingRef.current || reconnectingRef.current) {
            return;
          }
          reconnectingRef.current = true;
          for (let attempt = 1; attempt <= reconnectAttempts && !stoppingRef.current; attempt += 1) {
            setStatus("reconnecting");
            await sleep(reconnectBaseDelayMs * 2 ** (attempt - 1));
            try {
              const replacement = await connectSocket();
              socketRef.current = replacement;
              installSocketHandlers(replacement);
              setStatus("capturing");
              reconnectingRef.current = false;
              return;
            } catch {
              continue;
            }
          }
          setError("Capture connection dropped and reconnection failed.");
          setStatus("error");
        };
      };

      installSocketHandlers(socket);

      if (micStreamRef.current) {
        await attachSource(audioContext, micStreamRef.current, "microphone");
      }
      if (systemStreamRef.current) {
        await attachSource(audioContext, systemStreamRef.current, "system");
      }

      await audioContext.resume();
      setStatus("capturing");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Unable to start live capture.";
      setError(message);
      setStatus("error");
      emit({ type: "error", message });
      await closeGraph();
      closeSocket();
    }
  }, [
    attachSource,
    closeGraph,
    closeSocket,
    connectSocket,
    emit,
    reconnectAttempts,
    reconnectBaseDelayMs,
    requestStreams,
    status,
  ]);

  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      closeSocket();
      void closeGraph();
    };
  }, [closeGraph, closeSocket]);

  return {
    start,
    stop,
    status,
    error,
    sessionId,
    clientId: clientIdRef.current,
    isCapturing: status === "capturing",
    isMicrophoneActive,
    isSystemAudioActive,
  };
}
