"use client";

import { useEffect, useState, useRef } from "react";
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

export default function ProcessingPage() {
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
    }, 1200);

    return () => clearInterval(interval);
  }, [router, sessionId]);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-void text-white font-sans flex flex-col items-center justify-center p-6 bureau-grid">
      
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Progress Header */}
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <span className="font-system text-[10px] text-signal tracking-[0.4em] uppercase">Processing Core</span>
            <h1 className="text-3xl font-display mt-2 italic">Legal Synthesis In Progress</h1>
          </div>
          <span className="font-system text-xl text-signal">{Math.round(progress)}%</span>
        </div>

        {/* The Theatre of Work Terminal */}
        <div className="h-[400px] bg-surface/30 border border-white/5 beveled-edge p-8 font-system text-xs overflow-hidden flex flex-col justify-end">
           <div className="space-y-3 custom-scrollbar overflow-y-auto">
             <AnimatePresence initial={false}>
               {logs.map((log, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex gap-4 items-start"
                 >
                   <span className={`min-w-[100px] ${
                     log.agent === "RED_TEAM" ? "text-red-400" : 
                     log.agent === "STRATEGIST" ? "text-yellow-500" : "text-signal"
                   }`}>
                     [{log.agent}]
                   </span>
                   <span className="text-white/60">{log.msg}</span>
                 </motion.div>
               ))}
             </AnimatePresence>
             <motion.div 
               animate={{ opacity: [1, 0] }}
               transition={{ repeat: Infinity, duration: 0.8 }}
               className="w-2 h-4 bg-signal/50 inline-block"
             />
           </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-[2px] bg-white/5 relative">
           <div ref={barRef} className="absolute top-0 left-0 h-full bg-signal signal-glow shadow-[0_0_15px_oklch(var(--signal))]" />
        </div>

        {/* Footer Meta */}
        <div className="flex justify-between text-[9px] text-white/20 uppercase tracking-[0.2em]">
           <span>Node: Intelligence_Cluster_Alpha</span>
           <span>Status: Transient_Memory_Encryption_Active</span>
        </div>

      </div>

    </div>
  );
}
