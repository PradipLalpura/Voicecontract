import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdentityData {
  company_name: string;
  gst_number: string;
  address: string;
  template_strategy: 'extract' | 'generate';
  template_file: File | null;
}

export default function IdentityWizard({ onComplete }: { onComplete: (data: IdentityData) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IdentityData>({
    company_name: '',
    gst_number: '',
    address: '',
    template_strategy: 'generate',
    template_file: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const handleFinish = () => {
    onComplete(data);
  };

  return (
    <div className="w-full max-w-2xl bg-surface border border-border p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
      
      <div className="mb-12 flex justify-between items-start">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
            Genesis_Configuration
          </span>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Identity_Setup</h2>
        </div>
        <div className="text-right">
           <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Phase</span>
           <span className="text-2xl font-black text-text-muted tracking-tighter">0{step}<span className="text-border">/04</span></span>
        </div>
      </div>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          
          {/* Step 1: Company Profile */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Legal Entity Name</label>
                <input 
                  type="text" 
                  value={data.company_name}
                  onChange={e => setData({...data, company_name: e.target.value})}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-primary/40 transition-all text-xl font-black tracking-tight uppercase"
                  placeholder="Acme Systems LLC"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">GST / Tax ID</label>
                  <input 
                    type="text" 
                    value={data.gst_number}
                    onChange={e => setData({...data, gst_number: e.target.value})}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold uppercase"
                    placeholder="29GGGGG1314R..."
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Brand_Accent</label>
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary border-4 border-white shadow-md cursor-pointer" />
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-border cursor-pointer" />
                      <div className="w-12 h-12 rounded-full bg-emerald-500 border border-border cursor-pointer" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Registered Office Address</label>
                <textarea 
                  value={data.address}
                  onChange={e => setData({...data, address: e.target.value})}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-primary/40 transition-all text-lg font-bold h-48 resize-none"
                  placeholder="Enter full legal address for contract generation..."
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Template Strategy */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button 
                   onClick={() => setData({...data, template_strategy: 'generate'})}
                   className={`p-8 rounded-[32px] border-2 text-left transition-all ${data.template_strategy === 'generate' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}
                 >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                       <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.642.321a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547l-1.16 1.16a2 2 0 00.442 3.321l1.71.57a2 2 0 001.62-.235l1.011-.674a2 2 0 011.62-.235l1.71.57a2 2 0 00.442-3.321l-1.16-1.16z" /></svg>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight italic mb-2">AI_Generate</h4>
                    <p className="text-xs font-medium text-text-muted leading-relaxed">Let our legal agents construct a custom template based on your brand DNA.</p>
                 </button>

                 <button 
                   onClick={() => {
                     setData({...data, template_strategy: 'extract'});
                     fileInputRef.current?.click();
                   }}
                   className={`p-8 rounded-[32px] border-2 text-left transition-all ${data.template_strategy === 'extract' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}
                 >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                       <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight italic mb-2">Extract_Existing</h4>
                    <p className="text-xs font-medium text-text-muted leading-relaxed">Upload your current MSA (PDF/DOCX) for AI logic mapping.</p>
                    <input 
                      type="file" ref={fileInputRef} className="hidden" 
                      onChange={e => {
                        if (e.target.files?.[0]) setData({...data, template_file: e.target.files[0]});
                      }}
                    />
                 </button>
              </div>
              {data.template_file && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                   <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   <span className="text-sm font-bold text-emerald-700 truncate uppercase tracking-widest">Loaded: {data.template_file.name}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex flex-col items-center justify-center py-4"
            >
               <div className="text-center space-y-4">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Vault_Ready</h3>
                  <p className="text-text-muted font-medium">Your corporate identity and template logic are now secured in the Antarik legal grid.</p>
               </div>
               
               <div className="w-full bg-background border border-border rounded-3xl p-8 space-y-5">
                  <div className="flex justify-between border-b border-border/50 pb-4">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Entity</span>
                    <span className="font-black uppercase italic tracking-tight">{data.company_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-4">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">GSTIN</span>
                    <span className="font-bold">{data.gst_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Strategy</span>
                    <span className="font-black text-primary uppercase italic tracking-widest text-xs">{data.template_strategy === 'generate' ? 'Neural_Generation' : 'Logic_Extraction'}</span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-16 pt-10 border-t border-border flex justify-between items-center">
        <button 
          onClick={back} 
          disabled={step === 1}
          className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-text hover:bg-background border border-border'}`}
        >
          Back
        </button>
        {step < 4 ? (
          <button 
            onClick={next}
            disabled={(step === 1 && !data.company_name)}
            className="px-10 py-4 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl disabled:opacity-50"
          >
            Continue_Sequence
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-hover transition-all shadow-apple transform active:scale-95"
          >
            Access_Command_Center
          </button>
        )}
      </div>
    </div>
  );
}
