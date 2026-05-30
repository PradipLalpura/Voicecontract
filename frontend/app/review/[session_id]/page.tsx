"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("@/components/Background3D"), { ssr: false });

interface Term {
  id: string;
  label: string;
  value: string;
  confidence: "high" | "low";
  isMissing: boolean;
}

export default function PreDraftReview() {
  const { session_id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState("");

  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}`
    : "http://localhost:8000";

  useEffect(() => {
    async function fetchDealData() {
      try {
        const token = hasClerk ? await getToken() : "dev_token";
        const res = await fetch(`${apiUrl}/api/dashboard/deals/${session_id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch deal data (HTTP ${res.status})`);
        }

        const deal = await res.json();

        if (deal.committed_terms && Array.isArray(deal.committed_terms)) {
          setTerms(
            deal.committed_terms.map((t: any) => ({
              id: t.type,
              label: t.label || t.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
              value: String(t.value),
              confidence: (t.confidence ?? 0.9) >= 0.8 ? "high" : "low",
              isMissing: t.is_missing ?? t.value === "AI Default Applied",
            }))
          );
        }
      } catch (err: any) {
        console.error("Failed to load deal data:", err);
        setError(err.message || "Failed to load deal data.");
        // Fallback to mock data so the page is still usable
        setTerms([
          { id: "scope_of_work", label: "Scope of Work", value: "Loading failed — please edit manually", confidence: "low", isMissing: true },
          { id: "total_price_inr", label: "Total Consideration", value: "₹0", confidence: "low", isMissing: true },
          { id: "payment_schedule", label: "Payment Schedule", value: "50% Advance", confidence: "low", isMissing: true },
          { id: "timeline", label: "Timeline", value: "TBD", confidence: "low", isMissing: true },
          { id: "revisions", label: "Revision Policy", value: "2 Rounds Included", confidence: "low", isMissing: true },
          { id: "ip_ownership", label: "IP Ownership", value: "Transfers on full payment", confidence: "low", isMissing: true },
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (session_id) fetchDealData();
  }, [session_id, apiUrl, hasClerk, getToken]);

  const handleUpdateTerm = (id: string, newValue: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, value: newValue, confidence: "high", isMissing: false } : t));
  };

  const handleMint = async () => {
    setIsMinting(true);
    // Store confirmed terms in localStorage for the sign page to consume
    const confirmedTerms = terms.reduce((acc, t) => {
      acc[t.id] = t.value;
      return acc;
    }, {} as Record<string, string>);
    try {
      localStorage.setItem(`vc_terms_${session_id}`, JSON.stringify(confirmedTerms));
    } catch {}
    // Navigate to the sign page
    setTimeout(() => {
      router.push(`/sign/${session_id}`);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-[10px] uppercase tracking-[0.5em] text-text-muted">Extracting_Logic...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans p-8 md:p-16 flex flex-col items-center premium-noise overflow-y-auto relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
         <Suspense fallback={null}><Background3D /></Suspense>
      </div>

      <div className="w-full max-w-4xl space-y-12 z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-10 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-100">
               Human_Verification_Required
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Pre-Draft_Review</h1>
            <p className="text-text-muted font-medium">Please confirm the AI-extracted terms before the final documents are minted. Aggressive defaults have been applied to missing terms.</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm text-yellow-700 font-medium">Could not load real deal data: {error}. Using editable fallback values.</p>
          </div>
        )}

        {/* Term Confirmation Form */}
        <div className="bg-surface border border-border rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
           <div className="space-y-8">
             <AnimatePresence>
               {terms.map((term) => (
                 <motion.div 
                   key={term.id}
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   className={`p-6 rounded-2xl border transition-all ${term.isMissing ? 'bg-red-50 border-red-200' : (term.confidence === 'low' ? 'bg-yellow-50 border-yellow-200' : 'bg-background border-border')}`}
                 >
                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                       <div className="flex-1">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{term.label}</label>
                          {term.isMissing && <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2 block">Missing from meeting - AI Default Applied</span>}
                          {term.confidence === 'low' && !term.isMissing && <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-2 block">Low Confidence - Please Verify</span>}
                          <input 
                            type="text" 
                            value={term.value} 
                            onChange={(e) => handleUpdateTerm(term.id, e.target.value)}
                            className="w-full bg-white border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                          />
                       </div>
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>

           <div className="mt-12 pt-8 border-t border-border flex justify-end">
              <button 
                onClick={handleMint}
                disabled={isMinting}
                className="px-10 py-5 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isMinting ? "Minting_Contracts..." : "Confirm & Mint Documents"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}