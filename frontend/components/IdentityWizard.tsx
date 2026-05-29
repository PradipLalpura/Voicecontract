import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdentityData {
  company_name: string;
  gst_number: string;
  address: string;
  logo: string | null;
}

export default function IdentityWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IdentityData>({
    company_name: '',
    gst_number: '',
    address: '',
    logo: null
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setData(prev => ({ ...prev, logo: base64String }));
        
        // AUTO-TRIGGER TRANSITION: Storytelling "Crystallization"
        setTimeout(() => {
          onComplete();
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  }, [onComplete]);

  return (
    <div className="w-full max-w-2xl bg-surface border border-border p-12 rounded-[40px] shadow-premium relative overflow-hidden">
      {/* Cinematic Pulse Header */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-void overflow-hidden">
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-1/2 h-full bg-signal shadow-[0_0_15px_oklch(var(--signal))]"
        />
      </div>

      <div className="mb-16 flex justify-between items-start">
        <div className="space-y-2">
          <span className="font-sans text-[10px] font-black text-signal tracking-[0.5em] uppercase">Genesis Sequence</span>
          <h2 className="text-4xl font-display text-text tracking-tighter">Initialize Node</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-system text-xs text-text/20 font-bold uppercase tracking-widest">Protocol</span>
          <span className="font-system text-2xl text-text font-black tracking-tighter">0{step}<span className="text-text/10">/03</span></span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "expo.out" }}
            className="space-y-10"
          >
            <div className="space-y-4 group">
              <label className="block font-sans text-[10px] font-black text-text/30 uppercase tracking-[0.2em] group-focus-within:text-signal transition-colors">
                Corporate Designation
              </label>
              <input 
                type="text"
                autoFocus
                placeholder="e.g. ANTARIK SYSTEMS LTD"
                className="w-full bg-void border border-border px-8 py-6 rounded-2xl text-text font-sans text-lg focus:outline-none focus:ring-8 focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/10 shadow-beveled"
                value={data.company_name}
                onChange={e => setData({...data, company_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-4 group">
              <label className="block font-sans text-[10px] font-black text-text/30 uppercase tracking-[0.2em] group-focus-within:text-signal transition-colors">
                Tax Identification (GST)
              </label>
              <input 
                type="text"
                placeholder="24AAAAA0000A1Z5"
                className="w-full bg-void border border-border px-8 py-6 rounded-2xl text-text font-sans text-lg focus:outline-none focus:ring-8 focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/10 shadow-beveled"
                value={data.gst_number}
                onChange={e => setData({...data, gst_number: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "expo.out" }}
            className="space-y-10"
          >
            <div className="space-y-4 group">
              <label className="block font-sans text-[10px] font-black text-text/30 uppercase tracking-[0.2em] group-focus-within:text-signal transition-colors">
                Physical Nexus (Address)
              </label>
              <textarea 
                rows={4}
                autoFocus
                placeholder="The Void, Sector 7, Ahmedabad, Gujarat"
                className="w-full bg-void border border-border px-8 py-6 rounded-2xl text-text font-sans text-lg focus:outline-none focus:ring-8 focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/10 resize-none shadow-beveled"
                value={data.address}
                onChange={e => setData({...data, address: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-10"
          >
            <label className="relative group block cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <div className="border-2 border-dashed border-border rounded-[32px] p-20 flex flex-col items-center justify-center text-center hover:bg-void hover:border-signal/40 transition-all shadow-beveled bg-void/30 overflow-hidden">
                {data.logo ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-32 h-32 mb-6"
                  >
                    <img src={data.logo} alt="Logo Preview" className="w-full h-full object-contain rounded-xl" />
                    <div className="absolute inset-0 bg-signal/10 animate-pulse rounded-xl blur-lg" />
                  </motion.div>
                ) : (
                  <div className="w-24 h-24 bg-surface rounded-3xl flex items-center justify-center mb-8 shadow-premium group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <svg className="w-10 h-10 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <span className="font-sans text-[11px] font-black text-text uppercase tracking-[0.3em]">Crystallize Seal</span>
                <p className="text-text-muted text-[10px] mt-3 font-bold uppercase tracking-widest italic opacity-50">Upload Corporate Identity</p>
                
                {/* Visual Scanner Effect */}
                {data.logo && (
                   <motion.div 
                    initial={{ y: -100 }}
                    animate={{ y: 200 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-1 bg-signal/30 blur-sm pointer-events-none"
                   />
                )}
              </div>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16 flex gap-8">
        {step > 1 && (
          <button 
            onClick={back}
            className="px-12 py-6 bg-surface border border-border text-text-muted font-sans font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-surface-muted transition-all active:scale-[0.98]"
          >
            Previous
          </button>
        )}
        <button 
          onClick={step === 3 ? onComplete : next}
          className={`flex-1 px-12 py-6 font-sans font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-premium transition-all active:scale-[0.95] ${
            step === 3 && !data.logo ? 'bg-text/5 text-text/20 cursor-not-allowed' : 'bg-text text-void hover:bg-signal'
          }`}
          disabled={step === 3 && !data.logo}
        >
          {step === 3 ? 'Execute Initialization' : 'Advance Sequence'}
        </button>
      </div>

      {/* Security Status Line */}
      <div className="mt-10 flex items-center gap-4 opacity-20">
         <div className="h-[1px] flex-1 bg-text" />
         <span className="font-system text-[8px] font-bold uppercase tracking-[0.5em]">System_State: Stable // Encrypted_Path</span>
         <div className="h-[1px] flex-1 bg-text" />
      </div>
    </div>
  );
}
