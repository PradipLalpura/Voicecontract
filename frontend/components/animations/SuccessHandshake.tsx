"use client";

import { motion } from "framer-motion";

export default function SuccessHandshake() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-[48px] shadow-premium border border-signal/20">
      <div className="relative w-40 h-40 mb-10">
        {/* Outer Pulsing Aura */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-signal/10 rounded-full blur-2xl"
        />
        
        {/* Handshake Icon with Path Animation */}
        <svg viewBox="0 0 24 24" className="w-full h-full text-signal relative z-10 filter drop-shadow-lg" fill="none" stroke="currentColor">
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            strokeWidth={1.2}
            strokeLinecap="round"
            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-.5a3 3 0 00-3 3c0 1.32 1.015 2.54 2.315 2.927L6.75 19.5a2.25 2.25 0 004.5 0v-1.066m.001 0a2.25 2.25 0 014.5 0v1.066a2.25 2.25 0 004.5 0l.435-2.073c.3-1.428-.842-2.745-2.3-2.745-1.127 0-2.24.58-2.635 1.627l-.435 1.144a2.25 2.25 0 01-4.262 0l-.435-1.144c-.395-1.047-1.508-1.627-2.635-1.627-1.458 0-2.6 1.317-2.3 2.745l.435 2.073a2.25 2.25 0 014.5 0"
          />
        </svg>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="text-center px-10"
      >
        <h2 className="text-3xl font-display text-text mb-3 tracking-tight">Protocol Successfully Finalized</h2>
        <p className="text-text-muted text-base max-w-[320px] mx-auto leading-relaxed">
          The legal handshake has been cryptographically secured, timestamped, and dispatched.
        </p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-10 flex justify-center gap-4"
        >
          <button className="px-6 py-2 bg-text text-void rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-signal transition-all">Download Copy</button>
          <button className="px-6 py-2 border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-surface-muted transition-all">Return to Dashboard</button>
        </motion.div>
      </motion.div>
    </div>
  );
}
