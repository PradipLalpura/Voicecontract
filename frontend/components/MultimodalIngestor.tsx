import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MultimodalIngestor() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Upload Zone */}
      <div 
        className={`relative group border-2 border-dashed transition-all p-12 flex flex-col items-center justify-center text-center cursor-pointer
          ${isDragging ? 'border-signal bg-signal/5' : 'border-white/10 hover:border-white/20 bg-surface/30'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); console.log(e.dataTransfer.files); }}
      >
        <div className="mb-6 w-20 h-20 bg-void rounded-full flex items-center justify-center border border-white/5 group-hover:border-signal/50 transition-colors">
          <svg className="w-8 h-8 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h3 className="text-white font-display text-xl mb-2">Multimodal Clone Engine</h3>
        <p className="text-white/40 font-sans text-sm max-w-[240px] leading-relaxed">
          Drop a physical photo of a contract, a PDF, or a DOCX. We'll extract the exact layout and legal DNA.
        </p>

        <div className="mt-8 flex gap-3">
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 uppercase tracking-tighter">OCR Vision</span>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 uppercase tracking-tighter">Structure Analysis</span>
        </div>
      </div>

      {/* AI Wizard Option */}
      <div className="bg-surface/50 p-12 border border-white/5 beveled-edge flex flex-col justify-between">
        <div>
          <span className="font-system text-[10px] text-signal tracking-[0.3em] uppercase mb-4 block">No Template?</span>
          <h3 className="text-white font-display text-xl mb-4">AI Template Architect</h3>
          <p className="text-white/40 font-sans text-sm leading-relaxed">
            Answer 3 strategic questions about your business style and we will generate a 
            bespoke Master Service Agreement for you.
          </p>
        </div>

        <button className="w-full mt-8 px-6 py-4 border border-signal/30 text-signal font-system text-xs uppercase tracking-widest hover:bg-signal hover:text-void transition-all">
          Initialize AI Architect
        </button>
      </div>
    </div>
  );
}
