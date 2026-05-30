"use client";

import { motion } from "framer-motion";

interface SuccessHandshakeProps {
  onDownload: () => void;
  onReturn: () => void;
  trackingId?: string;
}

export default function SuccessHandshake({ onDownload, onReturn, trackingId }: SuccessHandshakeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 glass-morphism-light rounded-[60px] border border-border/50 shadow-2xl relative overflow-hidden">
      {/* Pulsing glow */}
      <div className="absolute inset-0 bg-accent/5 animate-pulse" />
      
      <div className="relative w-48 h-48 mb-12">
        {/* Pulsing Aura */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.3, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-accent/10 rounded-full blur-3xl"
        />
        
        {/* Handshake Path Animation */}
        <svg viewBox="0 0 24 24" className="w-full h-full text-accent relative z-10 filter drop-shadow-[0_0_15px_rgba(0,194,204,0.5)]" fill="none" stroke="currentColor">
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            strokeWidth={1.5}
            strokeLinecap="round"
            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-.5a3 3 0 00-3 3c0 1.32 1.015 2.54 2.315 2.927L6.75 19.5a2.25 2.25 0 004.5 0v-1.066m.001 0a2.25 2.25 0 014.5 0v1.066a2.25 2.25 0 004.5 0l.435-2.073c.3-1.428-.842-2.745-2.3-2.745-1.127 0-2.24.58-2.635 1.627l-.435 1.144a2.25 2.25 0 01-4.262 0l-.435-1.144c-.395-1.047-1.508-1.627-2.635-1.627-1.458 0-2.6 1.317-2.3 2.745l.435 2.073a2.25 2.25 0 014.5 0"
          />
        </svg>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="text-center px-12 z-10"
      >
        <h2 className="text-4xl font-black text-text mb-4 tracking-tighter italic">Protocol_Finalized</h2>
        <p className="text-text-muted text-lg max-w-[380px] mx-auto leading-relaxed tracking-tight">
          The legal handshake has been cryptographically secured, timestamped, and dispatched across the Nexus.
        </p>

        {trackingId && (
          <div className="mt-6 px-4 py-2 bg-surface rounded-xl border border-border inline-flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Tracking:</span>
            <span className="text-xs font-mono font-bold text-accent">{trackingId}</span>
          </div>
        )}
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-12 flex justify-center gap-6"
        >
          <button 
            onClick={onDownload}
            className="px-10 py-4 bg-text text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all shadow-apple-lg active:scale-95"
          >
            Download_Package
          </button>
          <button 
            onClick={onReturn}
            className="px-10 py-4 bg-white/80 backdrop-blur-xl border border-border/50 text-text-muted rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-surface transition-all"
          >
            Return_to_Dashboard
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
