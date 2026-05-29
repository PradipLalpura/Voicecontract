import React, { useState } from 'react';
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

  return (
    <div className="w-full max-w-2xl bg-surface border border-border p-12 rounded-3xl shadow-premium relative overflow-hidden">
      {/* Premium Gradient Header */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-signal/20 via-signal to-signal/20" />

      <div className="mb-14 flex justify-between items-start">
        <div>
          <span className="font-sans text-[10px] font-black text-signal tracking-[0.4em] uppercase">Protocol Node 01</span>
          <h2 className="text-3xl font-display text-text mt-3">Entity Identification</h2>
          <p className="text-text-muted text-sm mt-2 font-sans">Establish your legal presence within the system.</p>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-void flex items-center justify-center border border-border shadow-beveled">
          <span className="font-system text-lg text-text font-bold">0{step}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <label className="block font-sans text-xs font-bold text-text uppercase tracking-widest">
                Company Designation
              </label>
              <input 
                type="text"
                placeholder="e.g. ANTARIK SYSTEMS LTD"
                className="w-full bg-void border border-border px-6 py-5 rounded-2xl text-text font-sans focus:outline-none focus:ring-4 focus:ring-signal/5 focus:border-signal transition-all placeholder:text-text/20 shadow-beveled"
                value={data.company_name}
                onChange={e => setData({...data, company_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-4">
              <label className="block font-sans text-xs font-bold text-text uppercase tracking-widest">
                Tax Identification (GST)
              </label>
              <input 
                type="text"
                placeholder="24AAAAA0000A1Z5"
                className="w-full bg-void border border-border px-6 py-5 rounded-2xl text-text font-sans focus:outline-none focus:ring-4 focus:ring-signal/5 focus:border-signal transition-all placeholder:text-text/20 shadow-beveled"
                value={data.gst_number}
                onChange={e => setData({...data, gst_number: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <label className="block font-sans text-xs font-bold text-text uppercase tracking-widest">
                Registered Physical Address
              </label>
              <textarea 
                rows={4}
                placeholder="The Void, Sector 7, Ahmedabad, Gujarat"
                className="w-full bg-void border border-border px-6 py-5 rounded-2xl text-text font-sans focus:outline-none focus:ring-4 focus:ring-signal/5 focus:border-signal transition-all placeholder:text-text/20 resize-none shadow-beveled"
                value={data.address}
                onChange={e => setData({...data, address: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="relative group border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:bg-void hover:border-signal/30 transition-all cursor-pointer shadow-beveled bg-void/50">
              <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-6 shadow-premium group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-sans text-[11px] font-black text-text uppercase tracking-widest">Seal Transmission</span>
              <p className="text-text-muted text-[10px] mt-2">Upload Corporate Logo (SVG/PNG)</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-16 flex gap-6">
        {step > 1 && (
          <button 
            onClick={back}
            className="px-10 py-5 bg-surface border border-border text-text-muted font-sans font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-surface-muted transition-all"
          >
            Back
          </button>
        )}
        <button 
          onClick={step === 3 ? onComplete : next}
          className="flex-1 px-10 py-5 bg-text text-void font-sans font-bold text-xs uppercase tracking-widest rounded-2xl shadow-premium hover:bg-signal transition-all active:scale-[0.98]"
        >
          {step === 3 ? 'Finalize Profile' : 'Next Protocol'}
        </button>
      </div>
    </div>
  );
}
