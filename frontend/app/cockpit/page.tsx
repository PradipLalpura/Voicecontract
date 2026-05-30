"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter, useSearchParams } from "next/navigation";

/* ─── Types ─── */
interface TranscriptSegment {
  text: string;
  channel: number;
  timestamp: number;
}

interface Commitment {
  type: string;
  value: string;
  confidence: number;
  legal_weight: string;
}

interface CoachTip {
  id: number;
  kind: string;
  content: string;
  urgency: string;
  addedAt: number;
}

let tipCounter = 0;

/* ─── Main Cockpit Content ─── */
function CockpitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const coachEnabled = searchParams.get("coach") !== "false";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  /* State */
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [commitments, setCommitments] = useState<Record<string, Commitment>>({});
  const [coachTips, setCoachTips] = useState<CoachTip[]>([]);
  const [isEnding, setIsEnding] = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* Coach tip auto-expire — remove after 30s */
  useEffect(() => {
    if (coachTips.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setCoachTips(prev => prev.filter(t => now - t.addedAt < 30000));
    }, 5000);
    return () => clearInterval(interval);
  }, [coachTips.length]);

  /* Auto-scroll transcript */
  useEffect(() => {
    transcriptScrollRef.current?.scrollTo({
      top: transcriptScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcriptSegments]);

  /* Event handler for useLiveAudio */
  const handleEvent = useCallback((event: any) => {
    if (event.type === "transcript") {
      setTranscriptSegments(prev => [
        ...prev,
        {
          text: event.text,
          channel: event.channel ?? 1,
          timestamp: Date.now(),
        },
      ]);
    } else if (event.type === "pulse") {
      if (event.kind === "SIGNAL") {
        // Commitment extraction — update by type (latest wins)
        const commitType = event.pillar || event.kind || "UNKNOWN";
        setCommitments(prev => ({
          ...prev,
          [commitType]: {
            type: commitType,
            value: event.value || event.content || "",
            confidence: event.confidence ?? 0.8,
            legal_weight: event.urgency === "high" ? "firm" : "tentative",
          },
        }));
      } else if (event.kind === "TIP" && coachEnabled) {
        tipCounter += 1;
        setCoachTips(prev => [
          ...prev,
          {
            id: tipCounter,
            kind: event.kind,
            content: event.content,
            urgency: event.urgency || "low",
            addedAt: Date.now(),
          },
        ]);
      }
    }
  }, [coachEnabled]);

  const { start, stop, isCapturing, status, error } = useLiveAudio({
    enableSystemAudio: true,
    enableMicrophone: true,
    onEvent: handleEvent,
    sharedSecretSigner: async (clientId, ts) => {
      try {
        const res = await fetch("/api/ws-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });
        if (!res.ok) return "dev_signature_bypass";
        const data = await res.json();
        return data.token;
      } catch {
        return "dev_signature_bypass";
      }
    },
  });

  /* Meeting timer */
  useEffect(() => {
    if (isCapturing) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCapturing]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* End meeting handler */
  const handleEndMeeting = useCallback(() => {
    if (transcriptSegments.length === 0) {
      setShowEmptyWarning(true);
      return;
    }
    setIsEnding(true);
    stop();
    router.push(`/processing?session=${sessionId}`);
  }, [transcriptSegments, stop, router, sessionId]);

  const forceEndMeeting = useCallback(() => {
    setIsEnding(true);
    setShowEmptyWarning(false);
    stop();
    router.push(`/processing?session=${sessionId}`);
  }, [stop, router, sessionId]);

  /* Audio waveform */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId: number;
    let phase = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        const amplitude = isCapturing ? Math.sin(i * 0.02 + phase) * 50 + Math.random() * 12 : 2;
        const y = (canvas.height / 2) + amplitude;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = isCapturing ? "#2563EB" : "#94a3b8";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      phase += 0.08;
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  const commitmentCount = Object.keys(commitments).length;

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col premium-noise overflow-hidden">
      
      {/* Cockpit Header */}
      <header className="h-20 border-b border-border flex items-center justify-between px-8 md:px-12 bg-white/60 backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
           <button onClick={() => router.push('/dashboard')} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-text-muted">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div className="space-y-0.5">
              <h2 className="font-black text-lg tracking-tighter uppercase italic">Meeting_Interception</h2>
              <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : status === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-300'}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                   {isCapturing ? 'Recording' : status === 'reconnecting' ? 'Reconnecting...' : status === 'error' ? 'Error' : 'Standby'}
                 </span>
                 {isCapturing && (
                   <span className="text-[10px] font-mono font-bold text-text-muted tabular-nums">{formatTime(elapsedSeconds)}</span>
                 )}
              </div>
           </div>
        </div>

        <div className="flex gap-3 items-center">
          {error && (
            <span className="text-xs text-red-500 font-bold max-w-[200px] truncate">{error}</span>
          )}
          {!isCapturing ? (
            <button onClick={start} disabled={status === "connecting" || status === "requesting-permission"} className="px-8 py-3 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
              {status === "connecting" ? "Connecting..." : status === "requesting-permission" ? "Allow_Mic..." : "Start_Legal_Engine"}
            </button>
          ) : (
            <button
              onClick={handleEndMeeting}
              disabled={isEnding}
              className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isEnding ? "Ending..." : "End_Meeting & Mint_Documents"}
            </button>
          )}
        </div>
      </header>

      {/* Empty transcript warning modal */}
      <AnimatePresence>
        {showEmptyWarning && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl border border-border"
            >
              <div className="flex items-start gap-4 mb-6">
                <svg className="w-8 h-8 text-yellow-500 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <h3 className="text-lg font-black text-text mb-2">No Transcript Detected</h3>
                  <p className="text-sm text-text-muted leading-relaxed">No speech was captured during this session. Ending now will produce an empty contract. Are you sure?</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowEmptyWarning(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-bold text-text hover:bg-slate-50 transition-colors">Continue Meeting</button>
                <button onClick={forceEndMeeting} className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">End Anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Transcription + Waves + Coach */}
        <div className="flex-1 flex flex-col p-6 md:p-10 gap-6 overflow-hidden">
           
           {/* Audio Visualizer */}
           <div className="w-full h-48 bg-surface border border-border rounded-3xl relative overflow-hidden shadow-inner flex flex-col justify-end shrink-0">
              <canvas ref={canvasRef} width={1200} height={180} className="w-full h-full opacity-60" />
              <div className="absolute top-6 left-8 flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-0.5">Acoustic_Input</span>
                 <span className="text-[10px] font-bold text-text-muted">48kHz · E2EE · {commitmentCount} terms detected</span>
              </div>
           </div>

           {/* Negotiation Coach Tips */}
           {coachEnabled && coachTips.length > 0 && (
             <div className="space-y-3 shrink-0">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Negotiation_Coach</span>
               <AnimatePresence>
                 {coachTips.slice(-3).map((tip) => (
                   <motion.div
                     key={tip.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className={`p-5 rounded-2xl border ${
                       tip.urgency === "high"
                         ? "bg-yellow-50 border-yellow-200"
                         : "bg-blue-50 border-blue-200"
                     }`}
                   >
                     <div className="text-[10px] font-black uppercase tracking-widest mb-1.5">
                       {tip.urgency === "high" ? "⚡ URGENT" : "💡 TIP"}
                     </div>
                     <p className="text-sm font-bold text-text leading-relaxed">{tip.content}</p>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
           )}

           {/* Live Transcription Feed */}
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" ref={transcriptScrollRef}>
             {transcriptSegments.length > 0 ? (
               <div className="space-y-4">
                 {transcriptSegments.map((seg, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex gap-4 items-start"
                   >
                     <span className={`text-[10px] font-black uppercase tracking-widest w-14 shrink-0 pt-1 ${
                       seg.channel === 1 ? 'text-primary' : 'text-accent'
                     }`}>
                       {seg.channel === 1 ? "YOU" : "CLIENT"}
                     </span>
                     <div className="flex-1">
                       <p className="text-sm font-medium text-text leading-relaxed">{seg.text}</p>
                       <span className="text-[9px] text-text-muted font-mono tabular-nums">
                         {new Date(seg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
                     </div>
                   </motion.div>
                 ))}
                 {isCapturing && (
                   <div className="flex gap-4 items-center">
                     <span className="w-14" />
                     <span className="inline-block w-3 h-6 bg-primary/30 animate-pulse rounded-sm" />
                   </div>
                 )}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center gap-4 text-text-muted opacity-30">
                 <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 <span className="text-lg font-black uppercase tracking-widest italic">Awaiting_Signal...</span>
                 <span className="text-xs font-medium">Start the legal engine to begin recording</span>
               </div>
             )}
           </div>
        </div>

        {/* Right: Live Auditor Panel */}
        <aside className="w-full md:w-96 bg-surface border-t md:border-t-0 md:border-l border-border p-8 flex flex-col gap-8 overflow-y-auto">
           <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live_Auditor</span>
              <h3 className="text-xl font-black tracking-tight uppercase italic">Term_Validation</h3>
           </div>

           {/* Commitment cards from AI */}
           <div className="flex-1 space-y-3">
             {Object.keys(commitments).length > 0 ? (
               Object.entries(commitments).map(([type, commitment]) => (
                 <motion.div
                   key={type}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={`p-5 rounded-2xl border transition-all duration-500 flex items-center justify-between ${
                     commitment.legal_weight === 'firm'
                       ? 'bg-green-50 border-green-200'
                       : 'bg-yellow-50 border-yellow-200'
                   }`}
                 >
                   <div className="flex-1 min-w-0">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${
                       commitment.legal_weight === 'firm' ? 'text-green-600' : 'text-yellow-600'
                     }`}>{type}</span>
                     <p className="text-sm font-bold text-text mt-1 truncate">{commitment.value}</p>
                   </div>
                   <div className={`w-4 h-4 rounded-full shrink-0 ml-3 ${
                     commitment.legal_weight === 'firm' ? 'bg-green-500' : 'bg-yellow-400'
                   }`} />
                 </motion.div>
               ))
             ) : (
               /* Fallback: show the 5 static term slots awaiting detection */
               <>
                 {[
                   { id: 'scope', label: 'Scope of Work' },
                   { id: 'price', label: 'Total Consideration' },
                   { id: 'timeline', label: 'Delivery Timeline' },
                   { id: 'revisions', label: 'Revision Policy' },
                   { id: 'ip', label: 'IP Rights' },
                 ].map((term) => (
                   <div key={term.id} className="p-5 rounded-2xl border border-border bg-background opacity-50 flex items-center justify-between">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-text">{term.label}</span>
                       <span className="text-[10px] font-medium text-text-muted">Awaiting mention...</span>
                     </div>
                     <div className="w-6 h-6 bg-slate-100 rounded-full border-2 border-dashed border-slate-300" />
                   </div>
                 ))}
               </>
             )}
           </div>

           {/* Summary footer */}
           <div className="space-y-3">
             <div className="bg-surface-muted p-5 rounded-2xl border border-border">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Session Progress</span>
                 <span className="text-sm font-black text-text tabular-nums">{commitmentCount}/5</span>
               </div>
               <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                 <motion.div
                   className="h-full bg-primary rounded-full"
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, (commitmentCount / 5) * 100)}%` }}
                   transition={{ duration: 0.6, ease: "easeOut" }}
                 />
               </div>
             </div>

             <div className="bg-red-50 border border-red-100 p-5 rounded-2xl">
               <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div className="space-y-0.5">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Risk_Alert</span>
                     <p className="text-[11px] font-medium text-red-700 leading-relaxed">Ensure payment schedules are mentioned clearly to generate a valid GST Invoice.</p>
                  </div>
               </div>
             </div>
           </div>
        </aside>

      </main>
    </div>
  );
}

/* ─── Suspense Wrapper (Task 1 / PRF-4) ─── */
export default function CockpitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted font-bold uppercase tracking-widest animate-pulse">Initializing Cockpit...</div>
      </div>
    }>
      <CockpitContent />
    </Suspense>
  );
}
