"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useState, Suspense } from 'react';

// Use dynamic with ssr: false for Spline to prevent buffer/hydration mismatches
const Spline = dynamic(() => import('@splinetool/react-spline'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-void animate-pulse" />
});

interface CharacterSceneProps {
  scene: string;
  className?: string;
}

export function CharacterScene({ scene, className }: CharacterSceneProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-surface-muted rounded-[40px] border border-border ${className}`}>
        <div className="text-center space-y-2 opacity-20">
          <div className="w-12 h-12 mx-auto border-2 border-text rounded-full flex items-center justify-center">
             <span className="font-bold">?</span>
          </div>
          <span className="text-[10px] uppercase font-system">Static_Backup_Mode</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Suspense fallback={<div className="absolute inset-0 bg-void animate-pulse" />}>
        <Spline 
          scene={scene} 
          onError={() => {
            console.warn("Spline Runtime Error Caught. Falling back to static mode.");
            setError(true);
          }}
        />
      </Suspense>
    </div>
  );
}

export default function Background3D() {
  const [error, setError] = useState(false);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-void">
      {/* Abstract Background Sculpture */}
      {!error && (
        <div className="absolute top-0 right-0 w-full h-full opacity-30 scale-125 translate-x-[25%] translate-y-[-15%] pointer-events-auto">
          <Spline 
            scene="https://prod.spline.design/6Wq1Q7YGyWf8Z9eR/scene.splinecode" 
            onError={() => setError(true)}
          />
        </div>
      )}

      {/* Atmospheric Overlays */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-signal/5 blur-[180px] rounded-full mix-blend-screen opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#1E1E1E] blur-[150px] rounded-full opacity-40" />
      
      {/* Dynamic 2D Particles - Safe Fallback */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            opacity: [0.02, 0.1, 0.02],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bg-signal/20 rounded-full blur-2xl"
          style={{
            width: `${10 + i * 10}px`,
            height: `${10 + i * 10}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
      
      <div className="absolute inset-0 bureau-grid opacity-[0.4]" />
    </div>
  );
}
