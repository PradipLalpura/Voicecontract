"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import IdentityWizard from "@/components/IdentityWizard";
import MultimodalIngestor from "@/components/MultimodalIngestor";

export default function LandingPage() {
  const [view, setView] = useState<"hero" | "onboarding" | "templates">("hero");
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (view === "hero") {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        headlineRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.2 }
      );

      tl.fromTo(
        ".hero-sub",
        { opacity: 0 },
        { opacity: 1, duration: 1 },
        "-=0.8"
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [view]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden">
      {/* Atmosphere Background */}
      <div className="absolute inset-0 bg-noise-gradient opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-signal/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-8 z-50 mix-blend-difference px-6">
        <div className="text-xl font-system tracking-tighter text-signal uppercase cursor-pointer" onClick={() => setView("hero")}>
          VoiceContract<span className="opacity-50">.Pro</span>
        </div>
        <div className="flex gap-12 font-system text-xs tracking-widest uppercase opacity-70">
          <a href="#" className="hover:text-signal transition-colors">Protocol</a>
          <a href="#" className="hover:text-signal transition-colors">Archive</a>
          <a href="#" className="hover:text-signal transition-colors">Auth</a>
        </div>
      </nav>

      {view === "hero" && (
        <section ref={heroRef} className="relative text-center w-full max-w-6xl">
          <h1 
            ref={headlineRef}
            className="text-white font-display text-[clamp(2.5rem,8vw,5.5rem)] leading-[1.1] tracking-tight mb-8"
          >
            The meeting ends.<br/>
            <span className="text-signal italic">The paperwork is already done.</span>
          </h1>
          
          <p className="hero-sub max-w-xl mx-auto text-white/50 font-sans text-lg md:text-xl mb-12 leading-relaxed">
            The first autonomous legal co-pilot that listens, reasons, and dispatches 
            boardroom-ready Master Service Agreements in under 60 seconds.
          </p>

          <div className="hero-sub flex flex-col md:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => setView("onboarding")}
              className="group relative px-8 py-4 bg-signal text-void font-system text-sm font-bold uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Initialize Onboarding</span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </button>
            
            <button className="px-8 py-4 border border-white/10 hover:border-signal/50 text-white font-system text-sm uppercase tracking-widest transition-all">
              Watch Technical Audit
            </button>
          </div>
        </section>
      )}

      {view === "onboarding" && (
        <section className="relative z-20 w-full flex justify-center py-20">
          <IdentityWizard onComplete={() => setView("templates")} />
        </section>
      )}

      {view === "templates" && (
        <section className="relative z-20 w-full flex flex-col items-center py-20">
          <div className="mb-16 text-center">
            <span className="font-system text-[10px] text-signal tracking-[0.4em] uppercase">Intelligence Node: Active</span>
            <h2 className="text-4xl font-display text-white mt-4">Select Template Strategy</h2>
          </div>
          <MultimodalIngestor />
        </section>
      )}

      {/* Grid Decals */}
      <div className="fixed bottom-12 left-12 font-system text-[10px] text-white/20 tracking-[0.2em] uppercase vertical-text origin-left -rotate-90">
        Engine_Status: Operational // Logic: GPT-4o_Supreme
      </div>
      <div className="fixed bottom-12 right-12 font-system text-[10px] text-white/20 tracking-[0.2em] uppercase">
        ©2026 Antarik // Bureaucratic_Noir_v2.0
      </div>
    </div>
  );
}


