import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MultimodalIngestor({ onSelect }: { onSelect: (strategy: 'clone' | 'architect') => void }) {
  const [hovered, setHovered] = useState<'clone' | 'architect' | null>(null);

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 perspective-1000">
      {/* 3D-ish Card 1: Clone Engine */}
      <motion.div 
        onHoverStart={() => setHovered('clone')}
        onHoverEnd={() => setHovered(null)}
        whileHover={{ 
          rotateY: -5, 
          rotateX: 5, 
          scale: 1.02,
          z: 50
        }}
        onClick={() => onSelect('clone')}
        className={`relative group p-1 w-full rounded-[60px] transition-all duration-500 cursor-pointer shadow-2xl
          ${hovered === 'clone' ? 'bg-gradient-to-br from-signal/40 to-transparent' : 'bg-border/20'}
        `}
      >
        <div className="bg-surface h-full w-full rounded-[58px] p-16 flex flex-col items-center text-center relative overflow-hidden">
          {/* Animated Background Icon */}
          <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
             <svg className="w-64 h-64 text-signal" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
          </div>

          <div className="mb-10 w-24 h-24 bg-void rounded-[32px] flex items-center justify-center border border-border shadow-beveled group-hover:scale-110 transition-transform duration-500">
            <svg className="w-10 h-10 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 011 1v2a1 1 0 00-1 1h-2a1 1 0 00-1-1v-2a1 1 0 01-1-1h-2a1 1 0 01-1 1v2a1 1 0 001 1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2a1 1 0 00-1-1H5a1 1 0 01-1-1V9a1 1 0 011-1z" />
            </svg>
          </div>
          
          <h3 className="text-text font-display text-3xl mb-4 tracking-tighter">Clone Blueprint</h3>
          <p className="text-text-muted font-sans text-base max-w-[320px] leading-relaxed">
            Upload a physical photo, PDF, or Docx. Our Multimodal Sentinels will replicate the exact legal DNA.
          </p>

          <div className="mt-12 flex gap-3">
            {['Vision_OCR', 'Logic_Extraction'].map(tag => (
              <span key={tag} className="px-4 py-2 bg-void border border-border rounded-full text-[10px] font-black text-text/30 uppercase tracking-widest">{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 3D-ish Card 2: AI Architect */}
      <motion.div 
        onHoverStart={() => setHovered('architect')}
        onHoverEnd={() => setHovered(null)}
        whileHover={{ 
          rotateY: 5, 
          rotateX: 5, 
          scale: 1.02,
          z: 50
        }}
        onClick={() => onSelect('architect')}
        className={`relative group p-1 w-full rounded-[60px] transition-all duration-500 cursor-pointer shadow-2xl
          ${hovered === 'architect' ? 'bg-gradient-to-br from-signal/40 to-transparent' : 'bg-border/20'}
        `}
      >
        <div className="bg-surface h-full w-full rounded-[58px] p-16 flex flex-col items-center text-center relative overflow-hidden">
          {/* Animated Background Icon */}
          <div className="absolute top-[-20%] left-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
             <svg className="w-64 h-64 text-signal" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>

          <div className="mb-10 w-24 h-24 bg-void rounded-[32px] flex items-center justify-center border border-border shadow-beveled group-hover:scale-110 transition-transform duration-500">
            <svg className="w-10 h-10 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          
          <h3 className="text-text font-display text-3xl mb-4 tracking-tighter">AI Architect</h3>
          <p className="text-text-muted font-sans text-base max-w-[320px] leading-relaxed">
            No assets? No problem. Answer 3 strategic questions and build your premium legal framework from scratch.
          </p>

          <div className="mt-12 flex gap-3">
            {['Dynamic_Reasoning', 'Zero_Friction'].map(tag => (
              <span key={tag} className="px-4 py-2 bg-void border border-border rounded-full text-[10px] font-black text-text/30 uppercase tracking-widest">{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
