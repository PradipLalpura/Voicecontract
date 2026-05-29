import React, { useState } from 'react';

export default function MultimodalIngestor() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Upload Zone */}
      <div 
        className={`relative group border-2 border-dashed transition-all p-16 rounded-[40px] flex flex-col items-center justify-center text-center cursor-pointer shadow-premium
          ${isDragging ? 'border-signal bg-signal/5 scale-[1.02]' : 'border-border hover:border-signal/30 bg-surface'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <div className="mb-8 w-24 h-24 bg-void rounded-[28px] flex items-center justify-center border border-border shadow-beveled group-hover:scale-110 transition-transform">
          <svg className="w-10 h-10 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h3 className="text-text font-display text-2xl mb-3 tracking-tight">Clone Existing Structure</h3>
        <p className="text-text-muted font-sans text-sm max-w-[280px] leading-relaxed">
          Drop a photo of a physical contract, a PDF, or a DOCX. Our Multimodal Engine will replicate the layout and legal tone.
        </p>

        <div className="mt-10 flex gap-4">
          <span className="px-4 py-1.5 bg-void border border-border rounded-full text-[10px] font-bold text-text-muted uppercase tracking-widest shadow-beveled">OCR Vision</span>
          <span className="px-4 py-1.5 bg-void border border-border rounded-full text-[10px] font-bold text-text-muted uppercase tracking-widest shadow-beveled">DNA Parser</span>
        </div>
      </div>

      {/* AI Wizard Option */}
      <div className="bg-surface p-16 rounded-[40px] border border-border shadow-premium flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-signal/5 blur-3xl rounded-full" />
        
        <div>
          <span className="font-sans text-[11px] font-black text-signal tracking-[0.4em] uppercase mb-6 block">Zero Assets?</span>
          <h3 className="text-text font-display text-3xl mb-5 tracking-tight">AI Template Architect</h3>
          <p className="text-text-muted font-sans text-base leading-relaxed">
            Don't have a template? Answer a few strategic questions and our legal reasoning engine will build 
            a premium base framework for you.
          </p>
        </div>

        <button className="w-full mt-12 px-8 py-5 bg-text text-void font-sans font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-signal transition-all shadow-premium group-hover:scale-[1.02] active:scale-[0.98]">
          Initialize Architect
        </button>
      </div>
    </div>
  );
}
