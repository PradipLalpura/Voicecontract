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
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Abstract Background Sculpture - Ambient & Playful */}
      <div className="absolute top-0 right-0 w-full h-full opacity-40 scale-110 translate-x-[20%] translate-y-[-10%] pointer-events-auto">
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyWf8Z9eR/scene.splinecode" />
      </div>

      {/* Iridescent Atmosphere */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-signal/10 blur-[140px] rounded-full opacity-40 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-signal/5 blur-[160px] rounded-full opacity-30" />
      
      {/* Luxury Dust Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -60, 0],
            x: [0, 30, 0],
            opacity: [0.05, 0.2, 0.05],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2
          }}
          className="absolute w-1 h-1 bg-signal rounded-full blur-[1px]"
          style={{
            top: `${10 + i * 8}%`,
            left: `${5 + i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}
