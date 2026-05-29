"use client";

import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

interface CharacterSceneProps {
  scene: string;
  className?: string;
}

export function CharacterScene({ scene, className }: CharacterSceneProps) {
  return (
    <div className={`relative ${className}`}>
      <Spline scene={scene} />
    </div>
  );
}

export default function Background3D() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-void">
      {/* Abstract Background Sculpture - Deep & Premium */}
      <div className="absolute top-0 right-0 w-full h-full opacity-30 scale-125 translate-x-[25%] translate-y-[-15%] pointer-events-auto">
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyWf8Z9eR/scene.splinecode" />
      </div>

      {/* Atmospheric Overlays */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-signal/5 blur-[180px] rounded-full mix-blend-screen opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#1E1E1E] blur-[150px] rounded-full opacity-40" />
      
      {/* Security Pulse Grid */}
      <div className="absolute inset-0 bureau-grid opacity-[0.4]" />
    </div>
  );
}
