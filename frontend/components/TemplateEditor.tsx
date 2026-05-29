import React, { useState } from 'react';

export default function TemplateEditor({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="w-full max-w-5xl bg-surface/80 border border-white/5 beveled-edge flex flex-col h-[70vh]">
      {/* Editor Toolbar */}
      <div className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-void/50">
        <div className="flex gap-4">
          <span className="font-system text-[10px] text-white/40 uppercase tracking-widest">Editor Mode: Precision</span>
          <div className="flex gap-2">
            <button className="p-1 hover:text-signal transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
            <button className="p-1 hover:text-signal transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
          </div>
        </div>
        
        <button className="px-4 py-1.5 bg-signal/10 border border-signal/30 text-signal font-system text-[10px] uppercase tracking-widest hover:bg-signal hover:text-void transition-all">
          Save Configuration
        </button>
      </div>

      {/* Main Editing Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Raw Text / Markdown Editor */}
        <textarea 
          className="flex-1 bg-transparent p-12 font-sans text-sm text-white/80 leading-relaxed focus:outline-none resize-none border-r border-white/5 custom-scrollbar"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your legal framework..."
        />

        {/* Right: Structure Sidebar */}
        <div className="w-72 bg-void/30 p-6 flex flex-col gap-8">
          <div>
            <span className="font-system text-[9px] text-white/20 uppercase tracking-widest block mb-4">Detected Clauses</span>
            <div className="space-y-2">
              {['Project Scope', 'Payment Terms', 'Intellectual Property'].map(clause => (
                <div key={clause} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-1.5 h-1.5 bg-signal/50 rounded-full" />
                  <span className="text-[11px] text-white/50 group-hover:text-signal transition-colors">{clause}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="font-system text-[9px] text-white/20 uppercase tracking-widest block mb-4">Variables</span>
            <div className="flex flex-wrap gap-2">
              {['{{price}}', '{{deadline}}', '{{client_name}}'].map(v => (
                <span key={v} className="px-2 py-1 bg-white/5 border border-white/10 text-[9px] text-white/40 font-system">{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
