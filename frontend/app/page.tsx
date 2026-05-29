"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import IdentityWizard from "@/components/IdentityWizard";
import MultimodalIngestor from "@/components/MultimodalIngestor";

const Background3D = lazy(() => import("@/components/Background3D"));

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingPage() {
  const router = useRouter();
  const [view, setView] = useState<"hero" | "onboarding" | "templates">("hero");
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);
  const [identity, setIdentity] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (view === "hero") {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(headlineRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.8, stagger: 0.15 });
      tl.fromTo(".hero-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.5 }, "-=1.2");
    }
  }, { scope: containerRef, dependencies: [view] });

  const handleIdentityComplete = (data: any) => {
    setIdentity(data);
    setView("templates");
  };

  return (
    <div ref={containerRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void bureau-grid-light">
      
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>

      <AnimatePresence>
        {activeSidebar && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-surface/95 backdrop-blur-3xl border-l border-border z-[100] p-16 shadow-2xl"
          >
            <button onClick={() => setActiveSidebar(null)} className="absolute top-10 left-10 p-2 hover:bg-void rounded-full transition-all group">
               <svg className="w-5 h-5 text-text/40 group-hover:text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mt-20 space-y-8">
               <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">{activeSidebar} Node</span>
               <h2 className="text-4xl font-display tracking-tighter italic">Mission Protocol</h2>
               <p className="text-text-muted text-sm leading-relaxed">System monitoring enabled. All legal transitions are cryptographically verified through the Antarik Nexus.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-12 z-50 px-10">
        <div className="text-2xl font-display tracking-tight text-text cursor-pointer group" onClick={() => setView("hero")}>
          <span className="font-bold">Voice</span><span className="text-signal italic group-hover:not-italic transition-all">Contract</span>
        </div>
        <div className="flex gap-12 font-sans text-[10px] font-black tracking-[0.4em] uppercase text-text/30 items-center">
          <button onClick={() => setActiveSidebar('Protocol')} className="hover:text-signal transition-colors">Protocol</button>
          <button onClick={() => setActiveSidebar('Archive')} className="hover:text-signal transition-colors">Archive</button>
          <button onClick={() => setView("onboarding")} className="px-8 py-3 bg-text text-void rounded-full hover:bg-signal transition-all shadow-premium">Launch Engine</button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === "hero" && (
          <motion.section 
            key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -50 }}
            className="relative text-center w-full max-w-5xl z-20"
          >
            <div className="mb-10 inline-flex items-center gap-3 px-5 py-2 bg-surface border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.3em] shadow-beveled">
              <span className="w-2 h-2 bg-signal rounded-full animate-pulse" />
              Autonomous Legal Architecture
            </div>
            <h1 ref={headlineRef} className="text-text font-display text-[clamp(3.5rem,9vw,7rem)] leading-[0.9] tracking-tighter mb-10">
              The meeting ends.<br/><span className="text-text/10 italic">The paperwork is done.</span>
            </h1>
            <p className="hero-sub max-w-2xl mx-auto text-text-muted font-sans text-xl md:text-2xl mb-16 leading-relaxed tracking-tight">
              A generative legal ecosystem that listens, reasons, and executes binding agreements before you hang up.
            </p>
            <div className="hero-sub flex flex-col md:flex-row gap-8 justify-center">
              <button onClick={() => setView("onboarding")} className="px-14 py-7 bg-signal text-void font-sans font-black text-xs uppercase tracking-[0.4em] rounded-3xl shadow-premium hover:shadow-signal/20 hover:scale-[1.05] transition-all duration-500">Initialize Genesis</button>
              <button className="px-14 py-7 bg-surface border border-border text-text font-sans font-bold text-xs uppercase tracking-[0.4em] rounded-3xl hover:bg-surface-muted transition-all">Audit Engine</button>
            </div>
          </motion.section>
        )}

        {view === "onboarding" && (
          <motion.section key="onboarding" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative z-20 w-full flex justify-center py-20">
            <IdentityWizard onComplete={handleIdentityComplete} />
          </motion.section>
        )}

        {view === "templates" && (
          <motion.section key="templates" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 w-full flex flex-col items-center py-20">
            <div className="mb-24 text-center">
              <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">Intelligence Node Established</span>
              <h2 className="text-7xl font-display text-text mt-4 tracking-tighter italic">Legal Vault</h2>
            </div>
            <MultimodalIngestor onSelect={() => router.push('/cockpit')} />
          </motion.section>
        )}
      </AnimatePresence>

      <div className="fixed bottom-12 left-12 font-system text-[9px] text-text/20 tracking-[0.6em] uppercase flex flex-col gap-2 font-black">
        <span>LAT: 23.0225°</span><span>LON: 72.5714°</span>
      </div>
      <div className="fixed bottom-12 right-12 font-system text-[9px] text-text/20 tracking-[0.4em] uppercase font-black">System_Active // Node_01</div>
    </div>
  );
}
