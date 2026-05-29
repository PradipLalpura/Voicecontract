"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SuccessHandshake from "@/components/animations/SuccessHandshake";

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
        msa: "MASTER SERVICE AGREEMENT\n\nThis agreement is made between Antarik Systems and Acme Corp...",
        crypto_stamp: "sha256:7f83b123...9021"
      });
      setLoading(false);
    }, 1500);
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
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const triggerDownload = () => {
    const blob = new Blob([documents?.msa], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceContract_${session_id}.txt`;
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
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-signal border-t-transparent rounded-full animate-spin shadow-premium" />
          <span className="font-sans text-[11px] font-black uppercase tracking-[0.4em] text-signal">Authenticating Legal Node...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-text font-sans p-10 md:p-24 flex flex-col items-center bureau-grid-light overflow-y-auto">
      
      <div className="w-full max-w-5xl space-y-16">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-border pb-10">
          <div>
            <span className="font-sans text-[11px] font-black text-signal tracking-[0.4em] uppercase">Security Clearance: Verified</span>
            <h1 className="text-5xl font-display mt-4 tracking-tight">Legal Execution Portal</h1>
          </div>
          <div className="text-right">
            <span className="font-system text-[10px] text-text/20 uppercase tracking-widest block font-bold mb-1">Vault ID</span>
            <span className="font-system text-sm text-text/40 font-bold">{String(session_id).slice(0,12)}</span>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="bg-surface border border-border rounded-[48px] p-16 shadow-premium relative h-[600px] overflow-y-auto custom-scrollbar group">
           <div className="absolute top-8 right-8 bg-void border border-border px-5 py-2 text-[10px] text-text/40 font-bold uppercase tracking-widest rounded-full shadow-beveled">
             Official Instrument // MSA
           </div>
           <pre className="whitespace-pre-wrap font-sans text-lg text-text/80 leading-[1.6] tracking-tight">
             {documents?.msa}
           </pre>
           <div className="mt-20 pt-10 border-t border-border/50 text-[11px] text-text/30 font-bold font-system uppercase tracking-widest">
             Endorsed by VoiceContract Pro // Logic Stamp: {documents?.crypto_stamp}
           </div>
        </div>

        {/* Execution Block */}
        {!signed ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-display tracking-tight">Digital Affirmation</h3>
              <p className="text-text-muted text-base leading-relaxed">
                By applying your digital mark below, you certify that all deal terms extracted from the 
                meeting session are accurate and binding under the Indian Contract Act, 1872. 
              </p>
            </div>
            
            <div className="space-y-6">
               <div className="h-48 bg-void border border-border rounded-[24px] relative shadow-beveled overflow-hidden">
                  <canvas 
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={() => setIsDrawing(false)}
                  />
                  <div className="absolute bottom-4 right-6 text-[10px] text-text/10 uppercase font-black tracking-[0.3em] pointer-events-none">Handwritten Mark</div>
               </div>
               <button 
                 onClick={handleSign}
                 className="w-full py-6 bg-text text-void font-sans font-bold text-sm uppercase tracking-widest rounded-2xl shadow-premium hover:bg-signal transition-all active:scale-[0.98]"
               >
                 Execute & Dispatch
               </button>
            </div>
          </motion.div>
        ) : (
          <SuccessHandshake />
        )}

      </div>

      {/* Footer Branding */}
      <div className="mt-24 opacity-10 hover:opacity-50 transition-opacity">
        <span className="font-system text-[11px] font-black tracking-[0.6em] uppercase text-text">VoiceContract Pro // Antarik</span>
      </div>

    </div>
  );
}
