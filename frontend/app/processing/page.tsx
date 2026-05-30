"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import gsap from "gsap";

const PIPELINE_STAGES = [
  { agent: "STRATEGIST", msg: "Deconstructing conversational nuances...", delay: 0 },
  { agent: "SENTINEL", msg: "Validating against the Indian Contract Act...", delay: 2000 },
  { agent: "DRAFTER", msg: "Synthesizing non-compete and IP transfer clauses...", delay: 5000 },
  { agent: "RED_TEAM", msg: "Adversarial Stress Test: Identifying risk vectors...", delay: 8000 },
  { agent: "AUDITOR", msg: "Reconciling compliance and fiscal math...", delay: 12000 },
  { agent: "MASTER_CODEX", msg: "Crystallizing the final legal instrument.", delay: 16000 },
];

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const sessionId = searchParams.get("session");
  const [logs, setLogs] = useState<typeof PIPELINE_STAGES>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const apiCallStarted = useRef(false);

  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}`
    : "http://localhost:8000";

  // Simulate progress stages while the long-running API call executes
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    PIPELINE_STAGES.forEach((stage, i) => {
      const timer = setTimeout(() => {
        setLogs(prev => {
          if (prev.length <= i) return [...prev, stage];
          return prev;
        });
        // Progress goes up to 90% during animation — 100% only on API success
        setProgress(Math.min(90, ((i + 1) / PIPELINE_STAGES.length) * 90));
      }, stage.delay);
      timers.push(timer);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Fire the real backend API call
  useEffect(() => {
    if (!sessionId || apiCallStarted.current) return;
    apiCallStarted.current = true;

    async function executePipeline() {
      try {
        const token = hasClerk ? await getToken() : "dev_token";

        const res = await fetch(`${apiUrl}/api/meeting/${sessionId}/end`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
          // LangGraph pipeline can take 30-60s — use a 120s timeout
          signal: AbortSignal.timeout(120000),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ detail: "Pipeline error" }));
          throw new Error(errBody.detail || `HTTP ${res.status}`);
        }

        // Pipeline complete — jump to 100%
        setProgress(100);
        setComplete(true);

        // Brief pause to show 100%, then navigate
        setTimeout(() => {
          router.push(`/review/${sessionId}`);
        }, 1500);
      } catch (err: any) {
        console.error("Pipeline execution failed:", err);
        if (err.name === "TimeoutError") {
          setError("Pipeline timed out. The server may be under heavy load. Try again.");
        } else {
          setError(err.message || "Pipeline execution failed. Please try again.");
        }
      }
    }

    executePipeline();
  }, [sessionId, apiUrl, hasClerk, getToken, router]);

  // Animate the progress bar
  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, { width: `${progress}%`, duration: 1.2, ease: "power4.out" });
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col items-center justify-center p-8 premium-noise relative overflow-hidden">

      <div className="w-full max-w-4xl space-y-12 z-10 relative">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              <div className={`w-2 h-2 rounded-full ${complete ? 'bg-emerald-500' : 'bg-primary animate-pulse'}`} />
              {complete ? "Synthesis Complete" : "Cognitive Synthesis Active"}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight">Drafting Contract</h1>
          </div>
          <div className="text-left md:text-right">
            <span className="text-3xl font-black text-text">{Math.round(progress)}%</span>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1">
              {complete ? "Pipeline Complete" : "Stability: Verified"}
            </div>
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
           <div ref={barRef} className={`h-full transition-colors duration-500 ${complete ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: '0%' }} />
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-3xl p-8 flex flex-col items-center gap-4"
          >
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-red-700 font-bold text-center">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all"
            >
              Return_to_Dashboard
            </button>
          </motion.div>
        )}

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
