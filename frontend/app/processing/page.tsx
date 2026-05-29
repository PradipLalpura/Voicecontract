"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";

const AGENT_LOGS = [
  { agent: "STRATEGIST", msg: "Scanning transcript for hidden contradictions..." },
  { agent: "STRATEGIST", msg: "Final intent identified: Fixed-Price with Milestones." },
  { agent: "DRAFTER", msg: "Constructing 12-section Master Service Agreement..." },
  { agent: "DRAFTER", msg: "Injecting Antarik Standard IP Protection clauses." },
  { agent: "RED_TEAM", msg: "Adversarial review in progress: Searching for loopholes..." },
  { agent: "RED_TEAM", msg: "Gap found in Revision Policy. Routing back to Drafter." },
  { agent: "DRAFTER", msg: "Rewriting Section 4.2 for maximum provider safety." },
  { agent: "AUDITOR", msg: "Calculating 18% IGST on base project value..." },
  { agent: "AUDITOR", msg: "Purchase Order itemization complete." },
  { agent: "MASTER_CODEX", msg: "Assembling Final Legal Trinity package." },
  { agent: "MASTER_CODEX", msg: "Generating SHA-256 Cryptographic Stamp..." },
];

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [logs, setLogs] = useState<typeof AGENT_LOGS>([]);
  const [progress, setProgress] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < AGENT_LOGS.length) {
        setLogs(prev => [...prev, AGENT_LOGS[currentLog]]);
        currentLog++;
        setProgress((currentLog / AGENT_LOGS.length) * 100);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.push(`/sign/${sessionId}`);
        }, 1500);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [router, sessionId]);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: 0.6,
        ease: "expo.out"
      });
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-void text-text font-sans flex flex-col items-center justify-center p-10 bureau-grid-light">
      <div className="w-full max-w-4xl space-y-12">
        <div className="flex justify-between items-end border-b border-border pb-6">
          <div>
            <span className="font-sans text-[11px] font-black text-signal tracking-[0.4em] uppercase">Processing Core</span>
            <h1 className="text-4xl font-display mt-2 italic tracking-tight">Legal Synthesis Protocol</h1>
          </div>
          <div className="text-right">
            <span className="font-system text-2xl text-text font-bold">{Math.round(progress)}%</span>
            <div className="text-[10px] text-text/30 font-bold uppercase tracking-widest mt-1">Status: Active</div>
          </div>
        </div>

        <div className="h-[450px] bg-surface border border-border rounded-[40px] shadow-premium p-10 font-system text-xs overflow-hidden flex flex-col justify-end relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-signal/10 overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-1/3 h-full bg-signal"
              />
           </div>
           
           <div className="space-y-4 overflow-y-auto custom-scrollbar">
             <AnimatePresence initial={false}>
               {logs.map((log, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: -5 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex gap-6 items-start"
                 >
                   <span className={`min-w-[110px] font-bold tracking-widest ${
                     log.agent === "RED_TEAM" ? "text-red-500" : 
                     log.agent === "STRATEGIST" ? "text-yellow-600" : "text-signal"
                   }`}>
                     [{log.agent}]
                   </span>
                   <span className="text-text/70 font-medium">{log.msg}</span>
                 </motion.div>
               ))}
             </AnimatePresence>
             <motion.div 
               animate={{ opacity: [1, 0] }}
               transition={{ repeat: Infinity, duration: 0.8 }}
               className="w-2.5 h-4 bg-signal/30 inline-block align-middle ml-1"
             />
           </div>
        </div>

        <div className="w-full h-1 bg-void rounded-full overflow-hidden shadow-beveled">
           <div ref={barRef} className="h-full bg-signal shadow-[0_0_20px_oklch(70%_0.18_195)]" />
        </div>

        <div className="flex justify-between text-[10px] font-bold text-text/20 uppercase tracking-[0.3em]">
           <span>Node: Intelligence_Cluster_Alpha</span>
           <span>Security: Transient_Memory_Encryption</span>
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center text-signal font-system text-[10px] uppercase tracking-[0.3em]">
        Initializing Processing Core...
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
