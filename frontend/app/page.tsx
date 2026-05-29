"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import * as Clerk from "@clerk/nextjs";
import Background3D, { CharacterScene } from "@/components/Background3D";
import { SafeAuth } from "@/components/SafeAuth";

gsap.registerPlugin(useGSAP);

export default function LandingPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(headlineRef.current, { y: 120, opacity: 0, rotateX: -30 }, { y: 0, opacity: 1, rotateX: 0, duration: 2.2, stagger: 0.2 });
    tl.fromTo(".hero-sub", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.8 }, "-=1.6");
    tl.fromTo(".character-vault", { opacity: 0, scale: 0.8, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 2.5, ease: "power4.out" }, "-=2");
    tl.fromTo(".nav-item", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, "-=2.2");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-void selection:bg-signal/30">
      
      <Suspense fallback={<div className="absolute inset-0 bg-void animate-pulse" />}>
        <Background3D />
      </Suspense>

      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full max-w-7xl flex justify-between items-center py-12 z-[100] px-10">
        <div className="nav-item flex items-center gap-4 cursor-pointer group">
          <div className="w-12 h-12 bg-signal flex items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(0,194,204,0.4)] rotate-6 group-hover:rotate-0 transition-all duration-500">
             <span className="text-void font-bold text-xl">V</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold leading-none text-white">Voice<span className="text-signal italic">Contract</span></h2>
            <span className="text-[9px] font-system text-text/30 tracking-[0.4em] uppercase">Supreme_Nexus_v2.0</span>
          </div>
        </div>
        
        <div className="flex gap-12 font-sans text-[10px] font-black tracking-[0.4em] uppercase text-text/30 items-center">
          <button className="nav-item hover:text-signal hover:tracking-[0.5em] transition-all">Protocol</button>
          <button className="nav-item hover:text-signal hover:tracking-[0.5em] transition-all">Security</button>
          
          <div className="nav-item">
            <SafeAuth mode="signedOut">
              <Clerk.SignInButton mode="modal">
                <button className="px-10 py-4 bg-white text-void rounded-2xl hover:bg-signal transition-all shadow-premium font-bold hover:scale-105 active:scale-95">
                  Access_Nexus
                </button>
              </Clerk.SignInButton>
            </SafeAuth>
            <SafeAuth mode="signedIn">
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-10 py-4 bg-signal text-void rounded-2xl hover:brightness-110 transition-all shadow-premium font-bold hover:scale-105 active:scale-95 mr-6"
              >
                Go_To_Dashboard
              </button>
              {hasClerk && <Clerk.UserButton />}
            </SafeAuth>
          </div>
        </div>
      </nav>

      <main className="relative w-full max-w-7xl z-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mt-20">
        <div className="space-y-14">
          <div className="inline-flex items-center gap-4 px-6 py-2.5 glass-morphism rounded-full text-[11px] font-black text-signal uppercase tracking-[0.3em] beveled-edge">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-signal"></span>
            </span>
            Awwwards_Submission // 2026
          </div>

          <h1 ref={headlineRef} className="text-text font-display text-[clamp(4rem,10vw,8.5rem)] leading-[0.8] tracking-tighter text-white">
            Meet ends.<br/><span className="text-white/10 italic">Contract done.</span>
          </h1>
          
          <p className="hero-sub max-w-xl text-text-muted font-sans text-xl md:text-2xl leading-relaxed tracking-tight opacity-70">
            The world's first autonomous legal character ecosystem. Playful 3D intelligence that listens, reasons, and executes binding deals instantly.
          </p>

          <div className="hero-sub flex gap-10">
            <SafeAuth mode="signedOut">
              <Clerk.SignInButton mode="modal">
                <button className="group relative px-20 py-10 bg-signal text-void font-sans font-black text-sm uppercase tracking-[0.5em] rounded-[40px] shadow-[0_30px_60px_rgba(0,194,204,0.3)] hover:brightness-110 hover:translate-y-[-8px] transition-all duration-700 overflow-hidden">
                  <span className="relative z-10">Initialize_Genesis</span>
                  <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-white/20 skew-x-12 opacity-0 group-hover:opacity-100" />
                </button>
              </Clerk.SignInButton>
            </SafeAuth>
            <SafeAuth mode="signedIn">
               <button onClick={() => router.push('/dashboard')} className="px-20 py-10 bg-signal text-void font-sans font-black text-sm uppercase tracking-[0.5em] rounded-[40px] shadow-[0_30px_60px_rgba(0,194,204,0.3)] hover:brightness-110 hover:translate-y-[-8px] transition-all duration-700">Open_Vault</button>
            </SafeAuth>
          </div>
        </div>

        {/* The Master Strategist Character - High-Fidelity 3D Character */}
        <div className="character-vault hidden lg:block relative h-[800px] w-full group perspective-1000">
           <motion.div 
            animate={{ rotateY: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 glass-morphism rounded-[120px] beveled-edge opacity-30 group-hover:opacity-50 transition-opacity border-white/5" 
           />
           
           <Suspense fallback={null}>
              <CharacterScene 
                scene="https://prod.spline.design/at27hY4iI73C5L8M/scene.splinecode" 
                className="h-full w-full scale-150 translate-y-[-5%] hover:scale-[1.55] transition-transform duration-1000" 
              />
           </Suspense>

           {/* Wisdom Bubble */}
           <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute top-1/4 left-[-15%] bg-surface/90 backdrop-blur-3xl border border-white/10 p-12 rounded-[50px] shadow-2xl animate-float max-w-sm"
           >
              <div className="flex gap-4 mb-4">
                 {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-signal/40 rounded-full" />)}
              </div>
              <span className="font-system text-[11px] text-signal font-black uppercase mb-4 block tracking-[0.5em]">The_Strategist // Active</span>
              <p className="text-white/80 text-xl font-display leading-tight italic tracking-tight">"Your verbal commitments are being synthesized into iron-clad architecture."</p>
           </motion.div>
        </div>
      </main>

      {/* Decorative Metadata */}
      <div className="fixed bottom-12 left-12 font-system text-[9px] text-text/10 tracking-[0.8em] uppercase flex flex-col gap-3 font-black">
        <span>ESTABLISHING_TRUST</span>
        <span>ENSURING_CONFIDENTIALITY</span>
      </div>
      
      <div className="fixed bottom-12 right-12 font-system text-[10px] text-text/20 tracking-[0.4em] uppercase font-black flex items-center gap-6">
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
           <div className="w-1.5 h-1.5 bg-signal/20 rounded-full" />
           <div className="w-1.5 h-1.5 bg-signal/10 rounded-full" />
        </div>
        Awwwards_Site_Of_The_Day_Protocol
      </div>
    </div>
  );
}
