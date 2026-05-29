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
    // Simulate fetching dashboard data
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
      <div className="min-h-screen bg-void flex items-center justify-center bureau-grid text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-signal border-t-transparent rounded-full animate-spin" />
          <span className="font-system text-[10px] uppercase tracking-[0.3em] text-signal">Loading Deal Memory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white font-sans p-8 md:p-12 flex flex-col bureau-grid overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
        <div>
          <span className="font-system text-[10px] text-signal tracking-[0.4em] uppercase">Control Center</span>
          <h1 className="text-4xl font-display mt-2">Deal Memory Dashboard</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => router.push("/cockpit")} className="px-6 py-2 bg-signal text-void font-system text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">New Meeting</button>
           <button onClick={() => router.push("/")} className="px-6 py-2 border border-white/10 text-white font-system text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Logout</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface/30 p-6 border border-white/5 beveled-edge">
          <div className="font-system text-[9px] text-white/40 uppercase mb-2">Total Value Locked</div>
          <div className="text-3xl font-display text-signal">₹{stats?.total_value_locked.toLocaleString()}</div>
          <div className="mt-2 text-[10px] text-green-500 font-system">+12.5% this month</div>
        </div>
        <div className="bg-surface/30 p-6 border border-white/5 beveled-edge">
          <div className="font-system text-[9px] text-white/40 uppercase mb-2">Conversion Rate</div>
          <div className="text-3xl font-display text-white">{stats?.conversion_rate}%</div>
          <div className="mt-2 text-[10px] text-white/20 font-system">Outperforming Industry</div>
        </div>
        <div className="bg-surface/30 p-6 border border-white/5 beveled-edge">
          <div className="font-system text-[9px] text-white/40 uppercase mb-2">Avg. Deal Velocity</div>
          <div className="text-3xl font-display text-white">4.2 Days</div>
          <div className="mt-2 text-[10px] text-white/20 font-system">Meeting to Signature</div>
        </div>
        <div className="bg-surface/30 p-6 border border-yellow-500/20 bg-yellow-500/5 beveled-edge">
          <div className="font-system text-[9px] text-yellow-500/50 uppercase mb-2 italic">Friction Alert</div>
          <div className="text-xl font-display text-white">{stats?.top_friction_pillar}</div>
          <div className="mt-2 text-[10px] text-yellow-500/40 font-system leading-tight">Identify alternative revision caps to close 2x faster.</div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
        {(["drafted", "sent", "viewed", "signed"] as DealStatus[]).map(status => (
          <div key={status} className="flex-1 min-w-[300px] flex flex-col gap-4">
            <div className="flex justify-between items-center px-2 py-1 border-b border-white/10 mb-2">
               <span className="font-system text-[10px] text-white/30 uppercase tracking-widest">{status}</span>
               <span className="bg-white/5 px-2 py-0.5 rounded-full text-[9px] text-white/40 font-system">
                 {deals.filter(d => d.status === status).length}
               </span>
            </div>
            
            <AnimatePresence>
              {deals.filter(d => d.status === status).map(deal => (
                <motion.div 
                  key={deal.id}
                  layoutId={deal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface/50 border border-white/5 p-5 beveled-edge group cursor-pointer hover:border-signal/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-display text-lg text-white group-hover:text-signal transition-colors">{deal.client_name}</h3>
                    <span className="text-[10px] text-white/20 font-system uppercase">{deal.id}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-sm font-system text-white/50">₹{deal.total_value_inr.toLocaleString()}</div>
                    <div className="text-[9px] text-white/20 uppercase font-system tracking-widest">{deal.created_at}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {deals.filter(d => d.status === status).length === 0 && (
              <div className="border border-dashed border-white/5 rounded-lg py-12 flex items-center justify-center">
                <span className="font-system text-[9px] text-white/10 uppercase tracking-tighter italic">Void Space</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Business Intelligence Footer */}
      <div className="mt-auto pt-12 border-t border-white/5 flex justify-between items-center opacity-40">
        <div className="flex gap-8">
           <div className="flex flex-col">
             <span className="text-[9px] uppercase font-system tracking-widest mb-1">Current Protocol</span>
             <span className="text-xs text-white/80">Antarik-Noir 2.0</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[9px] uppercase font-system tracking-widest mb-1">Global Sentiment</span>
             <span className="text-xs text-white/80">Bullish (Strong Closure)</span>
           </div>
        </div>
        <div className="text-right">
           <span className="text-[9px] uppercase font-system tracking-widest block mb-1">Node Identification</span>
           <span className="text-xs text-white/80 uppercase">Ahmedabad_Cluster_01</span>
        </div>
      </div>

    </div>
  );
}
