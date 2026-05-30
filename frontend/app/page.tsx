"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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
  const splineContainerRef = useRef<HTMLDivElement>(null);
  
  // Safe Auth Fallback (if env missing)
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useGSAP(() => {
    // Stage 1 Entrance Animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".hero-title", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, stagger: 0.1, delay: 0.5 });
    tl.fromTo(".hero-desc", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=1");
    tl.fromTo(".hero-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=0.8");

    // Stage 2 Scroll Storytelling
    // We pin the container and crossfade the content
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: mainRef.current,
        start: "top top",
        end: "+=2000", // 2000px of scrolling to complete the story
        scrub: 1,
        pin: true,
      }
    });

    // Fade out Stage 1 content
    scrollTl.to(".stage-1-content", { opacity: 0, y: -50, duration: 1 });
    
    // Scale down and shift the Spline container (abstract wave -> device context)
    // Note: In a real Spline scene, we might manipulate the camera via Spline API, 
    // but here we use CSS transforms for a robust cross-browser effect.
    scrollTl.to(splineContainerRef.current, { 
      scale: 0.8, 
      y: "10vh",
      duration: 2 
    }, "<");

    // Fade in Stage 2 content
    scrollTl.fromTo(".stage-2-content", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 }, "-=1");

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

  return (
    <div className="bg-background min-h-screen text-text premium-noise font-sans selection:bg-primary/20 selection:text-primary">
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center glass-morphism-light">
        <div className="text-xl font-bold tracking-tight text-text">VoiceContract</div>
        <nav className="flex gap-8 items-center text-sm font-medium text-text-muted">
          <button onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-text transition-colors">Product</button>
          <button onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-text transition-colors">Security</button>
          {renderCTA("Sign In")}
        </nav>
      </header>

      {/* Main Storytelling Container (Pinned during scroll) */}
      <main ref={mainRef} className="relative h-screen w-full overflow-hidden">
        
        {/* 3D R3F Native Layer */}
        <div ref={splineContainerRef} className="absolute inset-0 z-0 pointer-events-auto flex items-center justify-center">
             <Background3D />
        </div>

        {/* Stage 1 Content (Centered) */}
        <div className="stage-1-content absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <h1 className="hero-title text-[clamp(3rem,8vw,5.5rem)] font-extrabold tracking-tighter leading-[1.1] max-w-4xl text-text">
            Agreements, <br/>Spoken into Existence.
          </h1>
          <p className="hero-desc mt-6 text-xl text-text-muted max-w-2xl font-medium">
            The autonomous legal engine that transforms your conversations into boardroom-ready contracts, in real-time.
          </p>
          <div className="hero-cta mt-10 pointer-events-auto">
            {renderCTA("Start Building Trust")}
          </div>
        </div>

        {/* Stage 2 Content (Bottom Aligned, appears on scroll) */}
        <div className="stage-2-content absolute inset-0 z-20 flex flex-col justify-end pb-24 px-12 pointer-events-none opacity-0">
          <div className="glass-morphism-light p-8 rounded-3xl max-w-xl shadow-apple-lg border border-white">
            <h2 className="text-2xl font-bold text-text mb-3">The Magic of VoiceContract</h2>
            <p className="text-text-muted leading-relaxed">
              Whether on a call or in the room. VoiceContract listens to the nuances, extracts the intent, and mints a cryptographically sealed agreement before you hang up.
            </p>
          </div>
        </div>

      </main>

      {/* Further Content Sections (Below the fold) */}
      <section id="product" className="min-h-screen bg-surface flex flex-col items-center justify-center py-32 px-8 relative z-10">
        <h2 className="text-4xl font-bold tracking-tight mb-16">Enterprise Grade. Effortless UX.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          <div className="p-8 rounded-2xl bg-background border border-border shadow-apple-lg hover:shadow-xl transition-shadow group">
             <div className="w-16 h-16 mb-6 rounded-xl overflow-hidden bg-surface shadow-apple-inner relative">
                <Background3D mini mode="mic" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors">Acoustic Perception</h3>
             <p className="text-text-muted">Capture nuances in real-time. Our agents don't just transcribe; they understand intent.</p>
          </div>
          <div className="p-8 rounded-2xl bg-background border border-border shadow-apple-lg hover:shadow-xl transition-shadow group">
             <div className="w-16 h-16 mb-6 rounded-xl overflow-hidden bg-surface shadow-apple-inner relative">
                <Background3D mini mode="lock" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors">Zero-Trust Security</h3>
             <p className="text-text-muted">End-to-End Encryption ensures your deals remain entirely confidential.</p>
          </div>
          <div className="p-8 rounded-2xl bg-background border border-border shadow-apple-lg hover:shadow-xl transition-shadow group">
             <div className="w-16 h-16 mb-6 rounded-xl overflow-hidden bg-surface shadow-apple-inner relative">
                <Background3D mini mode="seal" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-text group-hover:text-primary transition-colors">Unforgeable E-Sign</h3>
             <p className="text-text-muted">Biometric vector capture and cryptographic PDF locking.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
