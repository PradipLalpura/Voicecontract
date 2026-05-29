"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// --- Types ---
type DealStatus = "drafted" | "sent" | "viewed" | "signed" | "cancelled";

interface Deal {
  id: string;
  client_name: string;
  total_value_inr: number;
  status: DealStatus;
  created_at: string;
  top_friction?: string;
}

interface Stats {
  total_value_locked: number;
  pending_revenue: number;
  average_deal_size: number;
  deal_count: number;
  conversion_rate: number;
  top_friction_pillar: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        total_value_locked: 450000,
        pending_revenue: 125000,
        average_deal_size: 75000,
        deal_count: 8,
        conversion_rate: 72.5,
        top_friction_pillar: "Revision Policy"
      });
      setDeals([
        { id: "1", client_name: "Acme Corp", total_value_inr: 50000, status: "signed", created_at: "2026-05-28" },
        { id: "2", client_name: "Global Tech", total_value_inr: 120000, status: "sent", created_at: "2026-05-29" },
        { id: "3", client_name: "Nexus Labs", total_value_inr: 85000, status: "drafted", created_at: "2026-05-30" },
        { id: "4", client_name: "Stellar Soft", total_value_inr: 45000, status: "viewed", created_at: "2026-05-30" },
      ]);
      setLoading(false);
    }, 1200);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center bureau-grid-light text-text">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-signal border-t-transparent rounded-full animate-spin shadow-premium" />
          <span className="font-sans text-[11px] font-black uppercase tracking-[0.4em] text-signal">Loading Deal Memory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-text font-sans p-10 md:p-16 flex flex-col bureau-grid-light overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-16 border-b border-border pb-10">
        <div>
          <span className="font-sans text-[11px] font-black text-signal tracking-[0.4em] uppercase">Executive Dashboard</span>
          <h1 className="text-5xl font-display mt-2 tracking-tight">Deal Memory</h1>
        </div>
        <div className="flex gap-6">
           <button onClick={() => router.push("/cockpit")} className="px-8 py-4 bg-signal text-void font-sans font-bold text-xs uppercase tracking-widest rounded-2xl shadow-premium hover:shadow-2xl transition-all">New Meeting</button>
           <button onClick={() => router.push("/")} className="px-8 py-4 border border-border text-text-muted font-sans font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-surface transition-all">Logout</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: "Total Value Locked", val: `₹${stats?.total_value_locked.toLocaleString()}`, sub: "+12.5% Month", color: "text-signal" },
          { label: "Conversion Rate", val: `${stats?.conversion_rate}%`, sub: "High Efficiency", color: "text-text" },
          { label: "Deal Velocity", val: "4.2 Days", sub: "Avg. Cycle", color: "text-text" },
          { label: "Friction Hotspot", val: stats?.top_friction_pillar, sub: "Action Required", color: "text-red-500" },
        ].map((s, i) => (
          <div key={i} className="bg-surface p-8 border border-border rounded-3xl shadow-premium group hover:border-signal/30 transition-all">
            <div className="font-sans text-[10px] font-black text-text/30 uppercase mb-3 tracking-widest">{s.label}</div>
            <div className={`text-3xl font-display ${s.color}`}>{s.val}</div>
            <div className="mt-3 text-[11px] text-text/40 font-bold font-system">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-8 overflow-x-auto pb-10 custom-scrollbar">
        {(["drafted", "sent", "viewed", "signed"] as DealStatus[]).map(status => (
          <div key={status} className="flex-1 min-w-[320px] flex flex-col gap-6">
            <div className="flex justify-between items-center px-4 py-2 border-b-2 border-border mb-2">
               <span className="font-sans text-[11px] font-black text-text/40 uppercase tracking-widest">{status}</span>
               <span className="bg-void border border-border px-3 py-1 rounded-full text-[10px] font-black text-text/60">
                 {deals.filter(d => d.status === status).length}
               </span>
            </div>
            
            <AnimatePresence>
              {deals.filter(d => d.status === status).map(deal => (
                <motion.div 
                  key={deal.id}
                  layoutId={deal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface border border-border p-6 rounded-3xl shadow-premium group cursor-pointer hover:border-signal transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-display text-xl text-text group-hover:text-signal transition-colors">{deal.client_name}</h3>
                    <span className="text-[10px] text-text/20 font-black font-system">#{deal.id}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-base font-system font-bold text-text/60">₹{deal.total_value_inr.toLocaleString()}</div>
                    <div className="text-[10px] text-text/30 font-bold uppercase tracking-widest">{deal.created_at}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {deals.filter(d => d.status === status).length === 0 && (
              <div className="border-2 border-dashed border-border/50 rounded-[32px] py-16 flex items-center justify-center bg-void/30">
                <span className="font-sans text-[10px] text-text/10 font-black uppercase tracking-[0.4em] italic">Open Slot</span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
