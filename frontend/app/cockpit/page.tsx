"use client";

import { useEffect, useRef, useState, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter } from "next/navigation";

const Background3D = lazy(() => import("@/components/Background3D"));
const CharacterScene = lazy(() => import("@/components/Background3D").then(mod => ({ default: mod.CharacterScene })));

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

const PILLARS = ["Scope", "Price", "Payment", "Timeline", "Revisions", "IP", "Termination", "Liability"];

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
      setPulses(prev => [newPulse, ...prev].slice(0, 12));
      if (newPulse.kind === "firm_commitment" || newPulse.kind === "LOCK") {
        if (newPulse.pillar) {
          const matched = PILLARS.find(p => p.toLowerCase() === newPulse.pillar?.toLowerCase() || newPulse.pillar?.toLowerCase().includes(p.toLowerCase()));
          if (matched) setLockedPillars(prev => ({ ...prev, [matched]: newPulse.value || "Confirmed" }));
        }
      }
    }
  }, []);

  const { start, stop, isCapturing, sessionId } = useLiveAudio({
    enableSystemAudio: true,
    enableMicrophone: true,
    onEvent: handleEvent,
    sharedSecretSigner: async (clientId, ts) => {
      const secret = process.env.NEXT_PUBLIC_CAPTURE_SHARED_SECRET;
      if (!secret) return "dev_signature_bypass";
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(clientId + ts));
      return Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
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
        const amplitude = isCapturing ? Math.sin(i * 0.05 + phase) * 40 : 2;
        const y = (canvas.height / 2) + amplitude;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = "oklch(70% 0.18 195)";
      ctx.lineWidth = 4;
      ctx.stroke();
      phase += 0.1;
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  return (
    <div className="min-h-screen bg-void text-text font-sans flex flex-col overflow-hidden bureau-grid-light relative">
      <Suspense fallback={null}><Background3D /></Suspense>

      <header className="h-24 border-b border-border flex items-center justify-between px-12 bg-surface/70 backdrop-blur-3xl z-50 shadow-premium">
        <div className="flex items-center gap-8">
           <div className={`w-3 h-3 rounded-full ${isCapturing ? 'bg-signal animate-pulse shadow-[0_0_15px_oklch(var(--signal))]' : 'bg-border'}`} />
           <div className="font-display text-2xl tracking-tight text-text font-bold">Cockpit <span className="text-signal italic font-normal">Terminal</span></div>
        </div>
        <div className="flex gap-6">
          {!isCapturing ? (
            <button onClick={start} className="px-10 py-4 bg-text text-void font-sans font-black text-xs uppercase tracking-widest rounded-2xl shadow-premium hover:bg-signal transition-all">Start Interception</button>
          ) : (
            <button onClick={() => { stop(); router.push(`/processing?session=${sessionId}`); }} className="px-10 py-4 bg-red-500 text-white font-sans font-black text-xs uppercase tracking-widest rounded-2xl shadow-premium hover:bg-red-600 transition-all">Terminate & Synthesize</button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10 relative">
        {/* The 3D Sentinel Character in Cockpit */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[700px] pointer-events-none opacity-20">
           <Suspense fallback={null}>
             <CharacterScene scene="https://prod.spline.design/at27hY4iI73C5L8M/scene.splinecode" className="h-full w-full scale-110" />
           </Suspense>
        </div>

        <section className="flex-[2.5] border-r border-border flex flex-col bg-surface/10 backdrop-blur-md">
          <div className="h-48 border-b border-border relative overflow-hidden bg-void/40">
            <canvas ref={canvasRef} width={1200} height={192} className="w-full h-full opacity-60" />
            <div className="absolute top-6 left-8 font-system text-[10px] font-black text-text/30 uppercase tracking-[0.4em]">Acoustic_Vector_Feed</div>
          </div>
          <div className="flex-1 p-20 overflow-y-auto custom-scrollbar flex flex-col justify-end">
             {transcript ? (
               <p className="text-5xl leading-[1.2] text-text font-display tracking-tight transition-all">{transcript}<span className="inline-block w-4 h-12 bg-signal/30 ml-4 animate-pulse" /></p>
             ) : (
               <div className="w-full h-full flex items-center justify-center opacity-10"><span className="font-sans text-xl font-black tracking-[0.8em] uppercase">Listening</span></div>
             )}
          </div>
        </section>

        <section className="flex-1 flex flex-col bg-surface/90 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="p-10 border-b border-border">
            <div className="font-sans text-[12px] font-black text-text/40 uppercase tracking-[0.4em] mb-10 italic">The Truth Board</div>
            <div className="grid grid-cols-2 gap-5">
              {PILLARS.map(p => (
                <motion.div key={p} layout className={`p-6 rounded-[32px] border transition-all duration-700 ${lockedPillars[p] ? 'border-signal bg-signal/5 scale-[1.02]' : 'border-border bg-void/50 opacity-40'}`}>
                  <div className="font-system text-[10px] font-black uppercase text-text/40 mb-2 tracking-widest">{p}</div>
                  <div className={`font-sans text-sm font-black truncate ${lockedPillars[p] ? 'text-signal' : 'text-text/10'}`}>{lockedPillars[p] || "..."}</div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            <div className="font-sans text-[12px] font-black text-text/40 uppercase tracking-[0.4em] mb-4">Strategic Pulse</div>
            <AnimatePresence initial={false}>
              {pulses.map(pulse => (
                <motion.div key={pulse.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`p-7 rounded-[40px] border shadow-2xl ${pulse.source === "STRATEGIST" ? 'border-yellow-200 bg-yellow-50/50' : 'border-signal/20 bg-signal/5'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${pulse.source === "STRATEGIST" ? 'text-yellow-600' : 'text-signal'}`}>{pulse.source}</span>
                    <span className="font-system text-[9px] text-text/20">{pulse.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-base text-text font-bold leading-relaxed">{pulse.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
