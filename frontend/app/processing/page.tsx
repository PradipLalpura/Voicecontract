"use client";

import { useEffect, useState, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";

const Background3D = lazy(() => import("@/components/Background3D"));
const CharacterScene = lazy(() => import("@/components/Background3D").then(mod => ({ default: mod.CharacterScene })));

const AGENT_LOGS = [
  { agent: "STRATEGIST", msg: "Deconstructing conversational nuances..." },
  { agent: "SENTINEL", msg: "Validating against Section 10 of the Indian Contract Act..." },
  { agent: "DRAFTER", msg: "Synthesizing non-compete and IP transfer clauses..." },
  { agent: "RED_TEAM", msg: "Adversarial Stress Test: Identifying risk vectors..." },
  { agent: "AUDITOR", msg: "Reconciling GST compliance and fiscal math..." },
  { agent: "MASTER_CODEX", msg: "Crystallizing the Legal Trinity package." },
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
        setTimeout(() => router.push(`/sign/${sessionId}`), 2000);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [router, sessionId]);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, { width: `${progress}%`, duration: 1.2, ease: "power4.out" });
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-void text-text font-sans flex flex-col items-center justify-center p-10 bureau-grid relative overflow-hidden">
      <Suspense fallback={null}><Background3D /></Suspense>
      
      <div className="w-full max-w-5xl space-y-16 z-10 relative mt-20">
        
        {/* Character Vault for Processing */}
        <div className="absolute top-[-250px] left-1/2 translate-x-[-50%] w-[600px] h-[400px] pointer-events-none opacity-40">
           <Suspense fallback={null}>
              <CharacterScene scene="https://prod.spline.design/at27hY4iI73C5L8M/scene.splinecode" className="h-full w-full scale-75" />
           </Suspense>
        </div>

        <div className="flex justify-between items-end border-b border-white/5 pb-10">
          <div className="space-y-4">
            <span className="font-system text-[11px] font-black text-signal tracking-[0.6em] uppercase">Core Synthesis Active</span>
            <h1 className="text-6xl font-display italic tracking-tighter leading-none text-white/90">Generating_Nexus</h1>
          </div>
          <div className="text-right">
            <span className="font-system text-4xl text-text font-black tracking-tighter">{Math.round(progress)}%</span>
            <div className="text-[10px] text-text/20 font-black uppercase tracking-[0.5em] mt-2">Stability: Verified</div>
          </div>
        </div>

        <div className="h-[480px] glass-morphism rounded-[60px] p-16 font-system text-xs overflow-hidden flex flex-col justify-end relative shadow-2xl beveled-edge">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-signal/5 overflow-hidden">
              <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="w-1/4 h-full bg-signal shadow-[0_0_20px_oklch(var(--signal))]" />
           </div>
           
           <div className="space-y-6 overflow-y-auto custom-scrollbar pr-10">
             <AnimatePresence initial={false}>
               {logs.map((log, i) => (
                 <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-8 items-center border-l-2 border-white/5 pl-8">
                   <span className={`min-w-[130px] font-black tracking-widest text-[10px] ${
                     log.agent === "RED_TEAM" ? "text-red-500" : 
                     log.agent === "STRATEGIST" ? "text-yellow-600" : "text-signal"
                   }`}>
                     {log.agent} //
                   </span>
                   <span className="text-text/60 font-bold text-base tracking-tight">{log.msg}</span>
                 </motion.div>
               ))}
             </AnimatePresence>
             <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-3 h-5 bg-signal/30 inline-block align-middle ml-2" />
           </div>
        </div>

        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
           <div ref={barRef} className="h-full bg-signal shadow-[0_0_30px_rgba(0,194,204,0.5)]" />
        </div>

        <div className="flex justify-between text-[9px] font-black text-text/10 uppercase tracking-[0.8em]">
           <span>Logic_Node: Ahmedabad_Cluster</span>
           <span>Hash_State: Encrypted_Session</span>
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
