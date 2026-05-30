"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SuccessHandshake from "@/components/animations/SuccessHandshake";
import { useAuth } from "@clerk/nextjs";

type DocType = 'msa' | 'invoice' | 'po';

export default function DocumentVault() {
  const { session_id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isDispatching, setIsProcessing] = useState(false);
  const [signed, setSigned] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocType>('msa');
  const [documents, setDocuments] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Simulate fetching the generated Legal Trinity
    setTimeout(() => {
      setDocuments({
        msa: "MASTER SERVICE AGREEMENT\n\nThis agreement is made between Antarik Systems and Acme Corp...\n\n1. SCOPE OF SERVICES: The Provider shall deliver a high-fidelity 3D website architecture.\n2. CONSIDERATION: Total value of 75,000 INR.\n3. TIMELINE: Delivery within 14 business days.\n4. INTELLECTUAL PROPERTY: All rights transfer upon final payment.",
        invoice: "TAX INVOICE\n\nInvoice #: INV-2026-001\nDate: May 30, 2026\nTo: Acme Corp\n\nDescription: Professional AI Services (VoiceContract)\nAmount: ₹75,000\nGST (18%): ₹13,500\nTotal: ₹88,500",
        po: "PURCHASE ORDER\n\nPO #: PO-STARK-01\nFrom: Acme Corp\nTo: Antarik Systems\n\nItem: VoiceContract Nexus Build\nQty: 1\nRate: ₹75,000",
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
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
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
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleExecute = async () => {
    setIsProcessing(true);
    // Simulate Dispatch and Locking
    setTimeout(() => {
      setSigned(true);
      setIsProcessing(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-[10px] uppercase tracking-[0.5em] text-text-muted">Extracting_Legal_Nexus...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans p-8 md:p-16 flex flex-col items-center premium-noise overflow-y-auto">
      
      <div className="w-full max-w-6xl space-y-12 z-10">
        
        {/* Vault Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-10 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
               Legal_Trinity_v2.0
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Document_Vault</h1>
          </div>
          <div className="flex gap-4">
             <button onClick={() => window.print()} className="px-6 py-3 border border-border rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Local_Download
             </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
           {(['msa', 'invoice', 'po'] as const).map(type => (
             <button 
               key={type}
               onClick={() => setActiveDoc(type)}
               className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeDoc === type ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
             >
               {type === 'msa' ? 'Master_Agreement' : type === 'invoice' ? 'GST_Invoice' : 'Purchase_Order'}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           
           {/* Document Viewer */}
           <div className="lg:col-span-2">
              <motion.div 
                key={activeDoc}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-border rounded-[40px] p-16 shadow-2xl relative overflow-hidden min-h-[800px]"
              >
                 <div className="absolute inset-0 bg-[url('/paper.svg')] opacity-20 pointer-events-none mix-blend-multiply" />
                 
                 <div className="relative z-10">
                    <pre className="whitespace-pre-wrap font-sans text-xl text-text leading-relaxed tracking-tight bg-transparent">
                      {documents?.[activeDoc]}
                    </pre>

                    <div className="mt-32 pt-10 border-t-2 border-slate-100 flex justify-between items-center text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">
                       <span>Auth: VoiceContract_AI</span>
                       <span>STAMP: {documents?.crypto_stamp?.slice(0,16)}</span>
                    </div>
                 </div>
              </motion.div>
           </div>

           {/* Execution Sidebar */}
           <aside className="space-y-8">
              {!signed ? (
                <div className="bg-surface border border-border rounded-[40px] p-10 shadow-xl space-y-10 sticky top-32">
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black tracking-tight uppercase italic leading-none">Execution_Pad</h3>
                      <p className="text-sm font-medium text-text-muted leading-relaxed">As the Provider, apply your digital mark to finalize the instrument.</p>
                   </div>

                   <div className="h-48 bg-background border border-border rounded-[32px] relative shadow-inner overflow-hidden cursor-crosshair">
                      <canvas 
                        ref={canvasRef}
                        width={500}
                        height={200}
                        className="w-full h-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-text-muted opacity-20 pointer-events-none uppercase tracking-[0.5em]">Sign_Here</div>
                   </div>

                   <div className="space-y-4">
                      <button 
                        onClick={handleExecute}
                        disabled={isDispatching}
                        className="w-full py-5 bg-text text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-apple hover:bg-black transition-all transform active:scale-95 disabled:opacity-50"
                      >
                        {isDispatching ? 'Locking_Vault...' : 'Execute_&_Dispatch'}
                      </button>
                      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
                         <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         <p className="text-[10px] font-bold text-blue-600 leading-tight uppercase">Documents will be sent via WhatsApp and Email instantly.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-10 sticky top-32 flex flex-col items-center">
                   <SuccessHandshake />
                   <div className="text-center space-y-4">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">Assets_Dispatched</h3>
                      <p className="text-text-muted font-bold text-sm leading-relaxed uppercase tracking-widest">Client notified via secure link.<br/>Vault remains locked.</p>
                   </div>
                   <button 
                      onClick={() => router.push('/dashboard')}
                      className="px-12 py-4 bg-background border border-border text-text rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-surface transition-all shadow-sm"
                   >
                      Return_to_Hub
                   </button>
                </div>
              )}
           </aside>
        </div>
      </div>

      <footer className="mt-32 opacity-20 hover:opacity-50 transition-opacity">
        <span className="font-black text-[10px] tracking-[0.8em] uppercase text-text">Antarik // Genesis_01</span>
      </footer>
    </div>
  );
}
