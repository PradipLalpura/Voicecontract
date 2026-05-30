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

  const next = () => setStep(s => Math.min(3, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const handleFinish = () => {
    onComplete(data);
  };

  return (
    <div className="w-full max-w-2xl bg-surface border border-border p-12 rounded-3xl shadow-apple-lg relative overflow-hidden">
      
      <div className="mb-12 flex justify-between items-start">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
            Entity Configuration
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">Set up your profile</h2>
        </div>
        <div className="text-right">
           <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Step</span>
           <span className="text-2xl font-black text-text-muted">0{step}<span className="text-border">/03</span></span>
        </div>
      </div>

      <div className="relative min-h-[250px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Legal Entity Name</label>
                <input 
                  type="text" 
                  value={data.company_name}
                  onChange={e => setData({...data, company_name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg font-medium"
                  placeholder="e.g. Acme Corporation Pvt Ltd"
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
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">GST Identification Number</label>
                <input 
                  type="text" 
                  value={data.gst_number}
                  onChange={e => setData({...data, gst_number: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg font-medium uppercase"
                  placeholder="e.g. 29GGGGG1314R9Z6"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Registered Address</label>
                <textarea 
                  value={data.address}
                  onChange={e => setData({...data, address: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base min-h-[100px] resize-none"
                  placeholder="Enter full registered address..."
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex flex-col items-center justify-center py-4"
            >
               <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold">Configuration Complete</h3>
                  <p className="text-text-muted">Your legal entity details are securely stored. You can now access the VoiceContract dashboard to mint contracts.</p>
               </div>
               
               <div className="w-full bg-background border border-border rounded-xl p-6 space-y-4">
                  <div className="flex justify-between border-b border-border pb-4">
                    <span className="text-sm font-semibold text-text-muted uppercase">Entity Name</span>
                    <span className="font-bold">{data.company_name || 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-4">
                    <span className="text-sm font-semibold text-text-muted uppercase">GSTIN</span>
                    <span className="font-bold">{data.gst_number || 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-text-muted uppercase">Address</span>
                    <span className="font-medium text-sm text-right max-w-[200px] truncate">{data.address || 'Not Provided'}</span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 pt-8 border-t border-border flex justify-between">
        <button 
          onClick={back} 
          disabled={step === 1}
          className={`px-6 py-3 font-semibold rounded-xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-text hover:bg-background'}`}
        >
          Back
        </button>
        {step < 3 ? (
          <button 
            onClick={next}
            disabled={step === 1 && !data.company_name}
            className="px-8 py-3 bg-text text-white rounded-xl font-semibold hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-apple"
          >
            Access Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
