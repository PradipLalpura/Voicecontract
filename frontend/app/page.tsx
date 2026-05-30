"use client";

import { useRef, Suspense } from "react";
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
  const splineContainerRef = useRef<HTMLDivElement>(null);
  
  // Safe Auth Fallback (if env missing)
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useGSAP(() => {
    // Stage 1 Entrance Animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".hero-title", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, stagger: 0.1, delay: 0.5 });
    tl.fromTo(".hero-desc", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=1");
    tl.fromTo(".hero-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=0.8");

    // Stage 2 Scroll Storytelling - The 3D Scene handles its own internal transforms,
    // we just manage the container opacity and text fades here.
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: mainRef.current,
        start: "top top",
        end: "+=2500", // 2500px of scrolling to complete the story
        scrub: 1,
        pin: true,
      }
    });

    // Fade out Stage 1 content (The Title)
    scrollTl.to(".stage-1-content", { opacity: 0, y: -50, duration: 1 });
    
    // Fade in Stage 2 content (The "Why Use It" text overlay)
    scrollTl.fromTo(".stage-2-content", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 }, "-=0.5");
    
    // Hold it for a moment
    scrollTl.to(".stage-2-content", { opacity: 1, duration: 2 });

    // Step-by-step feature highlighting
    const featureTl = gsap.timeline({
      scrollTrigger: {
        trigger: howItWorksRef.current,
        start: "top center",
        end: "bottom center",
        scrub: 1,
      }
    });

    featureTl.fromTo(".feature-step", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.5 });

  }, { scope: mainRef });

  const renderCTA = (text: string) => {
    if (!hasClerk) {
      return (
        <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-primary text-white rounded-full font-semibold shadow-apple-lg hover:bg-primary-hover transition-colors">
          {text} (Safe Auth)
        </button>
      );
    }
    return (
      <>
        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="px-8 py-4 bg-text text-white rounded-full font-semibold shadow-apple-lg hover:bg-black transition-colors hover:scale-105 active:scale-95 duration-300">
              {text}
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-text text-white rounded-full font-semibold shadow-apple-lg hover:bg-black transition-colors hover:scale-105 active:scale-95 duration-300">
            Open Dashboard
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
    <div className="bg-background min-h-screen text-text premium-noise font-sans selection:bg-primary/20 selection:text-primary">
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center glass-morphism-light">
        <div className="text-xl font-bold tracking-tight text-text">VoiceContract</div>
        <nav className="flex gap-8 items-center text-sm font-medium text-text-muted">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-text transition-colors">How it Works</button>
          <button onClick={() => scrollTo('features')} className="hover:text-text transition-colors">Features</button>
          {renderCTA("Sign In")}
        </nav>
      </header>

      {/* Main Storytelling Container (Pinned during scroll) */}
      <main ref={mainRef} className="relative h-screen w-full overflow-hidden">
        
        {/* 3D R3F Native Layer - Hyper Realistic */}
        <div ref={splineContainerRef} className="absolute inset-0 z-0 pointer-events-auto flex items-center justify-center">
             <Background3D />
        </div>

        {/* Stage 1 Content (Centered Hook) */}
        <div className="stage-1-content absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <h1 className="hero-title text-[clamp(4rem,10vw,7rem)] font-extrabold tracking-tighter leading-[0.9] max-w-5xl text-text drop-shadow-sm mb-6">
            The meeting ends.<br/>
            <span className="text-primary">The contract is done.</span>
          </h1>
          <p className="hero-desc text-xl md:text-2xl text-text-muted max-w-3xl font-medium leading-relaxed mt-6">
            Freelancers and agencies bleed money in the gap between a verbal agreement and a signed contract. VoiceContract closes that gap forever.
          </p>
          <div className="hero-cta mt-12 pointer-events-auto">
            {renderCTA("Start Building Trust")}
          </div>
        </div>

        {/* Stage 2 Content (Bottom Aligned, appears on scroll as 3D scene converges) */}
        <div className="stage-2-content absolute inset-0 z-20 flex flex-col justify-end pb-24 px-12 pointer-events-none opacity-0">
          <div className="glass-morphism-light p-10 rounded-3xl max-w-2xl shadow-apple-lg border border-white/60 mx-auto md:mx-0 md:ml-24">
            <h2 className="text-3xl font-bold text-text mb-4 tracking-tight">The Missing Link.</h2>
            <p className="text-text-muted text-lg leading-relaxed">
              We built VoiceContract because "We discussed it" is not legally binding. VoiceContract is an AI agent that listens to your client meetings and mints structured, ready-to-sign legal agreements the moment you hang up.
            </p>
          </div>
        </div>

      </main>

      {/* How It Works Section */}
      <section id="how-it-works" ref={howItWorksRef} className="min-h-screen bg-surface flex flex-col items-center justify-center py-32 px-8 relative z-10 border-t border-border">
        <div className="max-w-5xl w-full">
          <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-4 text-center">The Pipeline</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-20 text-center text-text">How VoiceContract Works</h3>
          
          <div className="space-y-12">
            
            {/* Step 1 */}
            <div className="feature-step flex flex-col md:flex-row gap-8 items-center bg-background border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                 <span className="text-3xl font-black">1</span>
               </div>
               <div>
                 <h4 className="text-2xl font-bold mb-2">The Listener (Ingestion)</h4>
                 <p className="text-text-muted text-lg">Invite our AI agent to your live call or upload a recording. VoiceContract captures the raw conversation, preserving every nuance, scope detail, and price point.</p>
               </div>
            </div>

            {/* Step 2 */}
            <div className="feature-step flex flex-col md:flex-row gap-8 items-center bg-background border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                 <span className="text-3xl font-black">2</span>
               </div>
               <div>
                 <h4 className="text-2xl font-bold mb-2">The Cross-Checker (Live Audit)</h4>
                 <p className="text-text-muted text-lg">A secondary AI auditor listens live. If you forget to discuss a critical term—like a payment schedule, copyright transfer, or revision policy—it flashes a warning *before* the call ends.</p>
               </div>
            </div>

            {/* Step 3 */}
            <div className="feature-step flex flex-col md:flex-row gap-8 items-center bg-background border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                 <span className="text-3xl font-black">3</span>
               </div>
               <div>
                 <h4 className="text-2xl font-bold mb-2">Instant Paperwork</h4>
                 <p className="text-text-muted text-lg">Under 60 seconds after hanging up, a pre-filled, formatted Master Service Agreement (MSA), GST Invoice, and Purchase Order are minted using your company's custom templates.</p>
               </div>
            </div>

            {/* Step 4 */}
            <div className="feature-step flex flex-col md:flex-row gap-8 items-center bg-background border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                 <span className="text-3xl font-black">4</span>
               </div>
               <div>
                 <h4 className="text-2xl font-bold mb-2">Ephemeral Dual E-Sign</h4>
                 <p className="text-text-muted text-lg">Documents are dispatched instantly via Email and WhatsApp. Both parties sign directly in the platform. Biometric signature vectors are used to lock the PDF and are immediately destroyed—never stored.</p>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Further Content Sections (Below the fold) */}
      <section id="features" className="bg-background flex flex-col items-center justify-center py-32 px-8 relative z-10 border-t border-border">
        <h2 className="text-4xl font-bold tracking-tight mb-16">Enterprise Grade. Effortless UX.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <div className="p-8 rounded-2xl bg-surface border border-border shadow-apple-lg hover:shadow-xl transition-shadow group flex flex-col items-center text-center">
             <div className="w-32 h-32 mb-6 rounded-2xl overflow-hidden bg-background shadow-apple-inner relative">
                <Mini3D mode="mic" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors">Acoustic Perception</h3>
             <p className="text-text-muted">Capture nuances in real-time. Our agents don't just transcribe; they understand intent and detect missing terms.</p>
          </div>
          <div className="p-8 rounded-2xl bg-surface border border-border shadow-apple-lg hover:shadow-xl transition-shadow group flex flex-col items-center text-center">
             <div className="w-32 h-32 mb-6 rounded-2xl overflow-hidden bg-background shadow-apple-inner relative">
                <Mini3D mode="lock" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors">Zero-Trust Security</h3>
             <p className="text-text-muted">End-to-End Encryption ensures your deals remain entirely confidential. Data is encrypted before touching the database.</p>
          </div>
          <div className="p-8 rounded-2xl bg-surface border border-border shadow-apple-lg hover:shadow-xl transition-shadow group flex flex-col items-center text-center">
             <div className="w-32 h-32 mb-6 rounded-2xl overflow-hidden bg-background shadow-apple-inner relative">
                <Mini3D mode="seal" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors">Unforgeable E-Sign</h3>
             <p className="text-text-muted">Biometric vector capture and cryptographic PDF locking with zero-storage architecture.</p>
          </div>
        </div>
      </section>
      
      <footer className="bg-surface py-12 border-t border-border text-center text-sm font-semibold text-text-muted">
         VoiceContract // Built with LangGraph & React Three Fiber // Antarik Systems
      </footer>
    </div>
  );
}
