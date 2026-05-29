import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MultimodalIngestor({ onSelect }: { onSelect: (strategy: 'clone' | 'architect') => void }) {
  const [hovered, setHovered] = useState<'clone' | 'architect' | null>(null);

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 perspective-1000">
      {/* 3D-ish Card 1: Clone Engine */}
      <motion.div 
        onHoverStart={() => setHovered('clone')}
        onHoverEnd={() => setHovered(null)}
        whileHover={{ rotateY: -8, rotateX: 5, scale: 1.05, z: 100 }}
        onClick={() => onSelect('clone')}
        className={`relative group p-1 w-full rounded-[64px] transition-all duration-700 cursor-pointer shadow-2xl
          ${hovered === 'clone' ? 'bg-gradient-to-br from-signal/60 via-signal/20 to-transparent' : 'bg-white/5'}
        `}
      >
        <div className="bg-surface/90 backdrop-blur-3xl h-full w-full rounded-[62px] p-20 flex flex-col items-center text-center relative overflow-hidden beveled-edge">
          <div className="mb-12 w-28 h-28 bg-void rounded-[40px] flex items-center justify-center border border-white/10 shadow-premium group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
            <svg className="w-12 h-12 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 011 1v2a1 1 0 00-1 1h-2a1 1 0 00-1-1v-2a1 1 0 01-1-1h-2a1 1 0 01-1 1v2a1 1 0 001 1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2a1 1 0 00-1-1H5a1 1 0 01-1-1V9a1 1 0 011-1z" />
            </svg>
          </div>
          
          <h3 className="text-text font-display text-4xl mb-6 tracking-tighter italic">Clone_Blueprint</h3>
          <p className="text-text/40 font-sans text-lg max-w-[340px] leading-relaxed tracking-tight">
            Transmit a visual capture of a physical contract. Our Sentinels will replicate the exact legal DNA.
          </p>

          <div className="mt-14 flex gap-4">
            {['Vision_OCR', 'DNA_Replication'].map(tag => (
              <span key={tag} className="px-5 py-2.5 bg-void border border-white/5 rounded-full text-[10px] font-black text-text/20 uppercase tracking-[0.4em]">{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 3D-ish Card 2: AI Architect */}
      <motion.div 
        onHoverStart={() => setHovered('architect')}
        onHoverEnd={() => setHovered(null)}
        whileHover={{ rotateY: 8, rotateX: 5, scale: 1.05, z: 100 }}
        onClick={() => onSelect('architect')}
        className={`relative group p-1 w-full rounded-[64px] transition-all duration-700 cursor-pointer shadow-2xl
          ${hovered === 'architect' ? 'bg-gradient-to-br from-signal/60 via-signal/20 to-transparent' : 'bg-white/5'}
        `}
      >
        <div className="bg-surface/90 backdrop-blur-3xl h-full w-full rounded-[62px] p-20 flex flex-col items-center text-center relative overflow-hidden beveled-edge">
          <div className="mb-12 w-28 h-28 bg-void rounded-[40px] flex items-center justify-center border border-white/10 shadow-premium group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
            <svg className="w-12 h-12 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          
          <h3 className="text-text font-display text-4xl mb-6 tracking-tighter italic">AI_Architect</h3>
          <p className="text-text/40 font-sans text-lg max-w-[340px] leading-relaxed tracking-tight">
            Answer 3 strategic probes. Our Architect will synthesize a premium legal framework from absolute zero.
          </p>

          <div className="mt-14 flex gap-4">
            {['Logic_Genesis', 'Zero_Friction'].map(tag => (
              <span key={tag} className="px-5 py-2.5 bg-void border border-white/5 rounded-full text-[10px] font-black text-text/20 uppercase tracking-[0.4em]">{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
