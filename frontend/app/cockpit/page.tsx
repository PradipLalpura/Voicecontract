"use client";

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAudio } from "@/hooks/useLiveAudio";
import { useRouter, useSearchParams } from "next/navigation";

interface TermRequirement {
  id: string;
  label: string;
  keywords: string[];
  status: 'pending' | 'detected' | 'confirmed';
  value?: string;
}

function CockpitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const useCoach = searchParams.get("coach") === "true";
  const [transcript, setTranscript] = useState("");
  const [isRecordingLocal, setIsRecordingLocal] = useState(false);
  const recognitionRefLocal = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Negotiation Coach State
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  
  // Live Auditor Terms with Smart Multilingual Keywords
  const [terms, setTerms] = useState<TermRequirement[]>([
    { id: 'scope', label: 'Scope of Work', keywords: ['deliver', 'provide', 'build', 'create', 'assets', 'design', 'source code', 'kaam'], status: 'pending' },
    { id: 'price', label: 'Total Consideration', keywords: ['rupees', 'inr', 'fee', 'cost', 'payment', 'price', 'thousand', 'paisa', 'rokda', 'lakh', 'crore', 'tak'], status: 'pending' },
    { id: 'timeline', label: 'Delivery Timeline', keywords: ['deadline', 'weeks', 'days', 'friday', 'month', 'schedule', 'friday', 'somvar', 'thase'], status: 'pending' },
    { id: 'revisions', label: 'Revision Policy', keywords: ['revisions', 'feedback', 'changes', 'rounds', 'badlav'], status: 'pending' },
    { id: 'ip', label: 'IP Rights', keywords: ['intellectual property', 'ownership', 'copyright', 'transfer', 'haq'], status: 'pending' },
  ]);

  // Initializing Local Interceptor for 100% demo reliability
  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRefLocal.current = new SpeechRecognition();
      recognitionRefLocal.current.continuous = true;
      recognitionRefLocal.current.interimResults = true;
      recognitionRefLocal.current.lang = 'en-IN'; // Optimized for Indian English/Hinglish

      recognitionRefLocal.current.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
             const result = event.results[i][0].transcript;
             setTranscript(prev => prev + " " + result);
             processLocalText(result.toLowerCase());
          }
        }
      };
    }
  }, []);

  const processLocalText = (text: string) => {
    setTerms(prev => prev.map(term => {
      if (term.status === 'pending' && term.keywords.some(k => text.includes(k))) {
        return { ...term, status: 'detected' };
      }
      return term;
    }));

    if (useCoach) {
      if (text.includes("paisa") || text.includes("price") || text.includes("fee")) {
        setCoachAdvice("⚠️ Pro Tip: Mention 'GST Extra' now to avoid margin erosion.");
        setTimeout(() => setCoachAdvice(null), 8000);
      } else if (text.includes("barabar") || text.includes("done")) {
        setCoachAdvice("💡 Buying Signal Detected. Lock the timeline next.");
        setTimeout(() => setCoachAdvice(null), 8000);
      }
    }
  };

  const handleToggleLocal = () => {
    if (isRecordingLocal) {
      recognitionRefLocal.current?.stop();
      setIsRecordingLocal(false);
    } else {
      recognitionRefLocal.current?.start();
      setIsRecordingLocal(true);
    }
  };

  const handleEvent = useCallback((event: any) => {
    if (event.type === "transcript") {
      // Background WebSocket transcript sync - keeping existing logic
      // setTranscript(prev => prev + " " + event.text);
    }
  }, [useCoach]);

  const { start, stop, isCapturing, status, error } = useLiveAudio({
    sessionId: sessionId || undefined,
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
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(clientId + "." + ts));
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
        const amplitude = isCapturing ? Math.sin(i * 0.02 + phase) * 50 : 2;
        const y = (canvas.height / 2) + amplitude;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.strokeStyle = isCapturing ? "#2563EB" : "#94a3b8";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
      phase += 0.08;
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isCapturing]);

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col premium-noise overflow-hidden">
      
      {/* Cockpit Header */}
      <header className="h-24 border-b border-border flex items-center justify-between px-12 bg-white/60 backdrop-blur-xl z-50">
        <div className="flex items-center gap-8">
           <button onClick={() => router.push('/dashboard')} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-text-muted">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div className="space-y-1">
              <h2 className="font-black text-xl tracking-tighter uppercase italic">Meeting_Interception</h2>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{isCapturing ? 'Secure_Recording_Active' : 'Standby_Mode'}</span>
              </div>
           </div>
        </div>

        <div className="flex gap-4">
          {!isCapturing ? (
            <button onClick={() => { start(); handleToggleLocal(); }} disabled={status === "connecting" || status === "requesting-permission"} className="px-10 py-4 bg-text text-white rounded-full font-black uppercase tracking-widest text-xs shadow-xl hover:bg-black transition-all transform active:scale-95 disabled:opacity-50">
              {status === "connecting" ? "Connecting..." : status === "requesting-permission" ? "Allow_Mic..." : "Start_Legal_Engine"}
            </button>
          ) : (
            <button onClick={() => { stop(); handleToggleLocal(); router.push(`/processing?session=${sessionId}`); }} className="px-10 py-4 bg-primary text-white rounded-full font-black uppercase tracking-widest text-xs shadow-apple hover:bg-primary-hover transition-all transform active:scale-95">
              Stop & Mint Documents
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="mx-12 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-bold text-red-700">{typeof error === 'string' ? error : 'Connection error. Please try again.'}</span>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row">
        
        {/* Left: Main Transcription & Waves */}
        <div className="flex-1 flex flex-col p-12 gap-12 overflow-y-auto">
           {/* High-Fidelity Visualizer */}
           <div className="w-full h-80 bg-surface border border-border rounded-[40px] relative overflow-hidden shadow-inner flex flex-col justify-end p-8">
              <canvas ref={canvasRef} width={1200} height={300} className="w-full h-full opacity-60" />
              <div className="absolute top-8 left-10 flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1">Acoustic_Input</span>
                 <span className="text-xs font-bold text-text-muted">48kHz / 256-bit E2EE</span>
              </div>
              
              <AnimatePresence>
                 {coachAdvice && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                     className="absolute top-8 right-10 max-w-sm bg-blue-600 text-white p-6 rounded-3xl shadow-2xl border border-blue-400 font-bold text-sm leading-relaxed"
                   >
                     {coachAdvice}
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>

           {/* Live Transcription Feed */}
           <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <AnimatePresence mode="wait">
                {transcript ? (
                  <div className="space-y-8">
                     <p className="text-4xl leading-[1.2] text-text font-black tracking-tighter uppercase italic">
                       {transcript}
                       <span className="inline-block w-4 h-10 bg-primary/30 ml-4 animate-pulse align-middle rounded-sm" />
                     </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-6 text-text-muted opacity-30">
                    <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    <span className="text-2xl font-black uppercase tracking-widest italic">Awaiting_Signal...</span>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Right: Live Auditor Panel */}
        <aside className="w-96 bg-surface border-l border-border p-10 flex flex-col gap-10">
           <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live_Auditor</span>
              <h3 className="text-2xl font-black tracking-tight uppercase italic">Term_Validation</h3>
           </div>

           <div className="flex-1 space-y-4">
              {terms.map((term) => (
                <div key={term.id} className={`p-6 rounded-3xl border transition-all duration-500 flex items-center justify-between ${
                  term.status === 'detected' ? 'bg-green-50 border-green-200' : 'bg-background border-border opacity-60'
                }`}>
                   <div className="flex flex-col gap-1">
                      <span className={`text-xs font-black uppercase tracking-widest ${term.status === 'detected' ? 'text-green-600' : 'text-text'}`}>{term.label}</span>
                      <span className="text-[10px] font-medium text-text-muted">{term.status === 'detected' ? 'Logic Identified' : 'Awaiting Mention...'}</span>
                   </div>
                   {term.status === 'detected' ? (
                     <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </div>
                   ) : (
                     <div className="w-8 h-8 bg-slate-100 rounded-full border-2 border-dashed border-slate-300" />
                   )}
                </div>
              ))}
           </div>

           <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
              <div className="flex items-start gap-4">
                 <svg className="w-6 h-6 text-red-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Risk_Alert</span>
                    <p className="text-xs font-medium text-red-700 leading-relaxed">Ensure payment schedules are mentioned clearly to generate a valid GST Invoice.</p>
                 </div>
              </div>
           </div>
        </aside>

      </main>
    </div>
  );
}

export default function Cockpit() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CockpitContent />
    </Suspense>
  );
}
