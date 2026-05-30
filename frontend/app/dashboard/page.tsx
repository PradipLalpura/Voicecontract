"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";

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
  const { getToken } = useAuth();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pre-Flight Modal State
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [clientName, setClientName] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  // Safe Auth Detection
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST 
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}` 
    : "http://localhost:8000";

  useEffect(() => {
    async function fetchData() {
      // Check for Onboarding Completion
      const localOnboarding = typeof window !== 'undefined' ? localStorage.getItem('onboardingComplete') : null;
      if (hasClerk && user && !user.unsafeMetadata?.onboardingComplete && !localOnboarding) {
         router.push('/onboarding');
         return;
      }

      try {
        const token = hasClerk ? await getToken() : "dev_token";
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const [statsRes, dealsRes] = await Promise.all([
          fetch(`${apiUrl}/api/dashboard/stats`, { headers }),
          fetch(`${apiUrl}/api/dashboard/deals`, { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (dealsRes.ok) setDeals(await dealsRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, hasClerk, getToken, apiUrl]);

  const handleStartMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !estimatedValue) return;
    
    setIsStarting(true);
    try {
      const token = hasClerk ? await getToken() : "dev_token";
      const res = await fetch(`${apiUrl}/api/dashboard/deals/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          client_name: clientName,
          estimated_value_inr: parseFloat(estimatedValue)
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Route to cockpit with the secure session ID
        router.push(`/cockpit?session=${data.id}`);
      } else {
        throw new Error("Failed to create draft deal");
      }
    } catch (error) {
      console.error(error);
      setIsStarting(false);
    }
  };

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
    <div className="min-h-screen bg-background text-text font-sans flex flex-col relative">
      
      {/* Pre-Flight Modal */}
      <AnimatePresence>
        {showPreFlight && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-text/20 backdrop-blur-sm"
              onClick={() => setShowPreFlight(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface w-full max-w-md rounded-3xl p-8 shadow-apple-lg border border-border"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">New Meeting</h2>
              <p className="text-text-muted text-sm mb-8">Enter the client details to initialize the VoiceContract secure enclave.</p>
              
              <form onSubmit={handleStartMeeting} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Client Entity Name</label>
                  <input 
                    type="text" required value={clientName} onChange={e => setClientName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g. Stark Industries"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Estimated Value (INR)</label>
                  <input 
                    type="number" required min="0" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g. 500000"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setShowPreFlight(false)} className="flex-1 py-3 px-4 rounded-xl font-semibold text-text-muted hover:bg-background transition-colors">Cancel</button>
                  <button type="submit" disabled={isStarting} className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-semibold shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50">
                    {isStarting ? "Initializing..." : "Start Engine"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
             onClick={() => router.push('/settings')}
             className="text-text-muted hover:text-text transition-colors font-medium text-sm"
           >
             Settings
           </button>
           <button 
             onClick={() => setShowPreFlight(true)}
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
             onClick={() => setShowPreFlight(true)}
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
              { label: "Total Value Locked", val: `₹${(stats?.total_value_locked || 0).toLocaleString()}`, sub: "Secured revenue" },
              { label: "Pending Revenue", val: `₹${(stats?.pending_revenue || 0).toLocaleString()}`, sub: "Deals in progress" },
              { label: "Conversion Rate", val: `${stats?.conversion_rate || 0}%`, sub: "Industry top quartile" },
              { label: "Active Deals", val: stats?.deal_count || 0, sub: "Last 30 days" },
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
                        <div className="text-xs text-text-muted mt-0.5">ID: {deal.id.slice(0, 8)}...</div>
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
