"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import Background3D, { CharacterScene } from "@/components/Background3D";
import MultimodalIngestor from "@/components/MultimodalIngestor";
import IdentityWizard from "@/components/IdentityWizard";

type ViewState = "hub" | "onboarding" | "blueprint";

export default function DashboardHub() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [view, setView] = useState<ViewState>("hub");
  const [onboarded, setOnboarding] = useState(false);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-void text-white font-sans p-10 md:p-16 flex flex-col bureau-grid overflow-hidden relative selection:bg-signal/30">
      <Suspense fallback={null}><Background3D /></Suspense>

      {/* Security Overlay Decal */}
      <div className="fixed inset-0 border-[1px] border-white/5 pointer-events-none z-50 opacity-20" />

      {/* Dashboard Header */}
      <header className="fixed top-0 left-0 w-full h-24 border-b border-white/5 flex items-center justify-between px-16 bg-surface/60 backdrop-blur-2xl z-[100] shadow-2xl">
        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => setView("hub")}>
           <div className="w-10 h-10 bg-signal/20 border border-signal/40 rounded-xl flex items-center justify-center group-hover:bg-signal transition-all">
              <span className="text-signal group-hover:text-void font-bold text-sm">V</span>
           </div>
           <h2 className="text-xl font-display font-bold italic tracking-tighter">Vault_Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="hidden md:flex gap-8 font-system text-[9px] font-black uppercase tracking-[0.4em] text-text/30">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse"/> Session_Secure</div>
              <div className="flex items-center gap-2">Node: {user?.id?.slice(0,8)}</div>
           </div>
           <div className="w-px h-6 bg-white/10" />
           <UserButton />
        </div>
      </header>

      <main className="flex-1 mt-24 relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          {view === "hub" && (
            <motion.section 
              key="hub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col"
            >
              {/* Welcome Banner */}
              <div className="mb-16">
                 <span className="font-system text-[11px] font-black text-signal tracking-[0.6em] uppercase block mb-4">Identity_Verified</span>
                 <h1 className="text-6xl font-display tracking-tighter leading-none">Welcome back, <span className="text-signal italic">{user?.firstName || 'Chief'}</span></h1>
              </div>

              {/* Action Hub - Playful 3D Strategy Cards */}
              <div className="mb-20">
                <MultimodalIngestor onSelect={(strategy) => {
                  if (strategy === 'architect') setView("onboarding");
                  else setView("blueprint");
                }} />
              </div>

              {/* Kanban Deal Stream */}
              <div className="flex-1 bg-surface/40 backdrop-blur-3xl border border-white/5 rounded-[60px] p-16 shadow-2xl relative overflow-hidden beveled-edge">
                 <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                       <span className="font-system text-[10px] text-text/20 uppercase tracking-[0.5em]">Active_Repository</span>
                       <h3 className="text-3xl font-display italic tracking-tighter">Deal_Memory</h3>
                    </div>
                    <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.4em] hover:bg-white/10 transition-all">Export_Report</button>
                 </div>

                 {/* Kanban Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {["DRAFT", "SENT", "VIEWED", "SIGNED"].map(col => (
                      <div key={col} className="space-y-6">
                         <div className="flex justify-between items-center opacity-30 px-2">
                            <span className="font-system text-[10px] font-black tracking-widest">{col} //</span>
                            <span className="text-[9px]">00</span>
                         </div>
                         <div className="h-64 border-2 border-dashed border-white/5 rounded-[40px] flex items-center justify-center bg-void/20">
                            <span className="font-system text-[8px] text-white/5 uppercase tracking-[0.6em] italic">Open_Node</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.section>
          )}

          {view === "onboarding" && (
            <motion.section 
              key="onboarding"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center relative"
            >
               <div className="absolute top-0 left-0 w-[400px] h-[500px] opacity-40 pointer-events-none">
                  <CharacterScene scene="https://prod.spline.design/E0G8Z0u0u0U0u0U0/scene.splinecode" className="h-full w-full scale-150" />
               </div>
               
               <div className="z-10 w-full max-w-2xl">
                 <IdentityWizard onComplete={() => router.push('/cockpit')} />
               </div>

               <button 
                 onClick={() => setView("hub")}
                 className="mt-12 text-[10px] font-black text-text/30 uppercase tracking-[0.4em] hover:text-signal transition-all"
               >
                 [Abort_Initialization]
               </button>
            </motion.section>
          )}

          {view === "blueprint" && (
            <motion.section 
              key="blueprint"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-12"
            >
               <div className="text-center space-y-4">
                  <span className="font-system text-[11px] text-signal font-black uppercase tracking-[0.8em]">DNA_Replication_Active</span>
                  <h2 className="text-7xl font-display italic tracking-tighter">Clone_Structure</h2>
               </div>
               <div className="w-full max-w-3xl glass-morphism rounded-[60px] p-24 text-center border-white/5 beveled-edge shadow-2xl relative overflow-hidden group">
                  <div className="scan-line" />
                  <div className="mb-12 w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto border border-white/10 group-hover:scale-110 transition-all duration-700">
                     <svg className="w-16 h-16 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </div>
                  <p className="text-white/40 text-xl font-sans mb-12">Drop physical contract or PDF here to initialize replication.</p>
                  <button onClick={() => router.push('/cockpit')} className="px-16 py-7 bg-signal text-void font-sans font-black text-xs uppercase tracking-[0.4em] rounded-3xl shadow-premium hover:scale-105 active:scale-95 transition-all">Confirm_Upload</button>
               </div>
               <button onClick={() => setView("hub")} className="text-[10px] font-black text-text/30 uppercase tracking-[0.4em] hover:text-signal transition-all">Back_to_Dashboard</button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Dashboard Footer Stats */}
      <footer className="fixed bottom-0 left-0 w-full h-16 border-t border-white/5 flex items-center justify-between px-16 bg-surface/80 backdrop-blur-xl z-[100]">
        <div className="flex gap-12 font-system text-[9px] font-black text-text/20 uppercase tracking-[0.4em]">
           <span>TVL: ₹4,50,000.00</span>
           <span>Efficiency: 98.2%</span>
        </div>
        <div className="text-[9px] font-system font-black text-signal/40 uppercase tracking-[0.6em]">
           Node_Location: Ahmedabad_Cluster_Alpha
        </div>
      </footer>
    </div>
  );
}
