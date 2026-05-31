import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@clerk/nextjs";

interface IdentityData {
  company_name: string;
  gst_number: string;
  address: string;
  brand_dna_url: string;
  template_strategy: 'extract' | 'generate';
  company_logo_filename: string;
  existing_msa_filename: string;
  existing_po_filename: string;
  existing_invoice_filename: string;
}

interface TemplateOption {
  title: string;
  content: string;
}

interface GeneratedTemplates {
  msa: TemplateOption[];
  po: TemplateOption[];
  invoice: TemplateOption[];
}

interface BrandDNA {
  tone: { primary: string; descriptors: string[]; formality: string; personality: string };
  colours: { primary: string; secondary: string; accent: string };
  document_style: { header_style: string; font_personality: string };
}

function getApiBase() {
  let host = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST || "localhost:8000";
  host = host.replace(/^wss?:\/\//, "").split('/')[0];
  const protocol = typeof window !== 'undefined' && window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}`;
}

export default function IdentityWizard({ onComplete }: { onComplete: (data: IdentityData) => void }) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IdentityData>({
    company_name: '',
    gst_number: '',
    address: '',
    brand_dna_url: '',
    template_strategy: 'generate',
    company_logo_filename: '',
    existing_msa_filename: '',
    existing_po_filename: '',
    existing_invoice_filename: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [msaFile, setMsaFile] = useState<File | null>(null);

  const [gstWarning, setGstWarning] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Brand DNA states
  const [brandDnaTab, setBrandDnaTab] = useState<'url' | 'text'>('text');
  const [brandDnaContent, setBrandDnaContent] = useState('');
  const [isExtractingDna, setIsExtractingDna] = useState(false);
  const [brandDna, setBrandDna] = useState<BrandDNA | null>(null);
  const [dnaError, setDnaError] = useState('');

  // Template states
  const [generatedTemplates, setGeneratedTemplates] = useState<GeneratedTemplates | null>(null);
  const [selectedMsaIndex, setSelectedMsaIndex] = useState(0);
  const [selectedPoIndex, setSelectedPoIndex] = useState(0);
  const [selectedInvoiceIndex, setSelectedInvoiceIndex] = useState(0);

  const extractBrandDna = async () => {
    if (!brandDnaContent.trim()) return;
    setIsExtractingDna(true);
    setDnaError('');
    try {
      const token = await getToken() || "dev_token";
      const res = await fetch(`${getApiBase()}/api/brand/extract-dna`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ type: brandDnaTab, content: brandDnaContent })
      });
      if (res.ok) {
        const result = await res.json();
        setBrandDna(result);
        setData(d => ({ ...d, brand_dna_url: brandDnaContent }));
      } else {
        const err = await res.json().catch(() => null);
        setDnaError(err?.detail || "Failed to extract brand DNA. Try again.");
      }
    } catch (e) {
      setDnaError("Network error. Is the backend running?");
    } finally {
      setIsExtractingDna(false);
    }
  };

  const generateTemplates = async () => {
    setIsGenerating(true);
    try {
      const token = await getToken() || "dev_token";
      const res = await fetch(`${getApiBase()}/api/templates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          company_name: data.company_name,
          address: data.address,
          brand_dna_url: data.brand_dna_url
        })
      });
      if (res.ok) {
        setGeneratedTemplates(await res.json());
      } else {
        console.error("Template generation failed");
      }
    } catch (e) {
      console.error("Error generating templates:", e);
    } finally {
      setIsGenerating(false);
      setStep(4);
    }
  };

  const next = () => {
    if (step === 3 && data.template_strategy === 'generate') {
      generateTemplates();
    } else {
      setStep(s => Math.min(4, s + 1));
    }
  };
  const back = () => setStep(s => Math.max(1, s - 1));

  const validateGst = (value: string) => {
    setGstWarning('');
    if (value && value.length !== 15) setGstWarning('GSTIN should be 15 characters (Optional)');
  };

  const canProceed = () => {
    if (step === 1) return !!data.company_name.trim();
    if (step === 2) return !!brandDna; // Must have extracted brand DNA
    if (step === 3) {
      if (data.template_strategy === 'generate') return true;
      if (data.template_strategy === 'extract') return !!msaFile;
    }
    return true;
  };

  const handleFinish = () => {
    onComplete({
      ...data,
      company_logo_filename: logoFile?.name || '',
      existing_msa_filename: msaFile?.name || '',
    });
  };

  return (
    <div className="w-full max-w-2xl bg-surface border border-border p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
      {isGenerating && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-text mb-2">Generating Templates</h3>
          <p className="text-text-muted font-medium text-sm text-center px-8">AI is crafting brand-aware MSA, Invoice & PO templates...</p>
        </div>
      )}

      <div className="mb-12 flex justify-between items-start">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">Genesis_Configuration</span>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Identity_Setup</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Phase</span>
          <span className="text-2xl font-black text-text-muted tracking-tighter">0{step}<span className="text-border">/04</span></span>
        </div>
      </div>

      <div className="mb-10 flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-border/40'}`} />
        ))}
      </div>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {/* Step 1: Company Profile */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Legal Entity Name *</label>
                <input type="text" value={data.company_name} onChange={e => setData({ ...data, company_name: e.target.value })}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-primary/40 text-xl font-black tracking-tight uppercase" placeholder="Acme Systems LLC" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">GST / Tax ID (Optional)</label>
                <input type="text" value={data.gst_number} onChange={e => { setData({ ...data, gst_number: e.target.value }); validateGst(e.target.value); }}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold uppercase" placeholder="29GGGGG1314R..." />
                {gstWarning && <p className="mt-2 text-xs font-bold text-amber-500">{gstWarning}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Registered Office Address *</label>
                <textarea value={data.address} onChange={e => setData({ ...data, address: e.target.value })}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-primary/40 text-sm font-bold h-24 resize-none" placeholder="Enter full legal address..." />
              </div>
            </motion.div>
          )}

          {/* Step 2: Brand DNA Extraction */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Brand DNA *</label>
                <p className="text-xs text-text-muted mb-4">Provide your website URL or describe your brand tone. AI will extract your brand identity.</p>

                <div className="flex gap-2 mb-4">
                  {(['url', 'text'] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setBrandDnaTab(tab)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${brandDnaTab === tab ? 'bg-primary text-white' : 'bg-background border border-border text-text-muted hover:border-primary/40'}`}>
                      {tab === 'url' ? 'Website URL' : 'Describe Brand'}
                    </button>
                  ))}
                </div>

                {brandDnaTab === 'url' ? (
                  <input type="url" value={brandDnaContent} onChange={e => setBrandDnaContent(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold text-sm" placeholder="https://yourcompany.com" />
                ) : (
                  <textarea value={brandDnaContent} onChange={e => setBrandDnaContent(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold text-sm h-28 resize-none"
                    placeholder="E.g.: We are a modern fintech startup. Our tone is professional yet approachable. We use clean, minimal design with blue and white colors..." />
                )}

                <button type="button" onClick={extractBrandDna} disabled={!brandDnaContent.trim() || isExtractingDna}
                  className="mt-4 w-full px-6 py-4 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {isExtractingDna ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing Brand...</>
                  ) : (
                    <>Extract Brand DNA</>
                  )}
                </button>

                {dnaError && <p className="mt-3 text-xs font-bold text-red-500">{dnaError}</p>}
              </div>

              {/* Brand DNA Results */}
              {brandDna && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-background border border-primary/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Brand DNA Extracted</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Tone</span>
                      <p className="text-sm font-black mt-1">{brandDna.tone?.primary || 'Professional'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Formality</span>
                      <p className="text-sm font-black mt-1 capitalize">{brandDna.tone?.formality || 'formal'}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Colour Palette</span>
                    <div className="flex gap-2 mt-2">
                      {[brandDna.colours?.primary, brandDna.colours?.secondary, brandDna.colours?.accent].filter(Boolean).map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg border border-border" style={{ backgroundColor: c }} />
                          <span className="text-[10px] font-bold text-text-muted">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {brandDna.tone?.descriptors && (
                    <div className="flex flex-wrap gap-1.5">
                      {brandDna.tone.descriptors.map((d: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold">{d}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Template Strategy */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button type="button" onClick={() => setData({ ...data, template_strategy: 'generate' })}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all ${data.template_strategy === 'generate' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight italic mb-2">AI_Generate</h4>
                  <p className="text-xs font-medium text-text-muted leading-relaxed">Let AI build your MSA, PO & Invoice templates using your Brand DNA.</p>

                  {data.template_strategy === 'generate' && (
                    <div className="pt-4 mt-4 border-t border-primary/20">
                      <label className="flex flex-col items-center justify-center p-4 border border-dashed border-primary/40 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Upload Company Logo</span>
                        <span className="text-[9px] text-text-muted">PNG format (optional)</span>
                        <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg" onChange={e => { if (e.target.files?.[0]) setLogoFile(e.target.files[0]); }} />
                      </label>
                      {logoFile && <div className="mt-2 bg-emerald-50 border border-emerald-100 p-2 rounded-xl flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-xs font-bold text-emerald-700 truncate">{logoFile.name}</span></div>}
                    </div>
                  )}
                </button>

                <button type="button" onClick={() => setData({ ...data, template_strategy: 'extract' })}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all ${data.template_strategy === 'extract' ? 'border-primary bg-primary/5' : 'border-border bg-background opacity-60'}`}>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight italic mb-2">Extract_Existing</h4>
                  <p className="text-xs font-medium text-text-muted leading-relaxed">Upload your existing templates for AI analysis.</p>

                  {data.template_strategy === 'extract' && (
                    <div className="pt-4 mt-4 border-t border-primary/20">
                      <label className="flex items-center justify-between p-3 border border-dashed border-primary/40 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">MSA PDF *</span>
                        <input type="file" className="hidden" accept=".pdf,.docx" onChange={e => { if (e.target.files?.[0]) setMsaFile(e.target.files[0]); }} />
                        {msaFile ? <span className="text-xs text-emerald-600 font-bold truncate max-w-[100px]">{msaFile.name}</span> : <span className="text-xs text-text-muted">Upload</span>}
                      </label>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirm & Preview */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex flex-col items-center justify-center py-4">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Vault_Ready</h3>
                <p className="text-text-muted font-medium">Your corporate identity and AI-generated templates are secured.</p>
              </div>

              <div className="w-full bg-background border border-border rounded-3xl p-8 space-y-5">
                <div className="flex justify-between border-b border-border/50 pb-4">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Entity</span>
                  <span className="font-black uppercase italic tracking-tight">{data.company_name}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-4">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Brand Tone</span>
                  <span className="font-bold text-xs">{brandDna?.tone?.primary || 'Professional'}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-4">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Colours</span>
                  <div className="flex gap-1.5">
                    {[brandDna?.colours?.primary, brandDna?.colours?.secondary, brandDna?.colours?.accent].filter(Boolean).map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-md border border-border" style={{ backgroundColor: c || '#2563EB' }} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Strategy</span>
                  <span className="font-black text-primary uppercase italic tracking-widest text-xs">{data.template_strategy === 'generate' ? 'Neural_Generation' : 'Logic_Extraction'}</span>
                </div>
              </div>

              {generatedTemplates && (
                <div className="w-full p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">✓ Templates Generated & Stored</span>
                  <button type="button" onClick={() => setShowTemplatePreview(true)} className="text-xs bg-white text-primary px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors">Preview Templates</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {showTemplatePreview && generatedTemplates && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                <span className="font-black uppercase tracking-widest text-slate-800 text-sm">Review Generated Templates</span>
                <button onClick={() => setShowTemplatePreview(false)} className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-lg">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex flex-col gap-12">
                {(['msa', 'po', 'invoice'] as const).map(docType => {
                  const options = generatedTemplates[docType] || [];
                  const selectedIdx = docType === 'msa' ? selectedMsaIndex : docType === 'po' ? selectedPoIndex : selectedInvoiceIndex;
                  const setIdx = docType === 'msa' ? setSelectedMsaIndex : docType === 'po' ? setSelectedPoIndex : setSelectedInvoiceIndex;
                  return (
                    <div key={docType}>
                      <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">{docType.toUpperCase()} Options</h3>
                      <div className="grid grid-cols-3 gap-6">
                        {options.map((opt: TemplateOption, idx: number) => (
                          <div key={idx} onClick={() => setIdx(idx)} className={`bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${selectedIdx === idx ? 'border-primary ring-4 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                              <h4 className="font-bold text-sm text-slate-800">{opt.title}</h4>
                              {selectedIdx === idx && <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>}
                            </div>
                            <div className="prose prose-sm text-xs text-slate-600 h-[180px] overflow-hidden relative">
                              <div dangerouslySetInnerHTML={{ __html: opt.content }} />
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                            </div>
                          </div>
                        ))}
                        {options.length === 0 && <div className="col-span-3 text-center text-sm text-slate-500 py-10">No templates generated for {docType.toUpperCase()}.</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-16 pt-10 border-t border-border flex justify-between items-center">
        <button onClick={back} disabled={step === 1} className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-text hover:bg-background border border-border'}`}>Back</button>
        {step < 4 ? (
          <button onClick={next} disabled={!canProceed()} className="px-10 py-4 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl disabled:opacity-50">
            {step === 3 && data.template_strategy === 'generate' ? 'Generate_Templates' : 'Continue_Sequence'}
          </button>
        ) : (
          <button onClick={handleFinish} className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-hover transition-all shadow-apple transform active:scale-95">Access_Command_Center</button>
        )}
      </div>
    </div>
  );
}
