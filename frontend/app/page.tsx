"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import IdentityWizard from "@/components/IdentityWizard";
import MultimodalIngestor from "@/components/MultimodalIngestor";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingPage() {
  const [view, setView] = useState<"hero" | "onboarding" | "templates">("hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (view === "hero") {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        headlineRef.current,
        { y: 100, opacity: 0, skewY: 7 },
        { y: 0, opacity: 1, skewY: 0, duration: 1.8, stagger: 0.1 }
      );

      tl.fromTo(
        ".hero-sub",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.5 },
        "-=1.2"
      );

      // Cinematic 3D Sphere Float
      gsap.to(sphereRef.current, {
        y: "-=30",
        rotationZ: 10,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, { scope: containerRef, dependencies: [view] });

  return (
    <div ref={containerRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void bureau-grid-light">
      
      {/* 3D Atmospheric Background Node */}
      <div 
        ref={sphereRef}
        className="absolute top-[15%] right-[-5%] w-[500px] h-[500px] pointer-events-none opacity-20"
      >
        <div className="absolute inset-0 bg-signal rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
        <div className="absolute inset-20 border-[0.5px] border-signal/30 rounded-full rotate-45" />
        <div className="absolute inset-32 border-[0.5px] border-signal/20 rounded-full -rotate-12" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-12 z-50 px-10">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-2xl font-display tracking-tight text-text cursor-pointer group flex items-center gap-3" 
          onClick={() => setView("hero")}
        >
          <div className="w-8 h-8 border-[0.5px] border-text/20 rounded-full flex items-center justify-center group-hover:border-signal transition-colors">
            <div className="w-1.5 h-1.5 bg-signal rounded-full" />
          </div>
          <span className="font-bold">Voice</span>
          <span className="text-signal italic">Contract</span>
        </motion.div>
        
        <div className="flex gap-12 font-sans text-[10px] font-black tracking-[0.3em] uppercase text-text/30 items-center">
          <button className="hover:text-signal transition-colors">Protocol</button>
          <button className="hover:text-signal transition-colors">Archive</button>
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
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
            className="relative text-center w-full max-w-5xl z-20"
          >
            <div className="mb-10 inline-flex items-center gap-3 px-4 py-1.5 bg-surface border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] shadow-beveled">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
              </span>
              Autonomous Legal Genesis
            </div>

            <h1 
              ref={headlineRef}
              className="text-text font-display text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tighter mb-10"
            >
              The meeting ends.<br/>
              <span className="text-text/20 italic">The paperwork is done.</span>
            </h1>
            
            <p className="hero-sub max-w-2xl mx-auto text-text-muted font-sans text-xl mb-16 leading-relaxed tracking-tight">
              A high-stakes intelligence layer that captures, reasons, and executes 
              legally binding agreements in the duration of a single conversation.
            </p>

            <div className="hero-sub flex flex-col md:flex-row gap-8 justify-center items-center">
              <button 
                onClick={() => setView("onboarding")}
                className="group relative px-12 py-6 bg-signal text-void font-sans font-black text-sm uppercase tracking-widest rounded-2xl shadow-premium hover:shadow-2xl hover:scale-[1.05] transition-all duration-500 overflow-hidden"
              >
                <span className="relative z-10">Initialize Identity</span>
                <motion.div 
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/20 skew-x-12"
                />
              </button>
              
              <button className="px-12 py-6 bg-surface border border-border text-text font-sans font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-surface-muted transition-all duration-300">
                Audit Protocol
              </button>
            </div>
          </motion.section>
        )}

        {view === "onboarding" && (
          <motion.section 
            key="onboarding"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 w-full flex justify-center py-20"
          >
            <IdentityWizard onComplete={() => setView("templates")} />
          </motion.section>
        )}

        {view === "templates" && (
          <motion.section 
            key="templates"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-20 w-full flex flex-col items-center py-20"
          >
            <div className="mb-24 text-center">
              <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">Security Level: Verified</span>
              <h2 className="text-6xl font-display text-text mt-4 tracking-tighter italic">Architectural Core</h2>
            </div>
            <MultimodalIngestor />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Grid Coordinates Decal */}
      <div className="fixed bottom-12 left-12 font-system text-[8px] text-text/20 tracking-[0.5em] uppercase flex flex-col gap-2">
        <span>X: 23.0225° N</span>
        <span>Y: 72.5714° E</span>
      </div>
      
      <div className="fixed bottom-12 right-12 font-system text-[8px] text-text/20 tracking-[0.3em] uppercase">
        Signal_Status: Connected // Node_01
      </div>
    </div>
  );
}
