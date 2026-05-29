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
const CharacterScene = lazy(() => import("@/components/Background3D").then(mod => ({ default: mod.CharacterScene })));

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
      tl.fromTo(headlineRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.8, stagger: 0.15 });
      tl.fromTo(".hero-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.5 }, "-=1.2");
      tl.fromTo(".character-entrance", { opacity: 0, scale: 0.8, x: 50 }, { opacity: 1, scale: 1, x: 0, duration: 2, ease: "back.out(1.7)" }, "-=1.5");
    }
  }, { scope: containerRef, dependencies: [view] });

  return (
    <div ref={containerRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void bureau-grid-light">
      
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>

      {/* Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-12 z-[100] px-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-display tracking-tight text-text cursor-pointer group flex items-center gap-3" 
          onClick={() => setView("hero")}
        >
          <div className="w-10 h-10 bg-signal rounded-2xl flex items-center justify-center shadow-premium rotate-3 group-hover:rotate-0 transition-transform">
             <span className="text-void font-bold">V</span>
          </div>
          <span className="font-bold">Voice</span><span className="text-signal italic">Contract</span>
        </motion.div>
        
        <div className="flex gap-12 font-sans text-[11px] font-black tracking-[0.4em] uppercase text-text/30 items-center">
          <button onClick={() => setActiveSidebar('Protocol')} className="hover:text-signal transition-colors">Protocol</button>
          <button onClick={() => setActiveSidebar('Archive')} className="hover:text-signal transition-colors">Archive</button>
          <button onClick={() => setView("onboarding")} className="px-8 py-4 bg-text text-void rounded-2xl hover:bg-signal transition-all shadow-premium font-bold">Launch Engine</button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === "hero" && (
          <motion.section 
            key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -50 }}
            className="relative w-full max-w-7xl z-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
          >
            <div className="text-left space-y-10">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-signal/10 border border-signal/20 rounded-full text-[11px] font-black text-signal uppercase tracking-[0.3em] shadow-beveled">
                <span className="w-2 h-2 bg-signal rounded-full animate-pulse" />
                V2.0 Intelligence Node
              </div>

              <h1 ref={headlineRef} className="text-text font-display text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tighter">
                The meeting ends.<br/><span className="text-text/10 italic">The paperwork is done.</span>
              </h1>
              
              <p className="hero-sub max-w-xl text-text-muted font-sans text-xl md:text-2xl leading-relaxed tracking-tight">
                Your autonomous legal co-pilot. Listen, reason, and execute binding agreements in the blink of an eye.
              </p>

              <div className="hero-sub flex gap-8">
                <button onClick={() => setView("onboarding")} className="px-14 py-7 bg-signal text-void font-sans font-black text-sm uppercase tracking-[0.4em] rounded-[28px] shadow-2xl hover:shadow-signal/40 hover:scale-[1.05] transition-all duration-500">Initialize Identity</button>
                <button className="px-14 py-7 bg-surface border border-border text-text font-sans font-bold text-sm uppercase tracking-[0.4em] rounded-[28px] hover:bg-surface-muted transition-all">Audit Engine</button>
              </div>
            </div>

            {/* Cinematic 3D Character - The Strategist */}
            <div className="character-entrance hidden lg:block relative h-[600px] w-full">
               <Suspense fallback={<div className="h-full w-full bg-void animate-pulse rounded-full" />}>
                  <CharacterScene 
                    scene="https://prod.spline.design/at27hY4iI73C5L8M/scene.splinecode" 
                    className="h-full w-full pointer-events-auto scale-125" 
                  />
               </Suspense>
               <div className="absolute bottom-0 left-0 bg-surface/80 backdrop-blur-xl p-8 border border-border rounded-3xl shadow-premium animate-float max-w-xs">
                  <span className="font-system text-[10px] text-signal font-black uppercase mb-2 block tracking-widest">Master Strategist</span>
                  <p className="text-text/70 text-sm font-bold leading-snug tracking-tight">"I've analyzed 40,000+ negotiations. Your deal is in secure hands."</p>
               </div>
            </div>
          </motion.section>
        )}

        {view === "onboarding" && (
          <motion.section key="onboarding" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative z-20 w-full flex justify-center py-20 px-6">
            <div className="w-full flex flex-col lg:flex-row items-center gap-20">
               <div className="hidden lg:block w-[400px] h-[500px]">
                  <Suspense fallback={null}>
                    <CharacterScene 
                      scene="https://prod.spline.design/E0G8Z0u0u0U0u0U0/scene.splinecode" 
                      className="h-full w-full scale-150"
                    />
                  </Suspense>
               </div>
               <IdentityWizard onComplete={() => setView("templates")} />
            </div>
          </motion.section>
        )}

        {view === "templates" && (
          <motion.section key="templates" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 w-full flex flex-col items-center py-20">
            <div className="mb-24 text-center">
              <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">Identity Confirmed</span>
              <h2 className="text-7xl font-display text-text mt-4 tracking-tighter italic">The Legal Vault</h2>
            </div>
            <MultimodalIngestor onSelect={() => router.push('/cockpit')} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Decorative Decals */}
      <div className="fixed bottom-12 left-12 font-system text-[10px] text-text/20 tracking-[0.6em] uppercase flex flex-col gap-2 font-black">
        <span>LAT: 23.0225°</span><span>LON: 72.5714°</span>
      </div>
      <div className="fixed bottom-12 right-12 font-system text-[10px] text-text/20 tracking-[0.4em] uppercase font-black">Memory: Zero-Storage // Node: Secured</div>
    </div>
  );
}
