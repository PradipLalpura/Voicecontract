"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";

interface ContractPreviewProps {
  contract: string;
}

export function ContractPreview({ contract }: ContractPreviewProps) {
  const [copied, setCopied] = useState(false);
  const wordCount = contract.split(/\s+/).filter(Boolean).length;

  const onCopy = () => {
    navigator.clipboard.writeText(contract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic markdown to HTML for headings
  const formattedContract = contract
    .split("\n")
    .map((line, i) => {
      // If line is ALL CAPS and short, treat it as a heading
      if (line.match(/^[A-Z\s]+$/) && line.trim().length > 0 && line.length < 50) {
        return <h3 key={i} className="font-bold text-lg mt-6 mb-2 text-foreground">{line}</h3>;
      }
      return <p key={i} className="mb-3">{line}</p>;
    });

  return (
    <div className="w-full h-full flex flex-col border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
        <div>
          <h2 className="font-semibold text-lg text-foreground">Service Agreement</h2>
          <p className="text-sm text-muted-foreground">{wordCount} words</p>
        </div>
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied" : "Copy Text"}
        </Button>
      </div>
      <ScrollArea className="flex-1 p-6 h-[600px] bg-background font-mono text-sm leading-relaxed text-muted-foreground">
        <div className="max-w-prose mx-auto">
          {formattedContract}
        </div>
      </ScrollArea>
    </div>
  );
}
