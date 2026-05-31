"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("@/components/Background3D").then(mod => mod.default), { ssr: false });
const Mini3D = dynamic(() => import("@/components/Background3D").then(mod => mod.Mini3D), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingPage() {
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });
  
  // Safe Auth Fallback
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useGSAP(() => {
    // Stage 1 Entrance Animation
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".hero-title", { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 2, delay: 0.2 });
    tl.fromTo(".hero-desc", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, "-=1.5");
    tl.fromTo(".hero-cta", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, "-=1");

    // Stage 2 Scroll Storytelling mapped to a 0-10 timescale (0->0.4 is 0->4)
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: mainRef.current,
        start: "top top",
        end: "+=3000", // Lengthened slightly for smoother scroll
        scrub: 1,
        pin: true,
      }
    });

    // 0 -> 4: Fade out Stage 1
    scrollTl.to(".stage-1-content", { opacity: 0, y: -100, duration: 4 }, 0);
    
    // 4.5 -> 5.5: Stage 2 slides UP from far below (appearing below models) after models align
    scrollTl.fromTo(".stage-2-content", { opacity: 0, y: 150 }, { opacity: 1, y: 0, duration: 1 }, 4.5);
    
    // 7 -> 8: Stage 2 slides BACK DOWN when the models fly away
    scrollTl.to(".stage-2-content", { opacity: 0, y: 150, duration: 1 }, 7);
    
    // Pad to 10 so that time 0-10 exactly maps to progress 0-1 in Background3D
    scrollTl.to({}, { duration: 2 }, 8);

    // Pipeline Steps Animation
    const stepsTl = gsap.timeline({
      scrollTrigger: {
        trigger: howItWorksRef.current,
        start: "top center",
        end: "bottom center",
        scrub: 0.5,
      }
    });
    stepsTl.fromTo(".feature-step", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, stagger: 0.8 });

  }, { scope: mainRef });

  const renderCTA = (text: string) => {
    if (!hasClerk) {
      return (
        <button onClick={() => router.push('/dashboard')} className="px-10 py-5 bg-primary text-white rounded-full font-bold shadow-apple-lg hover:bg-primary-hover transition-all transform hover:scale-105 active:scale-95">
          {text} (Safe Access)
        </button>
      );
    }
    return (
      <>
        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="px-10 py-5 bg-text text-white rounded-full font-bold shadow-apple-lg hover:bg-black transition-all transform hover:scale-105 active:scale-95">
              {text}
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button onClick={() => router.push('/dashboard')} className="px-10 py-5 bg-text text-white rounded-full font-bold shadow-apple-lg hover:bg-black transition-all transform hover:scale-105 active:scale-95">
            Open Command Center
          </button>
        </SignedIn>
      </>
    );
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-background min-h-screen text-text premium-noise font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      
      {/* Designer Header */}
      <motion.header 
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 w-full z-[100] px-12 py-8 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-border/40"
      >
        <div className="text-2xl font-black tracking-tighter text-text group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          VOICE<span className="text-primary group-hover:text-black transition-colors">CONTRACT</span>
        </div>
        <nav className="hidden md:flex gap-12 items-center text-xs font-black uppercase tracking-[0.2em] text-text-muted">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-primary transition-colors">The_Process</button>
          <button onClick={() => scrollTo('features')} className="hover:text-primary transition-colors">Intelligence</button>
          <div className="w-px h-4 bg-border" />
          {renderCTA("Enter_Vault")}
        </nav>
      </motion.header>

      {/* Hero 3D Storytelling Stage */}
      <main ref={mainRef} className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Native R3F Engine - Hyper Realistic Positioning */}
        <div className="absolute inset-0 z-0">
             <Background3D />
        </div>

        {/* Stage 1: The Hook */}
        <div className="stage-1-content z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none mt-20">
          <h1 className="hero-title text-[clamp(4.5rem,12vw,9rem)] font-black tracking-tighter leading-[0.85] text-text mb-12">
            Verbal Deals,<br/>
            <span className="text-primary italic">Sealed in Seconds.</span>
          </h1>
          <p className="hero-desc text-xl md:text-2xl text-text-muted max-w-4xl font-medium leading-relaxed mb-16 px-4">
            Stop losing revenue to unwritten scope. VoiceContract's <span className="text-primary font-black">Autonomous Legal Grid</span> intercepts your meetings and mints structured, binding paperwork the moment you hang up.
          </p>
          <div className="hero-cta pointer-events-auto">
            {renderCTA("Open Dashboard")}
          </div>
        </div>

        {/* Stage 2: The Deep Narrative */}
        <div className="stage-2-content absolute inset-0 z-20 flex flex-col justify-end items-center pb-[8vh] pointer-events-none opacity-0">
          <div className="glass-morphism-light p-6 rounded-[24px] max-w-2xl shadow-apple-lg border border-white/40 bg-white/20 backdrop-blur-md text-center">
            <h2 className="text-xl md:text-2xl font-black text-text mb-2 tracking-tight leading-tight uppercase italic">The Gap is Gone.</h2>
            <p className="text-text-muted text-base leading-relaxed font-medium">
              We built VoiceContract because <span className="text-text font-bold">"We discussed it"</span> is a financial liability. 
              Our agents audit your live conversations and generate the Master Agreement while the call is active.
            </p>
          </div>
        </div>

      </main>

      {/* How It Works Section */}
      <section id="how-it-works" ref={howItWorksRef} className="min-h-screen bg-surface flex flex-col items-center justify-center py-40 px-8 relative z-10 border-t border-border/50">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          
          <div className="space-y-12">
             <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">The_Pipeline</span>
                <h3 className="text-5xl md:text-6xl font-black tracking-tighter text-text leading-[0.95]">Automated<br/>Integrity.</h3>
             </div>
             <p className="text-text-muted text-xl font-medium leading-relaxed">
               VoiceContract isn't a transcription tool. It's a legal logic engine that ensures you never leave a meeting without a confirmed paper trail.
             </p>
             <button onClick={() => router.push('/dashboard')} className="px-8 py-4 border-2 border-text text-text rounded-full font-black text-sm uppercase tracking-widest hover:bg-text hover:text-white transition-all">Get_Started</button>
          </div>

          <div className="space-y-8">
            {[
              { id: "01", title: "Active Interception", desc: "Invite Amigo, our AI Auditor, to your Zoom or physical meeting. It listens for deliverables, timelines, and payment structures." },
              { id: "02", title: "Term Validation", desc: "If a critical term like 'IP Ownership' or 'Revision Limits' isn't mentioned, Amigo flags it live so you can address it immediately." },
              { id: "03", title: "Instant Minting", desc: "Before the call ends, your MSA, Invoice, and PO are generated in your exact company format, ready for review." },
              { id: "04", title: "Dual E-Sign", desc: "Documents are dispatched via Email and WhatsApp. Biometric vectors are captured to lock the PDF and then permanently deleted." }
            ].map((step, idx) => (
              <div key={idx} className="feature-step group flex gap-8 items-start p-10 rounded-[32px] bg-background border border-border/60 hover:border-primary/40 transition-all hover:shadow-apple-lg cursor-default">
                 <span className="text-4xl font-black text-primary/20 group-hover:text-primary transition-colors leading-none">{step.id}</span>
                 <div>
                    <h4 className="text-2xl font-black tracking-tight mb-3 text-text uppercase italic">{step.title}</h4>
                    <p className="text-text-muted text-lg font-medium leading-relaxed">{step.desc}</p>
                 </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* High Fidelity Feature Grid */}
      <section id="features" className="bg-background flex flex-col items-center justify-center py-40 px-8 relative z-10 border-t border-border/50">
        <h2 className="text-5xl font-black tracking-tighter mb-24 uppercase italic text-center">Core_Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl">
          {[
            { mode: "mic", title: "Acoustic Logic", desc: "Captures intent and detects logical gaps in pricing and scope conversations in real-time." },
            { mode: "lock", title: "Zero-Trust Vault", desc: "End-to-End Encryption ensures that your contracts are never readable by anyone—even us." },
            { mode: "seal", title: "Unforgeable Sign", desc: "Biometric vectors generate a mathematical lock on your PDF. Zero storage architecture." }
          ].map((feat, i) => (
            <div key={i} className="p-12 rounded-[48px] bg-surface border border-border/50 shadow-apple-lg hover:shadow-2xl transition-all group flex flex-col items-center text-center hover:-translate-y-2">
               <div className="w-48 h-48 mb-8 rounded-[40px] overflow-hidden bg-background shadow-apple-inner relative ring-1 ring-border/20">
                  <Mini3D mode={feat.mode as any} />
               </div>
               <h3 className="text-2xl font-black tracking-tight mb-4 text-text uppercase italic group-hover:text-primary transition-colors">{feat.title}</h3>
               <p className="text-text-muted text-lg font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      <footer className="bg-surface py-20 border-t border-border/50 text-center flex flex-col items-center gap-8">
         <div className="text-xl font-black tracking-tighter text-text/40">VOICE_CONTRACT // ANTARIK_SYSTEMS</div>
         <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.6em] text-text/20">
            <span>Security_First</span>
            <span>Zero_Knowledge</span>
            <span>Legal_AI</span>
         </div>
      </footer>
    </div>
  );
}
