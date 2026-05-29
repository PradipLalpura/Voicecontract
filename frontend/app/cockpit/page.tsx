"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter } from "next/navigation";

// --- Types ---
type Pulse = {
  id: string;
  source: "SENTINEL" | "STRATEGIST";
  kind: string; // LOCK, NUDGE, TIP, SIGNAL, firm_commitment
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
  
  // Real-time audio visualizer state
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
      
      setPulses(prev => [newPulse, ...prev].slice(0, 10)); // Keep last 10
      
      if (newPulse.kind === "firm_commitment" || newPulse.kind === "LOCK") {
        if (newPulse.pillar) {
          // Find matching pillar conceptually
          const matched = PILLARS.find(p => p.toLowerCase() === newPulse.pillar?.toLowerCase() || newPulse.pillar?.toLowerCase().includes(p.toLowerCase()));
          if (matched) {
            setLockedPillars(prev => ({ ...prev, [matched]: newPulse.value || "Confirmed" }));
          }
        }
      }
    } else if (event.type === "error") {
      console.error("Audio error:", event.message);
    }
  }, []);

  const { start, stop, isCapturing, status, sessionId } = useLiveAudio({
    enableSystemAudio: true,
    enableMicrophone: true,
    onEvent: handleEvent,
    // Provide a dummy signer for testing if backend requires it but we are in dev.
    // In prod, this would hit an API to sign the timestamp.
    sharedSecretSigner: async (clientId, ts) => "dev_signature_bypass" 
  });

  // Waveform visualization (fake for layout impact without blocking main thread)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    let phase = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!isCapturing) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = "oklch(25% 0.02 260 / 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }
      
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        const amplitude = Math.sin(i * 0.05 + phase) * Math.cos(i * 0.02 - phase);
        const y = (canvas.height / 2) + amplitude * 40 * (Math.random() * 0.5 + 0.5);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = "oklch(75% 0.15 195)"; // signal cyan
      ctx.lineWidth = 2;
      ctx.stroke();
      
      phase += 0.1;
      animationId = requestAnimationFrame(draw);
    };
    
    if (isCapturing) {
      draw();
    } else {
      draw(); // Draw flat line
    }
    
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  const handleEndMeeting = async () => {
    await stop();
    if (!sessionId) return;
    
    // In real app, we'd navigate to a processing screen while the LangGraph runs
    router.push(`/processing?session=${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-void text-white font-sans flex flex-col overflow-hidden bureau-grid">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
          <span className="font-system text-xs tracking-widest uppercase text-white/50">
            Session: {sessionId || "AWAITING_INIT"}
          </span>
        </div>
        <div className="font-display text-xl text-white">VoiceContract <span className="text-signal italic">Cockpit</span></div>
        <div className="flex gap-4">
          {!isCapturing ? (
            <button 
              onClick={start}
              className="px-6 py-2 bg-signal text-void font-system text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.97] transition-all"
            >
              Intercept Audio
            </button>
          ) : (
            <button 
              onClick={handleEndMeeting}
              className="px-6 py-2 border border-red-500/50 text-red-400 font-system text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 active:scale-[0.97] transition-all"
            >
              End Meeting
            </button>
          )}
        </div>
      </header>

      {/* Main Cockpit Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Perception (Waveform + Transcript) */}
        <section className="flex-[2] border-r border-white/10 flex flex-col relative">
          
          {/* Waveform Header */}
          <div className="h-48 border-b border-white/10 relative overflow-hidden flex items-center justify-center bg-surface/30">
            <canvas ref={canvasRef} width={800} height={150} className="w-full h-full opacity-80" />
            <div className="absolute top-4 left-4 font-system text-[10px] text-white/30 uppercase tracking-widest">
              Acoustic Perception Array
            </div>
            {isCapturing && (
               <div className="absolute top-4 right-4 font-system text-[10px] text-signal uppercase tracking-widest signal-glow">
                 LIVE
               </div>
            )}
          </div>

          {/* Transcript Log */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col justify-end">
             {transcript ? (
               <p className="text-lg leading-relaxed text-white/80 font-sans">
                 {transcript}
               </p>
             ) : (
               <div className="w-full h-full flex items-center justify-center opacity-20">
                 <span className="font-system text-xs tracking-[0.5em] uppercase">Silence Detected</span>
               </div>
             )}
          </div>
        </section>

        {/* Right Column: Intelligence (Truth Board + Pulse Feed) */}
        <section className="flex-1 flex flex-col bg-surface/20">
          
          {/* Truth Board */}
          <div className="p-6 border-b border-white/10">
            <div className="font-system text-[10px] text-white/50 uppercase tracking-widest mb-6">
              The Truth Board (8 Pillars)
            </div>
            <div className="grid grid-cols-2 gap-3 grid-flow-dense">
              {PILLARS.map(pillar => {
                const isLocked = lockedPillars[pillar];
                return (
                  <div 
                    key={pillar} 
                    className={`p-3 border beveled-edge transition-all duration-500 ${
                      isLocked ? 'border-signal/50 bg-signal/5' : 'border-white/5 bg-void'
                    }`}
                  >
                    <div className="font-system text-[9px] uppercase tracking-widest mb-1 text-white/40">
                      {pillar}
                    </div>
                    <div className={`font-sans text-sm ${isLocked ? 'text-signal' : 'text-white/20'}`}>
                      {isLocked ? (lockedPillars[pillar] || "Locked") : "Pending"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pulse Feed */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            <div className="font-system text-[10px] text-white/50 uppercase tracking-widest mb-2">
              Tactical Intelligence Feed
            </div>
            
            <AnimatePresence>
              {pulses.map(pulse => (
                <motion.div
                  key={pulse.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`p-4 border beveled-edge ${
                    pulse.source === "STRATEGIST" 
                      ? 'border-yellow-500/30 bg-yellow-500/5' 
                      : 'border-signal/30 bg-signal/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-system text-[9px] uppercase tracking-widest ${
                      pulse.source === "STRATEGIST" ? 'text-yellow-500' : 'text-signal'
                    }`}>
                      {pulse.source} // {pulse.kind}
                    </span>
                    <span className="font-system text-[8px] text-white/30">
                      {pulse.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 leading-snug">
                    {pulse.content}
                  </p>
                  {pulse.value && (
                    <div className="mt-2 text-xs font-system text-signal/80 bg-signal/10 px-2 py-1 inline-block">
                      Value: {pulse.value}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {pulses.length === 0 && (
              <div className="mt-10 text-center font-system text-[10px] text-white/20 uppercase tracking-widest">
                Awaiting Intelligence...
              </div>
            )}
          </div>

        </section>

      </main>
    </div>
  );
}
