/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useRouter } from "next/navigation";
import { CompanyForm } from "@/components/CompanyForm";
import { AudioUploader } from "@/components/AudioUploader";
import { CompanyDetails } from "@/lib/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

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
    toast.success("Identity established");
  };

  const handleProcessAudio = (file: File) => {
    if (!companyDetails) {
      toast.error("Set your identity first");
      return;
    }
    
    if (typeof window !== "undefined") {
      (window as any).__voiceContractFile = file;
    }
    
    router.push("/processing");
  };

  return (
    <main className="min-h-screen bg-brand-void text-brand-starlight selection:bg-brand-cyan/30 selection:text-brand-cyan">
      
      {/* Subtle background atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-cyan/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-violet/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24 space-y-24">
        
        {/* Navigation / Header */}
        <nav className="flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="h-10 w-10 bg-brand-cyan rounded-lg flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-transform">
              <span className="font-heading italic font-bold text-brand-void text-2xl">V</span>
            </div>
            <span className="font-heading italic text-2xl tracking-tight">VoiceContract</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.2em] font-mono text-brand-dusk">
            <span className="hover:text-brand-cyan transition-colors cursor-pointer">Agentic Pipeline</span>
            <span className="hover:text-brand-cyan transition-colors cursor-pointer">Legal Intelligence</span>
            <span className="h-1 w-1 bg-brand-cyan rounded-full" />
            <span className="text-brand-cyan">Buildathon v1.0</span>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] uppercase tracking-widest font-mono animate-in fade-in zoom-in duration-1000">
            <Sparkles className="h-3 w-3" />
            Zero Manual Steps. Zero Friction.
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading italic leading-[0.9] tracking-tight animate-in fade-in slide-in-from-left-4 duration-1000">
            Client call ends. <br />
            <span className="text-brand-cyan">Contract is ready.</span>
          </h1>
          <p className="text-xl md:text-2xl text-brand-dusk max-w-2xl font-sans leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
            The space between earth and sky is the region where signals land. We bridge the gap between "we discussed it" and a signed agreement.
          </p>
        </header>

        {/* Main Interface */}
        <section className="grid lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest font-mono text-brand-cyan flex items-center gap-2">
                <span className="h-px w-8 bg-brand-cyan" /> 
                01 · Identity
              </h2>
              <CompanyForm onSave={handleSaveCompany} initialData={companyDetails} />
            </div>

            <div className="grid grid-cols-2 gap-6 opacity-60">
              <div className="p-6 border border-border rounded-xl space-y-2">
                <ShieldCheck className="h-5 w-5 text-brand-cyan" />
                <h3 className="font-mono text-[10px] uppercase tracking-wider">Secure</h3>
                <p className="text-xs text-brand-dusk">No data is ever stored on our servers. Local first.</p>
              </div>
              <div className="p-6 border border-border rounded-xl space-y-2">
                <Zap className="h-5 w-5 text-brand-gold" />
                <h3 className="font-mono text-[10px] uppercase tracking-wider">Fast</h3>
                <p className="text-xs text-brand-dusk">Multi-agent parallel processing in &lt; 60s.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
             <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest font-mono text-brand-cyan flex items-center gap-2">
                <span className="h-px w-8 bg-brand-cyan" /> 
                02 · Transmission
              </h2>
              <div className={`transition-all duration-700 ${!companyDetails ? "grayscale brightness-50 blur-[2px] pointer-events-none" : "scale-100 opacity-100"}`}>
                <AudioUploader onProcess={handleProcessAudio} />
              </div>
              {!companyDetails && (
                <div className="p-6 border border-brand-amber/20 bg-brand-amber/5 rounded-xl text-center flex flex-col items-center gap-3 animate-pulse">
                  <p className="text-brand-amber text-sm font-medium">
                    Identity not established.
                  </p>
                  <p className="text-xs text-brand-amber/60 max-w-xs">
                    Please complete the company profile to unlock audio transmission and processing.
                  </p>
                </div>
              )}
            </div>

            {/* Pipeline Visualizer (Static context) */}
            <div className="p-8 border border-border rounded-2xl bg-brand-surface/30 space-y-6">
               <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-dusk">Engineered Pipeline</h3>
               <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center bg-brand-void group-hover:border-brand-cyan transition-colors">
                      <span className="text-[10px] font-mono">GROQ</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-tighter text-brand-dusk">Whisper</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-border" />
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center bg-brand-void group-hover:border-brand-cyan transition-colors">
                      <span className="text-[10px] font-mono">LLM</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-tighter text-brand-dusk">Extract</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-border" />
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center bg-brand-void group-hover:border-brand-cyan transition-colors">
                      <span className="text-[10px] font-mono">GPT</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-tighter text-brand-dusk">Reason</span>
                  </div>
                   <ArrowRight className="h-4 w-4 text-border" />
                  <div className="flex flex-col items-center gap-2 group">
                    <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center bg-brand-void group-hover:border-brand-cyan transition-colors">
                      <span className="text-[10px] font-mono">PDF</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-tighter text-brand-dusk">Format</span>
                  </div>
               </div>
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer className="pt-24 border-t border-border flex flex-col md:flex-row justify-between gap-8 text-brand-dusk font-mono text-[10px] uppercase tracking-widest pb-12">
           <div>© 2026 ANTARIK · Digital Creative arm of JPN Studio</div>
           <div className="flex gap-8">
              <span className="hover:text-brand-cyan transition-colors cursor-pointer underline underline-offset-4">Privacy Policy</span>
              <span className="hover:text-brand-cyan transition-colors cursor-pointer underline underline-offset-4">Terms of Use</span>
           </div>
        </footer>

      </div>
    </main>
  );
}
