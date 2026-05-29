"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import Background3D from "@/components/Background3D";

const AGENT_LOGS = [
  { agent: "STRATEGIST", msg: "Analyzing conversational intent..." },
  { agent: "SENTINEL", msg: "Fact-checking deal terms against Indian Contract Act..." },
  { agent: "DRAFTER", msg: "Assembling Master Service Agreement framework..." },
  { agent: "RED_TEAM", msg: "Searching for legal loopholes... (Adversarial Mode)" },
  { agent: "DRAFTER", msg: "Refining Revision Policy for maximum safety." },
  { agent: "AUDITOR", msg: "Executing tax math: 18% IGST calculated." },
  { agent: "MASTER_CODEX", msg: "Crystallizing final Legal Trinity package." },
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
    }, 1200);
    return () => clearInterval(interval);
  }, [router, sessionId]);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, { width: `${progress}%`, duration: 1, ease: "expo.out" });
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-void text-text font-sans flex flex-col items-center justify-center p-10 bureau-grid-light relative overflow-hidden">
      <Background3D />
      
      <div className="w-full max-w-4xl space-y-12 z-10 relative">
        <div className="flex justify-between items-end border-b border-border pb-8">
          <div>
            <span className="font-sans text-[11px] font-black text-signal tracking-[0.5em] uppercase">Synthesis Engine</span>
            <h1 className="text-5xl font-display mt-2 italic tracking-tighter">Generating Vault</h1>
          </div>
          <div className="text-right">
            <span className="font-system text-3xl text-text font-black">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="h-[450px] bg-surface/80 backdrop-blur-2xl border border-border rounded-[48px] shadow-2xl p-12 font-system text-xs overflow-hidden flex flex-col justify-end relative group">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-signal/5 overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-1/3 h-full bg-signal"
              />
           </div>
           
           <div className="space-y-5 overflow-y-auto custom-scrollbar">
             <AnimatePresence initial={false}>
               {logs.map((log, i) => (
                 <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-6 items-center">
                   <span className={`min-w-[120px] font-black tracking-widest text-[10px] ${
                     log.agent === "RED_TEAM" ? "text-red-500" : 
                     log.agent === "STRATEGIST" ? "text-yellow-600" : "text-signal"
                   }`}>
                     {log.agent} //
                   </span>
                   <span className="text-text/70 font-bold text-sm tracking-tight">{log.msg}</span>
                 </motion.div>
               ))}
             </AnimatePresence>
             <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2.5 h-4 bg-signal/30 inline-block align-middle ml-2" />
           </div>
        </div>

        <div className="w-full h-1 bg-border rounded-full overflow-hidden shadow-inner">
           <div ref={barRef} className="h-full bg-signal shadow-[0_0_25px_oklch(var(--signal))]" />
        </div>

        <div className="flex justify-between text-[10px] font-black text-text/20 uppercase tracking-[0.5em]">
           <span>Processing_Node: Alpha_01</span>
           <span>Status: Secure_Protocol_Active</span>
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void" />}>
      <ProcessingContent />
    </Suspense>
  );
}
