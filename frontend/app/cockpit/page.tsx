"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter } from "next/navigation";
import Background3D from "@/components/Background3D";

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

  // Smooth Sine Waveform
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
        const amplitude = isCapturing ? Math.sin(i * 0.04 + phase) * Math.cos(i * 0.01 - phase) * 40 : 2;
        const y = (canvas.height / 2) + amplitude;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = "oklch(70% 0.18 195)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      phase += 0.08;
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  return (
    <div className="min-h-screen bg-void text-text font-sans flex flex-col overflow-hidden bureau-grid-light relative">
      <Background3D />

      {/* Header */}
      <header className="h-24 border-b border-border flex items-center justify-between px-12 bg-surface/60 backdrop-blur-3xl z-50 shadow-premium">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isCapturing ? 'bg-signal animate-pulse shadow-[0_0_15px_oklch(var(--signal))]' : 'bg-border'}`} />
            <span className="font-system text-[11px] font-black tracking-widest uppercase text-text/30">
              Perception_Array: {sessionId?.slice(0,12) || "STANDBY"}
            </span>
          </div>
        </div>
        <div className="font-display text-3xl tracking-tight text-text">Voice<span className="text-signal italic">Cockpit</span></div>
        <div className="flex gap-6">
          {!isCapturing ? (
            <button 
              onClick={start} 
              className="px-10 py-4 bg-text text-void font-sans font-black text-xs uppercase tracking-widest rounded-2xl shadow-premium hover:bg-signal transition-all active:scale-[0.98]"
            >
              Start Interception
            </button>
          ) : (
            <button 
              onClick={() => { stop(); router.push(`/processing?session=${sessionId}`); }} 
              className="px-10 py-4 bg-red-500 text-white font-sans font-black text-xs uppercase tracking-widest rounded-2xl shadow-premium hover:bg-red-600 transition-all active:scale-[0.98]"
            >
              Terminate & Synthesize
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10">
        {/* Left: Transcription */}
        <section className="flex-[2.5] border-r border-border flex flex-col bg-surface/20 relative backdrop-blur-sm">
          <div className="h-56 border-b border-border relative overflow-hidden flex items-center justify-center bg-void/30">
            <canvas ref={canvasRef} width={1200} height={200} className="w-full h-full opacity-80" />
            <div className="absolute top-6 left-8 font-system text-[10px] font-black text-text/20 uppercase tracking-[0.4em]">Acoustic_Stream</div>
            {isCapturing && (
               <div className="absolute top-6 right-8 bg-signal/10 border border-signal/30 px-4 py-1.5 rounded-full text-[10px] font-black text-signal uppercase tracking-widest">
                 Streaming_Active
               </div>
            )}
          </div>
          
          <div className="flex-1 p-16 overflow-y-auto custom-scrollbar flex flex-col justify-end">
             <AnimatePresence mode="popLayout">
               {transcript ? (
                 <motion.p 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-4xl leading-[1.3] text-text font-display tracking-tight"
                 >
                   {transcript}
                   <motion.span 
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="inline-block w-4 h-10 bg-signal/40 ml-4 align-middle"
                   />
                 </motion.p>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-6 opacity-10">
                   <div className="w-20 h-20 border-2 border-text rounded-full animate-ping" />
                   <span className="font-sans text-lg font-black tracking-[0.6em] uppercase">Awaiting Transmission</span>
                 </div>
               )}
             </AnimatePresence>
          </div>
        </section>

        {/* Right: Intelligence */}
        <section className="flex-1 flex flex-col bg-surface/80 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
          
          {/* Truth Board Overlay */}
          <div className="p-10 border-b border-border relative">
            <div className="font-sans text-[12px] font-black text-text/40 uppercase tracking-[0.4em] mb-10 italic flex items-center gap-3">
              <div className="w-4 h-[1px] bg-text/20" />
              The Truth Board
            </div>
            <div className="grid grid-cols-2 gap-5">
              {PILLARS.map(pillar => {
                const isLocked = lockedPillars[pillar];
                return (
                  <motion.div 
                    key={pillar} 
                    layout
                    className={`p-5 rounded-[28px] border transition-all duration-700 ${
                      isLocked ? 'border-signal/40 bg-signal/5 shadow-premium scale-[1.05]' : 'border-border bg-void/50 opacity-40'
                    }`}
                  >
                    <div className="font-system text-[10px] font-black uppercase text-text/30 mb-2 tracking-widest">{pillar}</div>
                    <div className={`font-sans text-sm font-black truncate ${isLocked ? 'text-signal' : 'text-text/10'}`}>
                      {isLocked ? lockedPillars[pillar] : "..."}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Pulse Feed */}
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            <div className="font-sans text-[12px] font-black text-text/40 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
               <div className="w-4 h-[1px] bg-text/20" />
               Tactical Stream
            </div>
            <AnimatePresence initial={false}>
              {pulses.map(pulse => (
                <motion.div 
                  key={pulse.id} 
                  initial={{ opacity: 0, x: 50, scale: 0.9 }} 
                  animate={{ opacity: 1, x: 0, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9, y: -20 }} 
                  className={`p-6 rounded-[32px] border shadow-premium relative overflow-hidden ${
                    pulse.source === "STRATEGIST" ? 'border-yellow-200 bg-yellow-50/40' : 'border-signal/20 bg-signal/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className={`font-sans text-[11px] font-black uppercase tracking-[0.2em] ${
                      pulse.source === "STRATEGIST" ? 'text-yellow-600' : 'text-signal'
                    }`}>{pulse.source}</span>
                    <span className="font-system text-[10px] text-text/20 font-bold">{pulse.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-base text-text font-bold leading-relaxed tracking-tight">{pulse.content}</p>
                  
                  {pulse.source === "STRATEGIST" && (
                     <div className="absolute bottom-0 right-0 p-2 opacity-5 translate-x-4 translate-y-4">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                     </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
