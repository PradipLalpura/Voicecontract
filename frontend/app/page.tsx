/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useRouter } from "next/navigation";
import { CompanyForm } from "@/components/CompanyForm";
import { AudioUploader } from "@/components/AudioUploader";
import { CompanyDetails } from "@/lib/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, FileText, Scale } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("voicecontract_company");
    if (stored) {
      setCompanyDetails(JSON.parse(stored));
    }
  }, []);

  const handleSaveCompany = (details: CompanyDetails) => {
    setCompanyDetails(details);
    toast.success("LEGAL IDENTITY ESTABLISHED");
  };

  const handleProcessAudio = (file: File) => {
    if (!companyDetails) {
      toast.error("IDENTITY REQUIRED");
      return;
    }
    
    if (typeof window !== "undefined") {
      (window as any).__voiceContractFile = file;
    }
    
    router.push("/processing");
  };

  return (
    <main className="min-h-screen bg-brand-void text-brand-starlight">
      
      {/* Structural Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] grayscale" />
        <div className="absolute top-0 right-0 w-px h-full bg-border/20" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-border/10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 space-y-24">
        
        {/* Bureaucratic Header */}
        <nav className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-4 border-brand-cyan pl-6 py-2 animate-in slide-in-from-left duration-700">
          <div>
            <h2 className="font-heading italic text-3xl tracking-tighter uppercase">VoiceContract</h2>
            <p className="font-mono text-[10px] text-brand-cyan uppercase tracking-[0.4em] mt-1">Autonomous Legal Logic Engine</p>
          </div>
          <div className="flex items-center gap-8 font-mono text-[9px] uppercase tracking-widest text-brand-dusk">
            <div className="flex flex-col items-end">
              <span>Jurisdiction</span>
              <span className="text-brand-starlight">India · 2026</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-end">
              <span>Status</span>
              <span className="text-brand-cyan animate-pulse">Operational</span>
            </div>
          </div>
        </nav>

        {/* Hero Segment */}
        <header className="max-w-4xl space-y-8 animate-in fade-in duration-1000">
          <h1 className="text-6xl md:text-8xl font-heading italic leading-[0.85] tracking-tight text-white">
            The meeting ends.<br />
            <span className="text-brand-cyan opacity-90 underline decoration-1 underline-offset-8">The paperwork is done.</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-dusk max-w-2xl font-sans leading-relaxed border-l border-border pl-8 italic">
            Automating the bridge between professional discussion and legal enforcement. Detailed reasoning. Confidential assembly. Zero delay.
          </p>
        </header>

        {/* Integrated Workflow */}
        <section className="space-y-20">
          
          {/* STEP 1: Identities */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="h-10 w-10 rounded-full border border-brand-cyan flex items-center justify-center font-mono text-sm text-brand-cyan">01</span>
              <h2 className="text-xs font-mono uppercase tracking-[0.4em] text-brand-dusk">Contracting Identities</h2>
            </div>
            <CompanyForm onSave={handleSaveCompany} initialData={companyDetails} />
          </div>

          {/* STEP 2: Submission */}
          <div className="grid lg:grid-cols-2 gap-16 items-center border-t border-border pt-20">
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                <span className="h-10 w-10 rounded-full border border-brand-cyan flex items-center justify-center font-mono text-sm text-brand-cyan">02</span>
                <h2 className="text-xs font-mono uppercase tracking-[0.4em] text-brand-dusk">Conversation Submission</h2>
              </div>
              <div className={`transition-all duration-700 ${!companyDetails ? "opacity-20 grayscale blur-sm pointer-events-none" : "opacity-100"}`}>
                <AudioUploader onProcess={handleProcessAudio} />
              </div>
            </div>

            <div className="bg-brand-surface/40 border border-border p-10 space-y-8 rounded-none">
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <ShieldCheck className="h-6 w-6 text-brand-cyan" />
                   <h3 className="font-heading italic text-xl uppercase">Confidential Processing</h3>
                 </div>
                 <p className="text-xs leading-relaxed text-brand-dusk uppercase tracking-widest font-sans">
                   Every audio stream is processed in a transient memory state. Transcripts are converted to structured legal tokens and immediately discarded.
                 </p>
               </div>

               <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-brand-cyan uppercase">
                      <FileText className="h-3 w-3" /> Agentic Output
                    </div>
                    <p className="text-[9px] text-brand-dusk uppercase">Detailed Master Service Agreements, Purchase Orders, and GST Invoices.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-brand-cyan uppercase">
                      <Scale className="h-3 w-3" /> Compliance
                    </div>
                    <p className="text-[9px] text-brand-dusk uppercase">Structured according to the Indian Contract Act, 1872.</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Footer Audit */}
        <footer className="pt-32 pb-12 border-t border-border flex flex-col md:flex-row justify-between gap-12 text-brand-dusk font-mono text-[8px] uppercase tracking-[0.5em]">
           <div className="flex flex-col gap-2">
              <span className="text-brand-starlight">VoiceContract v1.0.4</span>
              <span>Proprietary Agentic Architecture</span>
           </div>
           <div className="flex gap-12">
              <span>© 2026 JPN Studio / Antarik</span>
              <span>All Rights Reserved</span>
           </div>
        </footer>

      </div>
    </main>
  );
}
