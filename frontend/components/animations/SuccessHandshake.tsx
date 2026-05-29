"use client";

import { motion } from "framer-motion";

export default function SuccessHandshake() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-32 h-32 mb-8">
        {/* Outer Glowing Ring */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 border border-signal/30 rounded-full blur-md"
        />
        
        {/* Handshake SVG */}
        <svg viewBox="0 0 24 24" className="w-full h-full text-signal relative z-10" fill="none" stroke="currentColor">
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            strokeWidth={1.5}
            strokeLinecap="round"
            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-.5a3 3 0 00-3 3c0 1.32 1.015 2.54 2.315 2.927L6.75 19.5a2.25 2.25 0 004.5 0v-1.066m.001 0a2.25 2.25 0 014.5 0v1.066a2.25 2.25 0 004.5 0l.435-2.073c.3-1.428-.842-2.745-2.3-2.745-1.127 0-2.24.58-2.635 1.627l-.435 1.144a2.25 2.25 0 01-4.262 0l-.435-1.144c-.395-1.047-1.508-1.627-2.635-1.627-1.458 0-2.6 1.317-2.3 2.745l.435 2.073a2.25 2.25 0 014.5 0"
          />
        </svg>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center"
      >
        <h2 className="text-2xl font-display text-white mb-2">Protocol Finalized</h2>
        <p className="text-white/40 text-sm max-w-[280px]">
          The legal handshake has been cryptographically secured and dispatched.
        </p>
      </motion.div>
    </div>
  );
}
