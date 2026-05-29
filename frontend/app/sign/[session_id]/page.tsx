"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SuccessHandshake from "@/components/animations/SuccessHandshake";
import Background3D from "@/components/Background3D";

export default function SignaturePortal() {
  const { session_id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIdentity({ provider: "ANTARIK SYSTEMS", client: "ACME CORP" });
      setDocuments({
        msa: "MASTER SERVICE AGREEMENT\n\nThis agreement is made between Antarik Systems and Acme Corp...\n\n1. SCOPE OF SERVICES: The Provider shall deliver a high-fidelity 3D website architecture.\n2. CONSIDERATION: Total value of 50,000 INR.\n3. TIMELINE: Delivery within 14 business days.\n4. INTELLECTUAL PROPERTY: All rights transfer upon final payment.",
        crypto_stamp: "sha256:7f83b123...9021"
      });
      setLoading(false);
    }, 2000);
  }, [session_id]);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "oklch(25% 0.02 260)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const triggerDownload = () => {
    const blob = new Blob([documents?.msa], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Antarik_Contract_${session_id?.slice(0,8)}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleSign = () => {
    setSigned(true);
    triggerDownload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center bureau-grid-light text-text">
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 border-4 border-signal/10 rounded-full" />
             <div className="absolute inset-0 border-4 border-signal border-t-transparent rounded-full animate-spin shadow-[0_0_20px_oklch(var(--signal))]" />
          </div>
          <span className="font-sans text-xs font-black uppercase tracking-[0.5em] text-signal animate-pulse">Decrypting Legal Node...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-text font-sans p-10 md:p-24 flex flex-col items-center bureau-grid-light overflow-y-auto relative">
      <Background3D />

      <div className="w-full max-w-5xl space-y-20 z-10 relative">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-border pb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-signal/10 border border-signal/30 rounded-full text-[10px] font-black text-signal uppercase tracking-widest">
              Digital Signature Required
            </div>
            <h1 className="text-6xl font-display tracking-tighter italic">Execution Portal</h1>
          </div>
          <div className="text-right">
            <span className="font-system text-[10px] text-text/20 uppercase tracking-[0.6em] block font-black mb-2">Vault_Hash</span>
            <span className="font-system text-sm text-text/40 font-bold">{String(session_id).slice(0,16)}...</span>
          </div>
        </div>

        {/* Document Viewer */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/80 backdrop-blur-3xl border border-border rounded-[60px] p-20 shadow-2xl relative h-[650px] overflow-y-auto custom-scrollbar group"
        >
           <div className="absolute top-10 right-10 bg-void border border-border px-6 py-2.5 text-[11px] text-text/40 font-black uppercase tracking-[0.3em] rounded-full shadow-beveled">
             Official Instrument // MSA_v2.0
           </div>
           
           <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-xl text-text/80 leading-[1.6] tracking-tight">
                {documents?.msa}
              </pre>
           </div>

           <div className="mt-24 pt-12 border-t border-border/50 flex justify-between items-center opacity-40">
             <div className="font-system text-[10px] font-black uppercase tracking-[0.4em]">Auth: VoiceContract_Nexus</div>
             <div className="font-system text-[10px] font-black uppercase tracking-[0.4em]">STAMP: {documents?.crypto_stamp}</div>
           </div>
        </motion.div>

        {/* Execution Block */}
        {!signed ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center"
          >
            <div className="space-y-6">
              <h3 className="text-3xl font-display tracking-tighter italic">Digital Affirmation</h3>
              <p className="text-text-muted text-lg leading-relaxed">
                By applying your digital mark, you execute a legally binding agreement synchronized with the 
                meeting session {session_id?.slice(0,6)}. This action is final and irreversible.
              </p>
            </div>
            
            <div className="space-y-8">
               <div className="h-60 bg-void border border-border rounded-[40px] relative shadow-inner overflow-hidden cursor-crosshair group">
                  <canvas 
                    ref={canvasRef}
                    width={500}
                    height={240}
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={() => setIsDrawing(false)}
                  />
                  <div className="absolute bottom-6 right-8 text-[11px] text-text/10 uppercase font-black tracking-[0.5em] pointer-events-none group-hover:text-text/20 transition-colors">Sign Repository</div>
               </div>
               <button 
                 onClick={handleSign}
                 className="w-full py-8 bg-text text-void font-sans font-black text-sm uppercase tracking-[0.4em] rounded-[32px] shadow-2xl hover:bg-signal transition-all active:scale-[0.97] hover:shadow-signal/20"
               >
                 Execute Contract
               </button>
            </div>
          </motion.div>
        ) : (
          <div className="py-10">
            <SuccessHandshake />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="mt-12 flex justify-center gap-8"
            >
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-10 py-4 border border-border text-text-muted font-sans font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-surface transition-all"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}

      </div>

      <footer className="mt-32 opacity-20 hover:opacity-50 transition-opacity">
        <span className="font-system text-[10px] font-black tracking-[0.8em] uppercase text-text">Antarik // Genesis_01</span>
      </footer>
    </div>
  );
}
