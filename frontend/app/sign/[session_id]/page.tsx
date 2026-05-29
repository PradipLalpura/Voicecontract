"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignaturePortal() {
  const { session_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDragging] = useState(false);

  useEffect(() => {
    // Simulate fetching document data from the session_id
    // In production, this would be a public GET request with a secure hash
    setTimeout(() => {
      setIdentity({
        provider: "ANTARIK SYSTEMS",
        client: "ACME CORP"
      });
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
    setIsDragging(true);
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
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => setIsDragging(false);

  const handleSign = () => {
    setSigned(true);
    // Trigger dispatch confirmation animation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center bureau-grid text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-signal border-t-transparent rounded-full animate-spin" />
          <span className="font-system text-[10px] uppercase tracking-[0.3em] text-signal">Synchronizing Legal Node...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white font-sans p-8 md:p-20 flex flex-col items-center bureau-grid overflow-y-auto">
      
      <div className="w-full max-w-4xl space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-white/10 pb-8">
          <div>
            <span className="font-system text-[10px] text-signal tracking-[0.4em] uppercase">Document Identity Verified</span>
            <h1 className="text-4xl font-display mt-4">Legal Execution Portal</h1>
          </div>
          <div className="text-right">
            <span className="font-system text-[9px] text-white/20 uppercase tracking-widest block">Session ID</span>
            <span className="font-system text-xs text-white/50">{session_id}</span>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="bg-surface/30 border border-white/5 p-12 beveled-edge relative h-[500px] overflow-y-auto custom-scrollbar">
           <div className="absolute top-4 right-4 bg-signal/10 border border-signal/30 px-3 py-1 text-[9px] text-signal font-system uppercase">
             Draft Copy // Verified
           </div>
           <pre className="whitespace-pre-wrap font-sans text-sm text-white/70 leading-relaxed">
             {documents?.msa}
           </pre>
           <div className="mt-12 pt-12 border-t border-white/5 text-[10px] text-white/20 font-system">
             AUTHENTICATED BY VOICE-CONTRACT PRO // STAMP: {documents?.crypto_stamp}
           </div>
        </div>

        {/* Execution Block */}
        {!signed ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          >
            <div>
              <h3 className="text-xl font-display mb-2">Digital Affirmation</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                By signing below, you acknowledge that you have reviewed the Master Service Agreement 
                and agree to the terms as discussed in the meeting. This signature is cryptographically 
                linked to the session transcript.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
               <div className="h-40 bg-void border border-white/10 rounded-sm relative">
                  <canvas 
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div className="absolute bottom-2 right-2 text-[9px] text-white/20 uppercase font-system">Sign Here</div>
               </div>
               <button 
                 onClick={handleSign}
                 className="w-full py-4 bg-signal text-void font-system text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
               >
                 Execute & Dispatch Final Copy
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-signal/5 border border-signal/30 p-12 text-center beveled-edge"
          >
            <div className="w-16 h-16 bg-signal rounded-full flex items-center justify-center mx-auto mb-6 text-void">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-display text-white mb-2">Execution Complete</h2>
            <p className="text-white/50 text-sm mb-8">The finalized legal package has been securely archived and dispatched to both parties.</p>
            <div className="flex justify-center gap-4">
               <button className="px-6 py-2 border border-signal/30 text-signal text-[10px] uppercase font-system tracking-widest">Download Receipt</button>
               <button className="px-6 py-2 bg-signal/10 text-signal text-[10px] uppercase font-system tracking-widest" onClick={() => router.push("/")}>Return to Home</button>
            </div>
          </motion.div>
        )}

      </div>

      {/* Footer Branding */}
      <div className="mt-20 opacity-20 hover:opacity-100 transition-opacity">
        <span className="font-system text-[10px] tracking-[0.5em] uppercase text-white">VoiceContract Pro // JPN STUDIO</span>
      </div>

    </div>
  );
}
