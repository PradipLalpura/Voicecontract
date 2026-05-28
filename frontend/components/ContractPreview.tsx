"use client";

import { Check, Copy, Download } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { CompanyDetails } from "@/lib/types";

interface ContractPreviewProps {
  contract: string;
  companyDetails: CompanyDetails;
}

export function ContractPreview({ contract, companyDetails }: ContractPreviewProps) {
  const [copied, setCopied] = useState(false);
  const wordCount = contract.split(/\s+/).filter(Boolean).length;

  const onCopy = () => {
    navigator.clipboard.writeText(contract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedContract = contract
    .split("\n")
    .map((line, i) => {
      if (line.match(/^[0-9.]+\s[A-Z\s]+$/) || (line.match(/^[A-Z\s]+$/) && line.trim().length > 0 && line.length < 50)) {
        return <h3 key={i} className="font-bold text-lg mt-8 mb-4 text-brand-cyan tracking-tight uppercase border-b border-border/50 pb-2">{line}</h3>;
      }
      return <p key={i} className="mb-4 text-brand-starlight/90 leading-relaxed text-justify">{line}</p>;
    });

  return (
    <div className="w-full h-full flex flex-col border border-border rounded-2xl bg-brand-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
      <div className="flex justify-between items-center p-6 border-b border-border bg-brand-layer/50">
        <div>
          <h2 className="font-heading italic text-2xl text-brand-cyan">Generated Agreement</h2>
          <p className="text-[10px] uppercase tracking-widest font-mono text-brand-dusk mt-1">Status: Verified · {wordCount} words</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="bg-brand-void border-border hover:border-brand-cyan text-brand-starlight h-10 px-4" onClick={onCopy}>
            {copied ? <Check className="h-4 w-4 mr-2 text-brand-cyan" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-8 lg:p-12 h-[700px] bg-brand-void/50">
        <div className="max-w-[800px] mx-auto space-y-2">
          
          {/* Virtual Paper Header */}
          <div className="flex justify-between items-start mb-12 border-b-2 border-brand-cyan pb-8">
             <div className="space-y-4">
                {companyDetails.logo && (
                  <img src={companyDetails.logo} alt="Logo" className="h-16 object-contain filter grayscale hover:grayscale-0 transition-all" />
                )}
                <div>
                   <div className="text-xl font-bold uppercase tracking-tight text-brand-cyan">{companyDetails.companyName}</div>
                   <div className="text-[10px] font-mono text-brand-dusk uppercase mt-1 tracking-widest">Service Provider</div>
                </div>
             </div>
             <div className="text-right space-y-1">
                <div className="text-[10px] font-mono text-brand-dusk uppercase tracking-widest">Document Date</div>
                <div className="text-sm font-medium">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="pt-2 text-[10px] font-mono text-brand-dusk uppercase tracking-widest">GST Number</div>
                <div className="text-sm font-medium">{companyDetails.gstNumber}</div>
             </div>
          </div>

          <div className="font-sans text-[15px]">
            {formattedContract}
          </div>

          <div className="mt-24 pt-12 border-t border-border flex justify-between gap-12">
             <div className="flex-1 space-y-8">
                <div className="h-px w-full bg-brand-dusk/30" />
                <div className="text-[10px] font-mono text-brand-dusk uppercase tracking-[0.2em]">{companyDetails.yourName}</div>
             </div>
             <div className="flex-1 space-y-8">
                <div className="h-px w-full bg-brand-dusk/30" />
                <div className="text-[10px] font-mono text-brand-dusk uppercase tracking-[0.2em]">Client Signatory</div>
             </div>
          </div>
          
          <div className="pt-12 text-center text-[10px] font-mono text-brand-dusk/40 uppercase tracking-[0.4em]">
             End of Agreement
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
