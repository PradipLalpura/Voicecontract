"use client";

import { motion } from "framer-motion";

export default function Background3D() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Primary Intelligence Node */}
      <motion.div 
        animate={{ 
          rotateY: [0, 360],
          rotateX: [0, 180, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute top-[20%] right-[10%] w-[600px] h-[600px]"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 border border-signal/20 rounded-full blur-[1px]" />
        <div className="absolute inset-10 border-[0.5px] border-signal/10 rounded-full rotate-45" />
        <div className="absolute inset-20 border-[0.5px] border-signal/5 rounded-full -rotate-45" />
        
        {/* Glowing Core */}
        <div className="absolute inset-[40%] bg-signal/10 rounded-full blur-[100px] animate-pulse" />
      </motion.div>

      {/* Ambient Floaters */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            x: [0, 50, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1
          }}
          className="absolute bg-signal/20 rounded-full blur-xl"
          style={{
            width: `${20 + i * 10}px`,
            height: `${20 + i * 10}px`,
            top: `${20 + i * 15}%`,
            left: `${10 + i * 20}%`,
          }}
        />
      ))}
    </div>
  );
}
