"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("@/components/Background3D").then(mod => mod.default), { 
  ssr: false, 
  loading: () => <div className="absolute inset-0 bg-background" /> 
});
const Feature3DGrid = dynamic(() => import("@/components/Background3D").then(mod => mod.Feature3DGrid), { 
  ssr: false, 
  loading: () => <div className="w-full h-[350px] bg-background rounded-3xl animate-pulse" /> 
});

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingPage() {
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  
  // Safe Auth Fallback
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useGSAP(() => {
    // Stage 1 Entrance Animation
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".hero-title", { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 2, delay: 0.2 });
    tl.fromTo(".hero-desc", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, "-=1.5");
    tl.fromTo(".hero-cta", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, "-=1");

    // Stage 2 Scroll Storytelling
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: mainRef.current,
        start: "top top",
        end: "+=3000", 
        scrub: 1,
        pin: true,
      }
    });

    // Fade out Hero and fade in the Story Narrative
    scrollTl.to(".stage-1-content", { opacity: 0, y: -100, duration: 1.5 });
    scrollTl.fromTo(".stage-2-content", { opacity: 0, y: 100 }, { opacity: 1, y: 0, duration: 1.5 }, "-=0.5");
    scrollTl.to(".stage-2-content", { opacity: 1, duration: 3 }); // Hold

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

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const renderCTA = (text: string, className?: string) => {
    const defaultClasses = "px-10 py-5 bg-text text-white rounded-full font-bold shadow-apple-lg hover:bg-black transition-all transform hover:scale-105 active:scale-95 shimmer";
    const classes = className || defaultClasses;

    if (!hasClerk) {
      return (
        <button onClick={() => router.push('/dashboard')} className={classes}>
          {text} (Safe Access)
        </button>
      );
    }
    return (
      <>
        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className={classes}>
              {text}
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button onClick={() => router.push('/dashboard')} className={classes}>
            Open Command Center
          </button>
        </SignedIn>
      </>
    );
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-background min-h-screen text-text premium-noise font-sans selection:bg-accent/20 selection:text-accent overflow-x-hidden">
      
      {/* Designer Header */}
      <header className="fixed top-0 w-full z-[100] px-12 py-8 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-border/40">
        <div className="text-2xl font-black tracking-tighter text-text group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          VOICE<span className="text-accent group-hover:text-black transition-colors">CONTRACT</span>
        </div>
        <nav className="hidden md:flex gap-12 items-center text-xs font-black uppercase tracking-[0.2em] text-text-muted">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-accent transition-colors">The_Process</button>
          <button onClick={() => scrollTo('features')} className="hover:text-accent transition-colors">Intelligence</button>
          <div className="w-px h-4 bg-border" />
          {renderCTA("Enter_Vault", "px-6 py-3 bg-text text-white rounded-full font-bold shadow-apple hover:bg-black transition-all transform hover:scale-105 active:scale-95")}
        </nav>
      </header>

      {/* Hero 3D Storytelling Stage */}
      <main ref={mainRef} className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Native R3F Engine - Hyper Realistic Positioning */}
        <div className="absolute inset-0 z-0">
             <Background3D />
        </div>

        {/* Stage 1: The Hook */}
        <div className="stage-1-content z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none mt-20">
          <h1 className="hero-title text-[clamp(4rem,10vw,8rem)] font-black tracking-tighter leading-[0.9] text-text mb-8">
            Voice. Contract.<br/>
            <span className="text-gradient italic">Done.</span>
          </h1>
          <p className="hero-desc text-lg md:text-xl text-text-muted max-w-3xl font-medium leading-relaxed mb-12 px-4 float-gentle">
            The gap between "we discussed it" and "we have it in writing" is a massive financial liability. 
            VoiceContract sits in your meetings, extracts the scope, and instantly mints boardroom-ready MSAs and Invoices before you hang up.
          </p>
          <div className="hero-cta pointer-events-auto">
            {renderCTA("Start Your First Session")}
          </div>
        </div>

        {/* Stage 2: The Deep Narrative */}
        <div className="stage-2-content absolute inset-0 z-20 flex flex-col justify-end items-center pb-20 pointer-events-none opacity-0">
          <div className="glass-morphism-light p-10 rounded-[40px] max-w-4xl shadow-apple-lg border border-white/80 bg-white/60 backdrop-blur-2xl text-center card-glow">
            <h2 className="text-3xl md:text-4xl font-black text-text mb-4 tracking-tight leading-tight uppercase italic">The Speed of Sound... The Security of Cryptography.</h2>
            <p className="text-text-muted text-lg leading-relaxed font-medium">
              We built VoiceContract because relying on memory is a financial liability. 
              Our agents audit your live conversations for missing clauses, reconcile pricing, and generate the Master Agreement while the call is still active.
            </p>
          </div>
        </div>

      </main>

      {/* How It Works Section */}
      <section id="how-it-works" ref={howItWorksRef} className="min-h-screen bg-surface flex flex-col items-center justify-center py-40 px-8 relative z-10 border-t border-border/50">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          
          <div className="space-y-12 reveal-on-scroll">
             <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-[0.4em] text-accent">The_Pipeline</span>
                <h3 className="text-5xl md:text-6xl font-black tracking-tighter text-text leading-[0.95]">Intelligence that<br/>protects you.</h3>
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
              <div key={idx} className="feature-step group flex gap-8 items-start p-10 rounded-[32px] bg-background border border-border/60 hover:border-accent/40 transition-all hover:shadow-apple-lg cursor-default card-glow">
                 <span className="text-4xl font-black text-accent/20 group-hover:text-accent transition-colors leading-none">{step.id}</span>
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
        <h2 className="text-5xl font-black tracking-tighter mb-12 uppercase italic text-center reveal-on-scroll">Core_Intelligence</h2>
        
        {/* Unified 3D Feature Grid */}
        <div className="w-full max-w-7xl relative reveal-on-scroll">
           <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
              <Feature3DGrid hoveredIndex={hoveredFeature} />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl relative z-10 mt-12 md:mt-48 pt-12 md:pt-48">
             {[
               { title: "Acoustic Logic", desc: "Captures intent and detects logical gaps in pricing and scope conversations in real-time." },
               { title: "Zero-Trust Vault", desc: "End-to-End Encryption ensures that your contracts are never readable by anyone—even us." },
               { title: "Unforgeable Sign", desc: "Biometric vectors generate a mathematical lock on your PDF. Zero storage architecture." }
             ].map((feat, i) => (
               <div 
                  key={i} 
                  className="p-12 rounded-[48px] bg-surface/80 backdrop-blur-xl border border-border/50 shadow-apple-lg hover:shadow-2xl transition-all group flex flex-col items-center text-center hover:-translate-y-2 card-glow cursor-default"
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
               >
                  <h3 className="text-2xl font-black tracking-tight mb-4 text-text uppercase italic group-hover:text-accent transition-colors">{feat.title}</h3>
                  <p className="text-text-muted text-lg font-medium leading-relaxed">{feat.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Act 4 Update (Final CTA) */}
      <section className="bg-surface py-32 px-8 flex flex-col items-center justify-center text-center border-t border-border/50 reveal-on-scroll">
         <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 text-text uppercase italic">
            Stop Leaving Money <span className="text-gradient">On The Table</span>
         </h2>
         <p className="text-xl text-text-muted max-w-2xl font-medium mb-12">
            Join the founders and agencies who have automated their legal infrastructure. Secure your deals before the meeting ends.
         </p>
         {renderCTA("Create Your Free Account")}
      </section>
      
      <footer className="bg-background py-16 border-t border-border/50 text-center flex flex-col items-center gap-8">
         <div className="text-xl font-black tracking-tighter text-text/40">VOICE_CONTRACT // ANTARIK_SYSTEMS</div>
         <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.6em] text-text/30">
            <span>Security_First</span>
            <span>Zero_Knowledge</span>
            <span>Legal_AI</span>
         </div>
      </footer>
    </div>
  );
}
