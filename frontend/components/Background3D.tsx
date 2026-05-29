"use client";

import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

export default function Background3D() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Cinematic Spline Node - Interactive Abstract Data/Legal Sculpture */}
      <div className="absolute top-0 right-0 w-full h-full opacity-60 scale-75 md:scale-100 translate-x-[15%] md:translate-x-[20%] translate-y-[-10%] md:translate-y-[-5%] pointer-events-auto">
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyWf8Z9eR/scene.splinecode" />
      </div>

      {/* Atmospheric Blur Overlays */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-signal/10 blur-[120px] rounded-full opacity-30" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-signal/5 blur-[150px] rounded-full opacity-20" />
      
      {/* Floating Particles for Playfulness */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5
          }}
          className="absolute border border-signal/20 rounded-sm"
          style={{
            width: `${10 + i * 4}px`,
            height: `${10 + i * 4}px`,
            top: `${15 + i * 10}%`,
            left: `${10 + i * 12}%`,
          }}
        />
      ))}
    </div>
  );
}
