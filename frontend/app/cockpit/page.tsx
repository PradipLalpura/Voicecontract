"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter } from "next/navigation";

export default function Cockpit() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleEvent = useCallback((event: any) => {
    if (event.type === "transcript") {
      setTranscript(prev => prev + " " + event.text);
    }
  }, []);

  const { start, stop, isCapturing, sessionId, status, error } = useLiveAudio({
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
        // Smooth, soft waveform
        const amplitude = isCapturing ? Math.sin(i * 0.02 + phase) * 60 : 2;
        const y = (canvas.height / 2) + amplitude;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = "#2563EB"; // Corporate Blue
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      
      // Optional subtle fill
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.fillStyle = "rgba(37, 99, 235, 0.05)";
      ctx.fill();

      phase += 0.05;
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col premium-noise">
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-surface/80 backdrop-blur-xl z-50 shadow-sm">
        <div className="flex items-center gap-6">
           <button onClick={() => router.push('/dashboard')} className="text-text-muted hover:text-text transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div className="font-bold text-lg tracking-tight">Active Meeting</div>
           {isCapturing && (
             <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording
             </div>
           )}
           {error && (
             <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
             </div>
           )}
        </div>
        <div className="flex gap-4">
          {!isCapturing ? (
            <button onClick={start} disabled={status === "connecting" || status === "requesting-permission"} className="px-6 py-2.5 bg-text text-white rounded-full font-semibold shadow-apple hover:bg-black transition-all disabled:opacity-50">
              {status === "connecting" ? "Connecting..." : status === "requesting-permission" ? "Allow Mic..." : "Start Listening"}
            </button>
          ) : (
            <button onClick={() => { stop(); router.push(`/processing?session=${sessionId}`); }} className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold shadow-apple hover:bg-primary-hover transition-all">End & Draft Contract</button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl w-full mx-auto">
        
        {/* Soft Waveform Visualizer */}
        <div className="w-full h-64 mb-12 relative overflow-hidden rounded-3xl bg-surface border border-border shadow-apple-inner flex flex-col justify-end">
           <canvas ref={canvasRef} width={1000} height={300} className="w-full h-full opacity-80" />
           <div className="absolute top-6 left-8 text-sm font-semibold text-text-muted">Acoustic Feed</div>
        </div>

        {/* Clean Transcription Area */}
        <div className="w-full flex-1 max-h-[40vh] overflow-y-auto custom-scrollbar">
           <AnimatePresence mode="wait">
             {transcript ? (
               <motion.p 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-3xl leading-relaxed text-text font-medium tracking-tight"
               >
                 {transcript}
                 <span className="inline-block w-3 h-8 bg-primary/40 ml-3 animate-pulse align-middle rounded-sm" />
               </motion.p>
             ) : (
               <div className="h-full flex flex-col items-center justify-center gap-4 text-text-muted opacity-50">
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 <span className="text-lg font-medium">Ready when you are...</span>
               </div>
             )}
           </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
