"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

type DealStatus = "drafted" | "sent" | "viewed" | "signed" | "cancelled";

interface Deal {
  id: string;
  client_name: string;
  total_value_inr: number;
  status: DealStatus;
  created_at: string;
}

interface Stats {
  total_value_locked: number;
  pending_revenue: number;
  deal_count: number;
  conversion_rate: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Safe Auth Detection
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useEffect(() => {
    // Simulate fetching dashboard data
    setTimeout(() => {
      setStats({
        total_value_locked: 450000,
        pending_revenue: 125000,
        deal_count: 8,
        conversion_rate: 72.5,
      });
      setDeals([
        { id: "1", client_name: "Acme Corp", total_value_inr: 50000, status: "signed", created_at: "May 28, 2026" },
        { id: "2", client_name: "Global Tech", total_value_inr: 120000, status: "sent", created_at: "May 29, 2026" },
        { id: "3", client_name: "Nexus Labs", total_value_inr: 85000, status: "drafted", created_at: "May 30, 2026" },
        { id: "4", client_name: "Stellar Soft", total_value_inr: 45000, status: "viewed", created_at: "May 30, 2026" },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const getStatusColor = (status: DealStatus) => {
    switch(status) {
      case "signed": return "bg-green-100 text-green-700 border-green-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "viewed": return "bg-purple-100 text-purple-700 border-purple-200";
      case "drafted": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!isLoaded && hasClerk) return null;

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 w-full h-20 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">V</span>
           </div>
           <h2 className="text-lg font-bold tracking-tight text-text hidden sm:block">VoiceContract</h2>
        </div>
        
        <div className="flex items-center gap-6">
           <button 
             onClick={() => router.push('/cockpit')}
             className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-text text-white rounded-full font-medium text-sm hover:bg-black transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             New Meeting
           </button>
           <div className="w-px h-6 bg-border" />
           {hasClerk ? <UserButton afterSignOutUrl="/" /> : <div className="w-8 h-8 bg-surface-muted rounded-full border border-border flex items-center justify-center text-xs font-bold text-text-muted">G</div>}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-8 py-12 flex flex-col gap-12">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-text mb-2">
                 Welcome back, {user?.firstName || 'Chief'}.
              </h1>
              <p className="text-text-muted text-lg">Here is the status of your recent legal executions.</p>
           </div>
           <button 
             onClick={() => router.push('/cockpit')}
             className="sm:hidden w-full flex justify-center items-center gap-2 px-6 py-4 bg-primary text-white rounded-xl font-semibold shadow-apple hover:bg-primary-hover transition-all"
           >
             New Meeting
           </button>
        </div>

        {/* High-Level Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface-muted rounded-2xl border border-border" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Total Value Locked", val: `₹${stats?.total_value_locked.toLocaleString()}`, sub: "+12% this month" },
              { label: "Pending Revenue", val: `₹${stats?.pending_revenue.toLocaleString()}`, sub: "3 deals out for signature" },
              { label: "Conversion Rate", val: `${stats?.conversion_rate}%`, sub: "Industry top quartile" },
              { label: "Active Deals", val: stats?.deal_count, sub: "Last 30 days" },
            ].map((s, i) => (
              <div key={i} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
                <div className="text-sm font-medium text-text-muted mb-1">{s.label}</div>
                <div className="text-3xl font-extrabold tracking-tight text-text mb-1">{s.val}</div>
                <div className="text-xs text-text-muted">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Clean Data Table for Deal Memory */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-border bg-background flex justify-between items-center">
            <h3 className="text-xl font-bold tracking-tight">Deal Memory</h3>
            <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">Export CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/30">
                  <th className="px-8 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Client / Entity</th>
                  <th className="px-8 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Value (INR)</th>
                  <th className="px-8 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date Created</th>
                  <th className="px-8 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                   <tr>
                     <td colSpan={5} className="px-8 py-12 text-center text-text-muted text-sm">Loading secure ledger...</td>
                   </tr>
                ) : deals.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="px-8 py-12 text-center text-text-muted text-sm">No deals captured yet. Start a meeting to mint a contract.</td>
                   </tr>
                ) : (
                  deals.map(deal => (
                    <tr key={deal.id} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-semibold text-text">{deal.client_name}</div>
                        <div className="text-xs text-text-muted mt-0.5">ID: {deal.id}</div>
                      </td>
                      <td className="px-8 py-5 font-medium text-text">
                        ₹{deal.total_value_inr.toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(deal.status)}`}>
                          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-text-muted">
                        {deal.created_at}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors opacity-0 group-hover:opacity-100">View Detail</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
