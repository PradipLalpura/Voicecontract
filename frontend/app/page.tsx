"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import IdentityWizard from "@/components/IdentityWizard";
import MultimodalIngestor from "@/components/MultimodalIngestor";

import Background3D, { CharacterScene } from "@/components/Background3D";

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
      tl.fromTo(headlineRef.current, { y: 100, opacity: 0, rotateX: -20 }, { y: 0, opacity: 1, rotateX: 0, duration: 2, stagger: 0.2 });
      tl.fromTo(".hero-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.5 }, "-=1.4");
      tl.fromTo(".character-vault", { opacity: 0, scale: 0.9, rotateY: 45 }, { opacity: 1, scale: 1, rotateY: 0, duration: 2.5, ease: "power4.out" }, "-=1.8");
    }
  }, { scope: containerRef, dependencies: [view] });

  return (
    <div ref={containerRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void">
      
      <Suspense fallback={<div className="absolute inset-0 bg-void animate-pulse" />}>
        <Background3D />
      </Suspense>

      {/* Persistent Security Frame */}
      <div className="fixed inset-0 border-[20px] border-surface pointer-events-none z-50 opacity-10" />

      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-12 z-[100] px-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => setView("hero")}
        >
          <div className="w-12 h-12 bg-signal flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(0,194,204,0.3)] rotate-3 group-hover:rotate-0 transition-transform">
             <span className="text-void font-bold text-xl">V</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold leading-none">Voice<span className="text-signal italic">Contract</span></h2>
            <span className="text-[9px] font-system text-text/30 tracking-[0.4em] uppercase">Genesis_Cluster_01</span>
          </div>
        </motion.div>
        
        <div className="flex gap-10 font-sans text-[10px] font-black tracking-[0.3em] uppercase text-text/30 items-center">
          <button onClick={() => setActiveSidebar('Protocol')} className="hover:text-signal hover:tracking-[0.5em] transition-all">Protocol</button>
          <button onClick={() => setActiveSidebar('Archive')} className="hover:text-signal hover:tracking-[0.5em] transition-all">Archive</button>
          <button onClick={() => setView("onboarding")} className="px-10 py-4 bg-text text-void rounded-2xl hover:bg-signal transition-all shadow-premium font-bold hover:scale-105 active:scale-95">Initialize_Nexus</button>
        </div>
      </nav>

      {/* Dynamic Sidebars */}
      <AnimatePresence>
        {activeSidebar && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 right-0 w-full md:w-[500px] glass-morphism z-[200] p-20 shadow-2xl flex flex-col"
          >
            <button onClick={() => setActiveSidebar(null)} className="absolute top-12 left-12 p-3 hover:bg-white/5 rounded-full transition-all group border border-white/10">
               <svg className="w-4 h-4 text-text/40 group-hover:text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mt-20 space-y-10">
               <span className="font-system text-[11px] font-black text-signal tracking-[0.5em] uppercase border-b border-signal/30 pb-2 inline-block">Authenticated Node</span>
               <h2 className="text-5xl font-display tracking-tighter italic leading-none">{activeSidebar === 'Protocol' ? 'Mission_Log' : 'Secured_Vault'}</h2>
               <p className="text-text/50 text-lg font-sans leading-relaxed tracking-tight">The 2026 Legal Synthesis Engine is operational. All data is processed in volatile memory with zero persistent footprint.</p>
               <div className="p-10 border border-border bg-white/5 rounded-[40px] beveled-edge">
                  <div className="w-2 h-2 bg-signal rounded-full animate-ping mb-4" />
                  <span className="font-system text-[10px] text-text/20 uppercase tracking-widest">Scanning Network...</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === "hero" && (
          <motion.section 
            key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="relative w-full max-w-7xl z-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mt-20"
          >
            <div className="space-y-12">
              <div className="inline-flex items-center gap-4 px-6 py-2.5 glass-morphism rounded-full text-[11px] font-black text-signal uppercase tracking-[0.3em]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
                </span>
                Encrypted Processing Node
              </div>

              <h1 ref={headlineRef} className="text-text font-display text-[clamp(3.5rem,8.5vw,7.5rem)] leading-[0.85] tracking-tighter">
                Meeting Ends.<br/><span className="text-text/10 italic">Paperwork Done.</span>
              </h1>
              
              <p className="hero-sub max-w-xl text-text-muted font-sans text-xl md:text-2xl leading-relaxed tracking-tight">
                An elite autonomous legal department that interprets Hinglish negotiations and dispatches binding packages instantly.
              </p>

              <div className="hero-sub flex gap-8">
                <button onClick={() => setView("onboarding")} className="px-16 py-8 bg-signal text-void font-sans font-black text-sm uppercase tracking-[0.4em] rounded-[32px] shadow-[0_20px_50px_rgba(0,194,204,0.3)] hover:brightness-110 hover:translate-y-[-5px] transition-all duration-500">Genesis_Start</button>
                <button className="px-16 py-8 glass-morphism text-text font-sans font-bold text-sm uppercase tracking-[0.4em] rounded-[32px] hover:bg-white/10 transition-all">Audit_Core</button>
              </div>
            </div>

            {/* The Master Strategist Character - Floating in a Glass Vault */}
            <div className="character-vault hidden lg:block relative h-[700px] w-full group">
               <div className="absolute inset-0 glass-morphism rounded-[100px] beveled-edge opacity-40 group-hover:opacity-60 transition-opacity" />
               <Suspense fallback={null}>
                  <CharacterScene 
                    scene="https://prod.spline.design/at27hY4iI73C5L8M/scene.splinecode" 
                    className="h-full w-full scale-125" 
                  />
               </Suspense>
               <div className="absolute top-1/2 left-[-10%] bg-surface border border-border p-10 rounded-[40px] shadow-premium animate-float max-w-xs rotate-[-5deg]">
                  <span className="font-system text-[11px] text-signal font-black uppercase mb-3 block tracking-[0.4em]">The Strategist</span>
                  <p className="text-text/80 text-base font-bold leading-snug italic tracking-tight">"I am monitoring 48 concurrent deal pillars. Your negotiation is secured."</p>
               </div>
            </div>
          </motion.section>
        )}

        {view === "onboarding" && (
          <motion.section key="onboarding" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative z-20 w-full flex justify-center py-20 px-6">
            <div className="w-full flex flex-col lg:flex-row items-center gap-24">
               <div className="hidden lg:block w-[500px] h-[600px] glass-morphism rounded-[80px] p-10 overflow-hidden beveled-edge">
                  <Suspense fallback={null}>
                    <CharacterScene 
                      scene="https://prod.spline.design/E0G8Z0u0u0U0u0U0/scene.splinecode" 
                      className="h-full w-full scale-[1.8] translate-y-20"
                    />
                  </Suspense>
                  <div className="absolute bottom-10 left-10 right-10 text-center">
                     <span className="font-system text-[10px] text-text/20 uppercase tracking-[0.5em]">Gatekeeper_Entity_01</span>
                  </div>
               </div>
               <IdentityWizard onComplete={() => setView("templates")} />
            </div>
          </motion.section>
        )}

        {view === "templates" && (
          <motion.section key="templates" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 w-full flex flex-col items-center py-20">
            <div className="mb-24 text-center">
              <span className="font-sans text-[12px] font-black text-signal tracking-[0.6em] uppercase">Intelligence_Unlocked</span>
              <h2 className="text-8xl font-display text-text mt-6 tracking-tighter italic leading-none">Legal_Vault</h2>
            </div>
            <MultimodalIngestor onSelect={() => router.push('/cockpit')} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Decorative Metadata */}
      <div className="fixed bottom-12 left-12 font-system text-[10px] text-text/20 tracking-[0.6em] uppercase flex flex-col gap-2 font-black">
        <span>X: 23.0225° N</span><span>Y: 72.5714° E</span>
      </div>
      <div className="fixed bottom-12 right-12 font-system text-[10px] text-text/20 tracking-[0.4em] uppercase font-black flex items-center gap-4">
        <div className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
        Protocol_Stable // No_Storage_Mode
      </div>
    </div>
  );
}
