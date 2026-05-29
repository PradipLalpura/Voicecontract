import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdentityData {
  company_name: string;
  gst_number: string;
  address: string;
  logo: string | null;
}

export default function IdentityWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IdentityData>({
    company_name: '',
    gst_number: '',
    address: '',
    logo: null
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  return (
    <div className="w-full max-w-2xl bg-surface/50 backdrop-blur-xl border border-white/5 p-12 beveled-edge relative overflow-hidden">
      {/* Decorative Scan Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-signal/50 to-transparent animate-scan" />

      <div className="mb-12 flex justify-between items-end">
        <div>
          <span className="font-system text-[10px] text-signal tracking-[0.3em] uppercase">Security Level: Omega</span>
          <h2 className="text-2xl font-display text-white mt-2">Establish Entity Identity</h2>
        </div>
        <span className="font-system text-xl text-white/20">0{step} / 03</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-8"
          >
            <div className="group">
              <label className="block font-system text-[10px] text-white/40 uppercase tracking-widest mb-3 group-focus-within:text-signal transition-colors">
                Registered Business Name
              </label>
              <input 
                type="text"
                placeholder="ANTARIK SYSTEMS LTD"
                className="w-full bg-void/50 border border-white/10 px-4 py-4 text-white font-sans focus:outline-none focus:border-signal/50 transition-all placeholder:text-white/10"
                value={data.company_name}
                onChange={e => setData({...data, company_name: e.target.value})}
              />
            </div>
            
            <div className="group">
              <label className="block font-system text-[10px] text-white/40 uppercase tracking-widest mb-3 group-focus-within:text-signal transition-colors">
                GST Identification Number
              </label>
              <input 
                type="text"
                placeholder="24AAAAA0000A1Z5"
                className="w-full bg-void/50 border border-white/10 px-4 py-4 text-white font-sans focus:outline-none focus:border-signal/50 transition-all placeholder:text-white/10"
                value={data.gst_number}
                onChange={e => setData({...data, gst_number: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-8"
          >
            <div className="group">
              <label className="block font-system text-[10px] text-white/40 uppercase tracking-widest mb-3 group-focus-within:text-signal transition-colors">
                Physical Business Address
              </label>
              <textarea 
                rows={4}
                placeholder="The Void, Sector 7, Ahmedabad"
                className="w-full bg-void/50 border border-white/10 px-4 py-4 text-white font-sans focus:outline-none focus:border-signal/50 transition-all placeholder:text-white/10 resize-none"
                value={data.address}
                onChange={e => setData({...data, address: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 py-12 px-6 group hover:border-signal/30 transition-all cursor-pointer">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-signal/10 transition-all">
                <svg className="w-6 h-6 text-white/40 group-hover:text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-system text-[10px] text-white/40 uppercase tracking-widest">Upload Corporate Seal / Logo</span>
              <p className="text-[9px] text-white/20 mt-2">SVG, PNG, or High-Res JPG</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 flex gap-4">
        {step > 1 && (
          <button 
            onClick={back}
            className="px-8 py-4 border border-white/10 text-white/40 font-system text-xs uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
          >
            Previous
          </button>
        )}
        <button 
          onClick={step === 3 ? () => console.log('Finalize') : next}
          className="flex-1 px-8 py-4 bg-signal text-void font-system text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {step === 3 ? 'Establish Identity' : 'Proceed to Validation'}
        </button>
      </div>
    </div>
  );
}
