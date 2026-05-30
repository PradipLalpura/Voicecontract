"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': any;
    }
  }
}

interface CharacterSceneProps {
  scene: string;
  className?: string;
}

/**
 * ULTRA-ROBUST 3D CHARACTER BRIDGE
 * Uses the official Spline-Viewer Web Component to bypass bundler/ESM resolution conflicts.
 * This is the 'Master Mode' solution for 100% build stability.
 */
export function CharacterScene({ scene, className }: CharacterSceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Inject the Spline Viewer script into the head once
    const scriptId = 'spline-viewer-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.0/build/spline-viewer.js';
      document.head.appendChild(script);
    }
    setMounted(true);
  }, []);

  if (!mounted) return <div className={`bg-background animate-pulse rounded-3xl ${className}`} />;

  return (
    <div className={`relative ${className} overflow-hidden rounded-3xl`}>
      <spline-viewer 
        url={scene}
        events-target="global"
        hint="false"
      />
    </div>
  );
}

/**
 * PRIMARY 3D INTELLIGENCE NODE
 * Atmosphere: Confidential / Premium / Playful
 */
export default function Background3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-background">
      {/* Cinematic Sculpture - Using direct Spline Viewer for 0% crash risk */}
      {mounted && (
        <div className="absolute top-0 right-0 w-full h-full opacity-60 scale-125 translate-x-[25%] translate-y-[-15%] pointer-events-auto">
          <spline-viewer 
            url="https://prod.spline.design/6Wq1Q7YGyWf8Z9eR/scene.splinecode"
            hint="false"
          />
        </div>
      )}

      {/* Atmospheric Luxury Overlays */}
      <div className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] bg-primary/5 blur-[200px] rounded-full mix-blend-screen opacity-60" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-surface blur-[150px] rounded-full opacity-40" />
      
      {/* High-Fidelity 2D Depth Layer */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            x: [0, 30, 0],
            opacity: [0.02, 0.08, 0.02],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8
          }}
          className="absolute bg-primary/10 rounded-full blur-3xl"
          style={{
            width: `${10 + i * 10}px`,
            height: `${10 + i * 10}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
      
      {/* The Bureaucracy Grid */}
      <div className="absolute inset-0 premium-noise opacity-[0.4]" />
    </div>
  );
}
