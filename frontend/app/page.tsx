"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import IdentityWizard from "@/components/IdentityWizard";
import MultimodalIngestor from "@/components/MultimodalIngestor";

import { motion } from "framer-motion";

export default function LandingPage() {
  const [view, setView] = useState<"hero" | "onboarding" | "templates">("hero");
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (view === "hero") {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        headlineRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.5, stagger: 0.1 }
      );

      tl.fromTo(
        ".hero-sub",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2 },
        "-=1"
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [view]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void bureau-grid-light">
      {/* Decorative Atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-signal/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-signal/3 blur-[130px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-10 z-50 px-6">
        <div 
          className="text-2xl font-display tracking-tight text-text cursor-pointer group" 
          onClick={() => setView("hero")}
        >
          Voice<span className="text-signal italic group-hover:not-italic transition-all">Contract</span>
        </div>
        <div className="flex gap-10 font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-text/40">
          <a href="#" className="hover:text-signal transition-colors">Protocol</a>
          <a href="#" className="hover:text-signal transition-colors">Archive</a>
          <button className="px-5 py-2 bg-text text-void rounded-full hover:bg-signal transition-all">Launch Engine</button>
        </div>
      </nav>

      {view === "hero" && (
        <section ref={heroRef} className="relative text-center w-full max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 inline-flex items-center gap-2 px-3 py-1 bg-signal/10 border border-signal/20 rounded-full text-[10px] font-bold text-signal uppercase tracking-widest"
          >
            <span className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
            2026 Production Protocol v2.0
          </motion.div>

          <h1 
            ref={headlineRef}
            className="text-text font-display text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] tracking-tight mb-10"
          >
            The meeting ends.<br/>
            <span className="text-text/30 italic">The paperwork is already done.</span>
          </h1>
          
          <p className="hero-sub max-w-2xl mx-auto text-text-muted font-sans text-xl mb-14 leading-relaxed tracking-tight">
            An autonomous legal architecture that listens, reasons, and dispatches 
            premium Master Service Agreements in under 60 seconds.
          </p>

          <div className="hero-sub flex flex-col md:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => setView("onboarding")}
              className="px-10 py-5 bg-signal text-void font-sans font-bold rounded-xl shadow-premium hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Start Onboarding
            </button>
            
            <button className="px-10 py-5 bg-surface border border-border text-text font-sans font-semibold rounded-xl hover:bg-surface-muted transition-all duration-300">
              Technical Overview
            </button>
          </div>
        </section>
      )}

      {view === "onboarding" && (
        <section className="relative z-20 w-full flex justify-center py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <IdentityWizard onComplete={() => setView("templates")} />
        </section>
      )}

      {view === "templates" && (
        <section className="relative z-20 w-full flex flex-col items-center py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="mb-20 text-center">
            <span className="font-sans text-[11px] font-black text-signal tracking-[0.4em] uppercase">Intelligence Node</span>
            <h2 className="text-5xl font-display text-text mt-4">Template Strategy</h2>
          </div>
          <MultimodalIngestor />
        </section>
      )}

      {/* Decorative Decals */}
      <div className="fixed bottom-10 left-10 font-system text-[9px] text-text/20 tracking-[0.3em] uppercase">
        Infrastructure: Zero-Trust // Logic: GPT-4o_Supreme
      </div>
      <div className="fixed bottom-10 right-10 font-system text-[9px] text-text/20 tracking-[0.3em] uppercase">
        ©2026 Antarik // Pristine_Bureaucracy_v2.0
      </div>
    </div>
  );
}
