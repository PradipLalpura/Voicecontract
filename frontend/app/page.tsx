"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import IdentityWizard from "@/components/IdentityWizard";
import MultimodalIngestor from "@/components/MultimodalIngestor";

// Lazy load 3D to avoid SSR issues and improve initial load
const Background3D = lazy(() => import("@/components/Background3D"));

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingPage() {
  const router = useRouter();
  const [view, setView] = useState<"hero" | "onboarding" | "templates">("hero");
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (view === "hero") {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        headlineRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.5, stagger: 0.15 }
      );

      tl.fromTo(
        ".hero-sub",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2 },
        "-=0.8"
      );
    }
  }, { scope: containerRef, dependencies: [view] });

  const closeSidebar = () => setActiveSidebar(null);

  return (
    <div ref={containerRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void bureau-grid-light">
      
      {/* 3D Core Intelligence Node */}
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>

      {/* Sidebars / Modals for Storytelling */}
      <AnimatePresence>
        {activeSidebar && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-surface/90 backdrop-blur-2xl border-l border-border z-[100] p-16 shadow-2xl flex flex-col"
          >
            <button onClick={closeSidebar} className="absolute top-10 left-10 p-2 hover:bg-void rounded-full transition-all group">
               <svg className="w-5 h-5 text-text/40 group-hover:text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
            
            <div className="mt-20 space-y-12">
               <div className="space-y-4">
                 <span className="font-sans text-[10px] font-black text-signal tracking-[0.4em] uppercase">Document Vault</span>
                 <h2 className="text-4xl font-display tracking-tighter">
                   {activeSidebar === 'Protocol' ? 'Mission Protocol' : 'Legacy Archive'}
                 </h2>
               </div>

               <div className="space-y-8 text-text/60 font-sans text-sm leading-relaxed">
                  <p>
                    {activeSidebar === 'Protocol' 
                      ? 'The VoiceContract architecture utilizes a dual-agent sentinel system to monitor live transcriptions and identify finalized legal commitments with 99.4% accuracy.'
                      : 'Every meeting initialized through this node is cryptographically stamped and stored in your private secure vault.'
                    }
                  </p>
                  <div className="p-8 border border-dashed border-border rounded-3xl bg-void/50">
                     <span className="font-system text-[9px] text-text/20 uppercase">Awaiting Data...</span>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-12 z-50 px-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-display tracking-tight text-text cursor-pointer group flex items-center gap-3" 
          onClick={() => setView("hero")}
        >
          <span className="font-bold">Voice</span>
          <span className="text-signal italic group-hover:not-italic transition-all">Contract</span>
        </motion.div>
        
        <div className="flex gap-12 font-sans text-[10px] font-black tracking-[0.3em] uppercase text-text/30 items-center">
          <button onClick={() => setActiveSidebar('Protocol')} className="hover:text-signal transition-colors">Protocol</button>
          <button onClick={() => setActiveSidebar('Archive')} className="hover:text-signal transition-colors">Archive</button>
          <button 
            onClick={() => setView("onboarding")}
            className="px-8 py-3 bg-text text-void rounded-full hover:bg-signal transition-all shadow-premium"
          >
            Launch Engine
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === "hero" && (
          <motion.section 
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8 }}
            className="relative text-center w-full max-w-5xl z-20"
          >
            <div className="mb-10 inline-flex items-center gap-3 px-5 py-2 bg-surface border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] shadow-beveled">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
              </span>
              Security Node 01 // Operational
            </div>

            <h1 
              ref={headlineRef}
              className="text-text font-display text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.95] tracking-tighter mb-10"
            >
              The meeting ends.<br/>
              <span className="text-text/10 italic">The paperwork is done.</span>
            </h1>
            
            <p className="hero-sub max-w-2xl mx-auto text-text-muted font-sans text-xl md:text-2xl mb-16 leading-relaxed tracking-tight">
              An autonomous legal co-pilot that transforms raw conversation into 
              boardroom-ready Master Service Agreements in real-time.
            </p>

            <div className="hero-sub flex flex-col md:flex-row gap-8 justify-center items-center">
              <button 
                onClick={() => setView("onboarding")}
                className="group relative px-14 py-7 bg-signal text-void font-sans font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-premium hover:shadow-2xl hover:scale-[1.05] transition-all duration-500 overflow-hidden"
              >
                <span className="relative z-10">Initialize Genesis</span>
                <motion.div 
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/20 skew-x-12"
                />
              </button>
              
              <button className="px-14 py-7 bg-surface border border-border text-text font-sans font-bold text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-surface-muted transition-all duration-300">
                Technical Audit
              </button>
            </div>
          </motion.section>
        )}

        {view === "onboarding" && (
          <motion.section 
            key="onboarding"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-20 w-full flex justify-center py-20"
          >
            <IdentityWizard onComplete={() => setView("templates")} />
          </motion.section>
        )}

        {view === "templates" && (
          <motion.section 
            key="templates"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-20 w-full flex flex-col items-center py-20"
          >
            <div className="mb-24 text-center">
              <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">Intelligence Node</span>
              <h2 className="text-6xl font-display text-text mt-4 tracking-tighter italic">Select Architecture</h2>
            </div>
            <MultimodalIngestor onSelect={(strategy) => {
              router.push('/cockpit');
            }} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Grid Coordinates Decal */}
      <div className="fixed bottom-12 left-12 font-system text-[9px] text-text/20 tracking-[0.5em] uppercase flex flex-col gap-2 font-bold">
        <span>X: 23.0225° N</span>
        <span>Y: 72.5714° E</span>
      </div>
      
      <div className="fixed bottom-12 right-12 font-system text-[9px] text-text/20 tracking-[0.3em] uppercase font-bold">
        System_State: Stable // Memory: Transient
      </div>
    </div>
  );
}
