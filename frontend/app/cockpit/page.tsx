"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter } from "next/navigation";

// --- Types ---
type Pulse = {
  id: string;
  source: "SENTINEL" | "STRATEGIST";
  kind: string; 
  content: string;
  pillar?: string;
  value?: string;
  urgency?: string;
  timestamp: Date;
};

const PILLARS = [
  "Scope", "Price", "Payment", "Timeline", 
  "Revisions", "IP", "Termination", "Liability"
];

export default function Cockpit() {
  const router = useRouter();
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [lockedPillars, setLockedPillars] = useState<Record<string, string>>({});
  const [transcript, setTranscript] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleEvent = useCallback((event: any) => {
    if (event.type === "transcript") {
      setTranscript(prev => prev + " " + event.text);
    } else if (event.type === "pulse") {
      const newPulse: Pulse = {
        id: Math.random().toString(36).substring(7),
        source: event.source as any,
        kind: event.kind,
        content: event.content,
        pillar: event.pillar,
        value: event.value,
        urgency: event.urgency,
        timestamp: new Date()
      };
      setPulses(prev => [newPulse, ...prev].slice(0, 10));
      if (newPulse.kind === "firm_commitment" || newPulse.kind === "LOCK") {
        if (newPulse.pillar) {
          const matched = PILLARS.find(p => p.toLowerCase() === newPulse.pillar?.toLowerCase() || newPulse.pillar?.toLowerCase().includes(p.toLowerCase()));
          if (matched) {
            setLockedPillars(prev => ({ ...prev, [matched]: newPulse.value || "Confirmed" }));
          }
        }
      }
    }
  }, []);

  const { start, stop, isCapturing, sessionId } = useLiveAudio({
    enableSystemAudio: true,
    enableMicrophone: true,
    onEvent: handleEvent,
    sharedSecretSigner: async (clientId, ts) => "dev_signature_bypass" 
  });

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
        const amplitude = isCapturing ? Math.sin(i * 0.05 + phase) * Math.cos(i * 0.02 - phase) * 30 : 0;
        const y = (canvas.height / 2) + amplitude;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = "oklch(70% 0.18 195)";
      ctx.lineWidth = 2;
      ctx.stroke();
      phase += 0.1;
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  return (
    <div className="min-h-screen bg-void text-text font-sans flex flex-col overflow-hidden bureau-grid-light">
      {/* Header */}
      <header className="h-20 border-b border-border flex items-center justify-between px-10 bg-surface/80 backdrop-blur-xl z-10 shadow-premium">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isCapturing ? 'bg-signal animate-pulse' : 'bg-border'}`} />
            <span className="font-system text-[10px] font-bold tracking-widest uppercase text-text/30">
              Protocol: {sessionId?.slice(0,8) || "STANDBY"}
            </span>
          </div>
        </div>
        <div className="font-display text-2xl tracking-tight text-text">Cockpit <span className="text-signal italic">Terminal</span></div>
        <div className="flex gap-5">
          {!isCapturing ? (
            <button onClick={start} className="px-8 py-3 bg-text text-void font-sans font-bold text-xs uppercase tracking-widest rounded-xl shadow-premium hover:bg-signal transition-all">Intercept Audio</button>
          ) : (
            <button onClick={() => { stop(); router.push(`/processing?session=${sessionId}`); }} className="px-8 py-3 bg-red-500 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-xl shadow-premium hover:bg-red-600 transition-all">Finalize Meeting</button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Transcription */}
        <section className="flex-[2] border-r border-border flex flex-col bg-surface/30">
          <div className="h-40 border-b border-border relative overflow-hidden flex items-center justify-center bg-void/50">
            <canvas ref={canvasRef} width={800} height={100} className="w-full h-full opacity-60" />
            <div className="absolute top-4 left-6 font-system text-[9px] font-bold text-text/20 uppercase tracking-widest">Acoustic Feed</div>
          </div>
          <div className="flex-1 p-12 overflow-y-auto custom-scrollbar flex flex-col justify-end">
             {transcript ? (
               <p className="text-2xl leading-[1.4] text-text font-sans tracking-tight animate-in fade-in slide-in-from-bottom-4">
                 {transcript}
               </p>
             ) : (
               <div className="w-full h-full flex items-center justify-center opacity-10">
                 <span className="font-sans text-sm font-bold tracking-[0.4em] uppercase">Listening for signals...</span>
               </div>
             )}
          </div>
        </section>

        {/* Right: Intelligence */}
        <section className="flex-1 flex flex-col bg-surface shadow-2xl z-20">
          <div className="p-10 border-b border-border">
            <div className="font-sans text-[11px] font-black text-text/40 uppercase tracking-[0.3em] mb-8 italic">The Truth Board</div>
            <div className="grid grid-cols-2 gap-4">
              {PILLARS.map(pillar => {
                const isLocked = lockedPillars[pillar];
                return (
                  <div key={pillar} className={`p-4 rounded-2xl border transition-all duration-700 ${isLocked ? 'border-signal/30 bg-signal/5 shadow-beveled' : 'border-border bg-void/30 opacity-40'}`}>
                    <div className="font-system text-[9px] font-bold uppercase text-text/40 mb-1">{pillar}</div>
                    <div className={`font-sans text-xs font-bold ${isLocked ? 'text-signal' : 'text-text/20'}`}>{isLocked ? lockedPillars[pillar] : "Pending"}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-5">
            <div className="font-sans text-[11px] font-black text-text/40 uppercase tracking-[0.3em] mb-4">Strategic Pulse</div>
            <AnimatePresence>
              {pulses.map(pulse => (
                <motion.div key={pulse.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`p-5 rounded-2xl border shadow-premium ${pulse.source === "STRATEGIST" ? 'border-yellow-200 bg-yellow-50/50' : 'border-signal/20 bg-signal/5'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${pulse.source === "STRATEGIST" ? 'text-yellow-600' : 'text-signal'}`}>{pulse.source}</span>
                    <span className="font-system text-[9px] text-text/30">{pulse.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-text font-medium leading-relaxed">{pulse.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
