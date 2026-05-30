"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("@/components/Background3D"), { ssr: false });

const AGENT_LOGS = [
  { agent: "STRATEGIST", msg: "Deconstructing conversational nuances..." },
  { agent: "SENTINEL", msg: "Validating against the Indian Contract Act..." },
  { agent: "DRAFTER", msg: "Synthesizing non-compete and IP transfer clauses..." },
  { agent: "RED_TEAM", msg: "Adversarial Stress Test: Identifying risk vectors..." },
  { agent: "AUDITOR", msg: "Reconciling compliance and fiscal math..." },
  { agent: "MASTER_CODEX", msg: "Crystallizing the final legal instrument." },
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
        setProgress(((currentLog + 1) / AGENT_LOGS.length) * 100);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.push(`/sign/${sessionId || "demo-session"}`);
        }, 1500);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [sessionId, router]);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, { width: `${progress}%`, duration: 1.2, ease: "power4.out" });
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col items-center justify-center p-8 premium-noise relative overflow-hidden">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
         <Suspense fallback={null}><Background3D /></Suspense>
      </div>

      <div className="w-full max-w-4xl space-y-12 z-10 relative">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Cognitive Synthesis Active
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight">Drafting Contract</h1>
          </div>
          <div className="text-left md:text-right">
            <span className="text-3xl font-black text-text">{Math.round(progress)}%</span>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1">Stability: Verified</div>
          </div>
        </div>

        {/* Log Viewer */}
        <div className="h-[400px] bg-surface rounded-3xl p-10 border border-border shadow-apple-lg flex flex-col justify-end relative overflow-hidden">
          
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                className="mb-6 flex flex-col"
              >
                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Agent: {log.agent}</span>
                <span className="text-lg font-medium text-text">{log.msg}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Fade out top logs */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-surface to-transparent pointer-events-none" />
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden shadow-apple-inner">
           <div ref={barRef} className="h-full bg-primary" style={{ width: '0%' }} />
        </div>

      </div>
    </div>
  );
}

export default function ProcessingPipeline() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProcessingContent />
    </Suspense>
  );
}
