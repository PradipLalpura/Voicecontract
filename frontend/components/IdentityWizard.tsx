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
        setTimeout(() => onComplete({ ...data, logo: base64String }), 1500);
      };
      reader.readAsDataURL(file);
    }
  }, [data, onComplete]);

  return (
    <div className="w-full max-w-2xl glass-morphism p-16 rounded-[60px] shadow-2xl relative overflow-hidden beveled-edge">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-signal/20 to-transparent" />
      
      <div className="mb-16 flex justify-between items-start">
        <div className="space-y-4">
          <span className="font-system text-[11px] font-black text-signal tracking-[0.5em] uppercase">Identity Genesis</span>
          <h2 className="text-4xl font-display tracking-tighter italic leading-none">Initialize_Node</h2>
        </div>
        <div className="text-right">
           <span className="font-system text-xs text-text/20 uppercase tracking-widest block mb-1">Step</span>
           <span className="font-system text-3xl font-black text-text/40 tracking-tighter">0{step}<span className="text-text/10">/03</span></span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="space-y-4 group">
              <label className="block font-system text-[10px] font-black text-text/30 uppercase tracking-[0.4em] group-focus-within:text-signal transition-colors">Corporate_Name</label>
              <input 
                type="text" autoFocus placeholder="e.g. ANTARIK SYSTEMS LTD"
                className="w-full bg-void border border-border px-10 py-7 rounded-[32px] text-text font-sans text-xl focus:outline-none focus:ring-[15px] focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/5 shadow-inner"
                value={data.company_name}
                onChange={e => setData({...data, company_name: e.target.value})}
              />
            </div>
            <div className="space-y-4 group">
              <label className="block font-system text-[10px] font-black text-text/30 uppercase tracking-[0.4em] group-focus-within:text-signal transition-colors">GST_Identity</label>
              <input 
                type="text" placeholder="24AAAAA0000A1Z5"
                className="w-full bg-void border border-border px-10 py-7 rounded-[32px] text-text font-sans text-xl focus:outline-none focus:ring-[15px] focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/5 shadow-inner"
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
            className="space-y-12"
          >
            <div className="space-y-4 group">
              <label className="block font-system text-[10px] font-black text-text/30 uppercase tracking-[0.4em] group-focus-within:text-signal transition-colors">Physical_Nexus_Address</label>
              <textarea 
                rows={4} autoFocus placeholder="Corporate HQ Location..."
                className="w-full bg-void border border-border px-10 py-7 rounded-[32px] text-text font-sans text-xl focus:outline-none focus:ring-[15px] focus:ring-signal/5 focus:border-signal/50 transition-all placeholder:text-text/5 resize-none shadow-inner"
                value={data.address}
                onChange={e => setData({...data, address: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group border-2 border-dashed border-white/5 rounded-[48px] p-24 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] hover:border-signal/40 transition-all cursor-pointer overflow-hidden shadow-inner"
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              {data.logo ? (
                <div className="relative w-48 h-48 mb-10">
                  <img src={data.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(0,194,204,0.4)]" />
                  <div className="scan-line" />
                </div>
              ) : (
                <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-12 h-12 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <span className="font-system text-[11px] font-black text-text/40 uppercase tracking-[0.5em]">{data.logo ? 'Identity_Verified' : 'Upload_Corporate_Seal'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-20 flex gap-8">
        {step > 1 && (
          <button onClick={back} className="px-12 py-7 bg-white/5 border border-white/10 text-text/40 font-system font-black text-[10px] uppercase tracking-[0.4em] rounded-[28px] hover:bg-white/10 transition-all">Previous_Sequence</button>
        )}
        <button 
          onClick={step === 3 ? () => onComplete(data) : next}
          className={`flex-1 px-12 py-7 font-system font-black text-[10px] uppercase tracking-[0.4em] rounded-[28px] shadow-2xl transition-all ${
            step === 3 && !data.logo ? 'bg-white/5 text-text/10 cursor-not-allowed border border-white/5' : 'bg-signal text-void hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,194,204,0.2)]'
          }`}
          disabled={step === 3 && !data.logo}
        >
          {step === 3 ? 'Execute_Establishment' : 'Advance_Sequence'}
        </button>
      </div>
    </div>
  );
}
