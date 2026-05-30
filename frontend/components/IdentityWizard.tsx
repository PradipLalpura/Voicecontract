import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdentityData {
  company_name: string;
  gst_number: string;
  address: string;
  brand_accent: string;
  template_strategy: 'extract' | 'generate';
  brand_dna_url: string;
  existing_msa_filename: string;
}

const ACCENT_OPTIONS = [
  { color: '#2563EB', label: 'Royal Blue' },
  { color: '#00C2CC', label: 'Teal' },
  { color: '#0F172A', label: 'Slate' },
  { color: '#10B981', label: 'Emerald' },
  { color: '#8B5CF6', label: 'Violet' },
];

export default function IdentityWizard({ onComplete }: { onComplete: (data: IdentityData) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IdentityData>({
    company_name: '',
    gst_number: '',
    address: '',
    brand_accent: '#00C2CC',
    template_strategy: 'generate',
    brand_dna_url: '',
    existing_msa_filename: '',
  });

  // File objects kept locally (not sent to backend — only filenames are persisted for now)
  const [brandDnaFile, setBrandDnaFile] = useState<File | null>(null);
  const [existingMsaFile, setExistingMsaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const [gstWarning, setGstWarning] = useState('');

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const validateGst = (value: string) => {
    setGstWarning('');
    if (value && value.length !== 15) {
      setGstWarning('GSTIN should be 15 characters');
    }
  };

  const canProceed = () => {
    if (step === 1) return !!data.company_name.trim();
    if (step === 2) return !!data.address.trim();
    if (step === 3) return !!data.template_strategy;
    return true;
  };

  const handleFinish = () => {
    onComplete({
      ...data,
      brand_dna_url: brandDnaFile?.name || '',
      existing_msa_filename: existingMsaFile?.name || '',
    });
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

      {/* Progress Bar */}
      <div className="mb-10 flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-border/40'}`}
          />
        ))}
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Legal Entity Name *</label>
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
                    onChange={e => {
                      setData({...data, gst_number: e.target.value});
                      validateGst(e.target.value);
                    }}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold uppercase"
                    placeholder="29GGGGG1314R..."
                  />
                  {gstWarning && (
                    <p className="mt-2 text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                      {gstWarning}
                    </p>
                  )}
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Brand_Accent</label>
                   <div className="flex gap-3">
                      {ACCENT_OPTIONS.map(opt => (
                        <button
                          key={opt.color}
                          type="button"
                          onClick={() => setData({...data, brand_accent: opt.color})}
                          className={`w-12 h-12 rounded-full border-4 cursor-pointer transition-all duration-200 hover:scale-110 ${
                            data.brand_accent === opt.color 
                              ? 'border-text shadow-lg scale-110' 
                              : 'border-white/80 shadow-md opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: opt.color }}
                          title={opt.label}
                        />
                      ))}
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Registered Office Address *</label>
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
                   type="button"
                   onClick={() => setData({...data, template_strategy: 'generate'})}
                   className={`p-8 rounded-[32px] border-2 text-left transition-all ${data.template_strategy === 'generate' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}
                 >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                       <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.642.321a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547l-1.16 1.16a2 2 0 00.442 3.321l1.71.57a2 2 0 001.62-.235l1.011-.674a2 2 0 011.62-.235l1.71.57a2 2 0 00.442-3.321l-1.16-1.16z" /></svg>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight italic mb-2">AI_Generate</h4>
                    <p className="text-xs font-medium text-text-muted leading-relaxed mb-4">Let our legal agents construct a custom template based on your brand DNA.</p>
                    
                    {data.template_strategy === 'generate' && (
                      <div className="pt-4 border-t border-primary/20">
                         <label className="flex flex-col items-center justify-center p-4 border border-dashed border-primary/40 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Upload Brand DNA</span>
                           <span className="text-[9px] text-text-muted text-center leading-tight">Optional: PDF/DOCX of past work<br/>so AI learns your tone.</span>
                           <input 
                             type="file" 
                             className="hidden" 
                             accept=".pdf,.docx,.doc"
                             onChange={e => {
                               if (e.target.files?.[0]) {
                                 setBrandDnaFile(e.target.files[0]);
                                 setData({...data, brand_dna_url: e.target.files[0].name});
                               }
                             }}
                           />
                         </label>
                         {brandDnaFile && (
                           <div className="mt-3 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
                             <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             <span className="text-xs font-bold text-emerald-700 truncate">{brandDnaFile.name}</span>
                           </div>
                         )}
                      </div>
                    )}
                 </button>

                 <button 
                   type="button"
                   onClick={() => setData({...data, template_strategy: 'extract'})}
                   className={`p-8 rounded-[32px] border-2 text-left transition-all ${data.template_strategy === 'extract' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}
                 >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                       <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight italic mb-2">Extract_Existing</h4>
                    <p className="text-xs font-medium text-text-muted leading-relaxed mb-4">Upload your current MSA (PDF/DOCX) for AI logic mapping.</p>
                    
                    {data.template_strategy === 'extract' && (
                      <div className="pt-4 border-t border-primary/20">
                         <label className="flex flex-col items-center justify-center p-4 border border-dashed border-primary/40 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Upload Existing MSA</span>
                           <span className="text-[9px] text-text-muted text-center leading-tight">PDF or DOCX of your current<br/>master service agreement.</span>
                           <input 
                             type="file" ref={fileInputRef} className="hidden" 
                             accept=".pdf,.docx,.doc"
                             onChange={e => {
                               if (e.target.files?.[0]) {
                                 setExistingMsaFile(e.target.files[0]);
                                 setData({...data, existing_msa_filename: e.target.files[0].name});
                               }
                             }}
                           />
                         </label>
                         {existingMsaFile && (
                           <div className="mt-3 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
                             <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             <span className="text-xs font-bold text-emerald-700 truncate">{existingMsaFile.name}</span>
                           </div>
                         )}
                      </div>
                    )}
                 </button>
              </div>
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
                  <div className="flex justify-between border-b border-border/50 pb-4">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Brand_Accent</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: data.brand_accent }} />
                      <span className="font-bold text-xs uppercase tracking-wider">{data.brand_accent}</span>
                    </div>
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
            disabled={!canProceed()}
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
