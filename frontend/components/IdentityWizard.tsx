import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdentityData {
  company_name: string;
  gst_number: string;
  address: string;
  logo: string | null;
}

export default function IdentityWizard({ onComplete }: { onComplete: (data: IdentityData) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IdentityData>({
    company_name: '',
    gst_number: '',
    address: '',
    logo: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setData(prev => ({ ...prev, logo: base64String }));
        
        // CINEMATIC AUTO-TRANSITION
        // We simulate a "System Processing" moment
        setTimeout(() => {
          onComplete({ ...data, logo: base64String });
        }, 1200);
      };
      reader.readAsDataURL(file);
    }
  }, [data, onComplete]);

  return (
    <div className="w-full max-w-2xl bg-surface/90 backdrop-blur-2xl border border-border p-12 rounded-[50px] shadow-premium relative overflow-hidden">
      {/* Playful Floating Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 w-64 h-64 bg-signal rounded-full blur-[80px] pointer-events-none"
      />

      <div className="mb-16 flex justify-between items-end">
        <div className="space-y-3">
          <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">Genesis Sequence</span>
          <h2 className="text-4xl font-display text-text tracking-tighter italic">Establish Node</h2>
        </div>
        <div className="relative h-16 w-16">
           <svg className="w-full h-full -rotate-90 transform">
              <circle
                cx="32"
                cy="32"
                r="30"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-border"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="30"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray="188.4"
                initial={{ strokeDashoffset: 188.4 }}
                animate={{ strokeDashoffset: 188.4 - (188.4 * (step/3)) }}
                className="text-signal"
              />
           </svg>
           <span className="absolute inset-0 flex items-center justify-center font-system font-bold text-text text-sm">0{step}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="space-y-12"
          >
            <div className="space-y-4 group">
              <label className="block font-sans text-[11px] font-black text-text/30 uppercase tracking-[0.2em] group-focus-within:text-signal transition-colors">
                Corporate Designation
              </label>
              <input 
                type="text"
                autoFocus
                placeholder="e.g. ANTARIK SYSTEMS LTD"
                className="w-full bg-void border border-border px-8 py-6 rounded-3xl text-text font-sans text-xl focus:outline-none focus:ring-[12px] focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/10 shadow-premium"
                value={data.company_name}
                onChange={e => setData({...data, company_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-4 group">
              <label className="block font-sans text-[11px] font-black text-text/30 uppercase tracking-[0.2em] group-focus-within:text-signal transition-colors">
                Tax Identification (GST)
              </label>
              <input 
                type="text"
                placeholder="24AAAAA0000A1Z5"
                className="w-full bg-void border border-border px-8 py-6 rounded-3xl text-text font-sans text-xl focus:outline-none focus:ring-[12px] focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/10 shadow-premium"
                value={data.gst_number}
                onChange={e => setData({...data, gst_number: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="space-y-12"
          >
            <div className="space-y-4 group">
              <label className="block font-sans text-[11px] font-black text-text/30 uppercase tracking-[0.2em] group-focus-within:text-signal transition-colors">
                Physical Nexus (Address)
              </label>
              <textarea 
                rows={4}
                autoFocus
                placeholder="The Void, Sector 7, Ahmedabad, Gujarat"
                className="w-full bg-void border border-border px-8 py-6 rounded-3xl text-text font-sans text-xl focus:outline-none focus:ring-[12px] focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/10 resize-none shadow-premium"
                value={data.address}
                onChange={e => setData({...data, address: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="space-y-12"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group border-2 border-dashed border-border rounded-[40px] p-24 flex flex-col items-center justify-center text-center hover:bg-void hover:border-signal/40 transition-all shadow-premium bg-void/30 overflow-hidden cursor-pointer active:scale-95"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
              
              <AnimatePresence mode="wait">
                {data.logo ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, y: 20, rotateY: 90 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    className="relative w-40 h-40 mb-8"
                  >
                    <img src={data.logo} alt="Logo Preview" className="w-full h-full object-contain rounded-2xl shadow-premium" />
                    <motion.div 
                      animate={{ y: [0, 160, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-1 bg-signal shadow-[0_0_15px_oklch(var(--signal))] pointer-events-none"
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    className="w-28 h-24 bg-surface rounded-[24px] flex items-center justify-center mb-10 shadow-premium border border-border group-hover:bg-signal group-hover:text-void transition-colors"
                  >
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="font-sans text-[12px] font-black text-text uppercase tracking-[0.4em]">
                {data.logo ? 'Identity Authenticated' : 'Transmit Corporate Seal'}
              </span>
              <p className="text-text-muted text-[11px] mt-4 font-bold uppercase tracking-widest italic opacity-40">
                {data.logo ? 'Advancing to Legal Vault...' : 'Click or Drop Corporate Identity'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16 flex gap-10">
        {step > 1 && (
          <button 
            onClick={back}
            className="px-14 py-6 bg-surface border border-border text-text-muted font-sans font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-surface-muted transition-all active:scale-[0.98]"
          >
            Previous
          </button>
        )}
        <button 
          onClick={step === 3 ? () => onComplete(data) : next}
          className={`flex-1 px-14 py-6 font-sans font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-premium transition-all active:scale-[0.95] ${
            step === 3 && !data.logo ? 'bg-text/5 text-text/10 cursor-not-allowed border border-border' : 'bg-text text-void hover:bg-signal hover:shadow-signal/20'
          }`}
          disabled={step === 3 && !data.logo}
        >
          {step === 3 ? 'Finalize Protocol' : 'Advance Sequence'}
        </button>
      </div>

      {/* Decorative Decal */}
      <div className="mt-12 flex items-center justify-between opacity-10">
         <span className="font-system text-[8px] font-bold uppercase tracking-[0.6em]">System: Operational</span>
         <div className="h-[1px] flex-1 mx-6 bg-text" />
         <span className="font-system text-[8px] font-bold uppercase tracking-[0.6em]">Auth: Secure</span>
      </div>
    </div>
  );
}
