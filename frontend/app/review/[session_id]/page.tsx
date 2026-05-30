"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    // Simulate fetching extracted terms from the AI
    setTimeout(() => {
      setTerms([
        { id: "client_name", label: "Client Entity", value: "Stark Industries", confidence: "high", isMissing: false },
        { id: "total_value", label: "Total Consideration", value: "₹500,000", confidence: "high", isMissing: false },
        { id: "scope", label: "Scope of Work", value: "3D Asset Generation & Frontend React Integration", confidence: "high", isMissing: false },
        { id: "timeline", label: "Timeline", value: "3 Weeks", confidence: "high", isMissing: false },
        { id: "revisions", label: "Revision Policy", value: "2 Rounds Included", confidence: "low", isMissing: false },
        { id: "payment_schedule", label: "Payment Schedule", value: "100% Upfront", confidence: "low", isMissing: true } // AI defaults
      ]);
      setLoading(false);
    }, 1500);
  }, [session_id]);

  const handleUpdateTerm = (id: string, newValue: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, value: newValue, confidence: "high", isMissing: false } : t));
  };

  const handleMint = async () => {
    setIsMinting(true);
    // Simulate sending confirmed terms back to the AI for final generation
    setTimeout(() => {
      router.push(`/sign/${session_id}`);
    }, 2000);
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