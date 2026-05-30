"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";

type DocType = "msa" | "invoice" | "po";
type MeetingStatus = "active" | "processing" | "drafted" | "signed";

interface MeetingSession {
  id: string;
  client_name: string;
  status: MeetingStatus;
  documents: DocType[];
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pre-Flight Modal State
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [ingestionMode, setIngestionMode] = useState<"live" | "upload">("live");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientWhatsapp, setClientWhatsApp] = useState("");
  const [docMsa, setDocMsa] = useState(true);
  const [docInvoice, setDocInvoice] = useState(true);
  const [docPo, setDocPo] = useState(false);
  const [enableCoach, setEnableCoach] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const openPreFlight = (mode: "live" | "upload") => {
    setIngestionMode(mode);
    setClientName("");
    setClientCompany("");
    setClientAddress("");
    setClientEmail("");
    setClientWhatsApp("");
    setDocMsa(true);
    setDocInvoice(true);
    setDocPo(false);
    setEnableCoach(false);
    setIsStarting(false);
    setStartError("");
    setShowPreFlight(true);
  };

  // Hidden audio input ref
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Safe Auth Detection
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST 
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}` 
    : "http://localhost:8000";

  useEffect(() => {
    async function checkOnboardingAndFetchData() {
      if (!isLoaded) return;
      
      const localOnboarding = typeof window !== 'undefined' ? localStorage.getItem('onboardingComplete') : null;
      const metaOnboarding = user?.unsafeMetadata?.onboardingComplete;

      if (hasClerk && user && !metaOnboarding && !localOnboarding) {
        router.push('/onboarding');
        return;
      }

      // Verify onboarding via server-side profile
      try {
        const profileToken = hasClerk ? await getToken() : "dev_token";
        const profileRes = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            "Content-Type": "application/json",
            ...(profileToken ? { Authorization: `Bearer ${profileToken}` } : {})
          }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (!profile.company_name) {
            router.push('/onboarding');
            return;
          }
        }
      } catch (profileErr) {
        console.error("Profile fetch failed:", profileErr);
      }

      // Fetch Real Deals
      try {
        const token = hasClerk ? await getToken() : "dev_token";
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const res = await fetch(`${apiUrl}/api/dashboard/deals`, { headers });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.map((d: any) => ({
            id: d.id,
            client_name: d.client_name,
            status: d.status,
            documents: ["msa", "invoice"], 
            created_at: d.created_at
          })));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    checkOnboardingAndFetchData();
  }, [isLoaded, user, hasClerk, router, getToken, apiUrl]);

  const handleStartMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientCompany) return;
    
    if (ingestionMode === "upload") {
       audioInputRef.current?.click();
       return;
    }

    setIsStarting(true);
    setStartError("");
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
          client_company: clientCompany,
          client_address: clientAddress,
          client_email: clientEmail,
          client_whatsapp: clientWhatsapp,
          documents: { msa: docMsa, invoice: docInvoice, po: docPo },
          use_coach: enableCoach
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.id) {
        throw new Error("No session ID returned from server");
      }

      setShowPreFlight(false);
      router.push(`/cockpit?session=${data.id}`);
    } catch (error: any) {
      console.error("Meeting start failed:", error);
      setStartError(error.message || "Failed to start meeting. Check your connection.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAudioSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsStarting(true);
    setStartError("");
    try {
      const token = hasClerk ? await getToken() : "dev_token";

      // Create a draft deal first
      const draftRes = await fetch(`${apiUrl}/api/dashboard/deals/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          client_name: clientName,
          client_company: clientCompany,
          client_address: clientAddress,
          client_email: clientEmail,
          client_whatsapp: clientWhatsapp,
          documents: { msa: docMsa, invoice: docInvoice, po: docPo },
          use_coach: false
        })
      });

      if (!draftRes.ok) throw new Error("Failed to create session");
      const draftData = await draftRes.json();

      // Upload the audio file
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("session_id", draftData.id);

      const uploadRes = await fetch(`${apiUrl}/api/upload/recording`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Failed to upload recording");

      setShowPreFlight(false);
      router.push(`/processing?session=${draftData.id}`);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setStartError(error.message || "Upload failed");
    } finally {
      setIsStarting(false);
    }
  };

  if (!isLoaded && hasClerk) return null;

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col relative overflow-x-hidden premium-noise">
      
      {/* Pre-Flight Meeting Configuration */}
      <AnimatePresence>
        {showPreFlight && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-text/40 backdrop-blur-md"
              onClick={() => setShowPreFlight(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-surface w-full max-w-2xl rounded-[40px] p-12 shadow-2xl border border-border"
            >
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight uppercase italic">Secure_Session</h2>
                  <p className="text-text-muted font-medium">Configure the legal engine for this encounter.</p>
                </div>
                <button onClick={() => setShowPreFlight(false)} className="p-3 hover:bg-surface-muted rounded-full transition-colors text-text-muted">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <form onSubmit={handleStartMeeting} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Client Full Name *</label>
                    <input 
                      type="text" required value={clientName} onChange={e => setClientName(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Client Company/Entity *</label>
                    <input 
                      type="text" required value={clientCompany} onChange={e => setClientCompany(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                      placeholder="Stark Industries"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Company Address</label>
                    <textarea 
                      value={clientAddress} onChange={e => setClientAddress(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold h-32 resize-none"
                      placeholder="Full legal address..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Client Email</label>
                    <input 
                      type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                      placeholder="client@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Client WhatsApp</label>
                    <input 
                      type="tel" value={clientWhatsapp} onChange={e => setClientWhatsApp(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  
                  <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted">Required Documents to Mint</label>
                    <div className="flex flex-wrap gap-4">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={docMsa} onChange={e => setDocMsa(e.target.checked)} className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" />
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">MSA</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={docInvoice} onChange={e => setDocInvoice(e.target.checked)} className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" />
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">Invoice</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={docPo} onChange={e => setDocPo(e.target.checked)} className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" />
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">PO</span>
                       </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl p-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-primary">Negotiation Coach</span>
                      <span className="text-[10px] font-medium text-blue-400">Live advice during meeting</span>
                    </div>
                    <button type="button" onClick={() => setEnableCoach(!enableCoach)} className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${enableCoach ? 'bg-primary' : 'bg-slate-200'}`}>
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${enableCoach ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 space-y-3">
                   <button type="submit" disabled={isStarting || (!docMsa && !docInvoice && !docPo)} className="w-full py-5 bg-text text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all transform active:scale-95 disabled:opacity-50">
                     {isStarting ? "Initializing_Vault..." : "Start_Legal_Interception"}
                   </button>
                   {startError && (
                     <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-bold flex items-center gap-2">
                       <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {startError}
                     </div>
                   )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden audio file input for Upload mode (BRK-2 fix) */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg"
        className="hidden"
        onChange={handleAudioSelected}
      />

      {/* Designer Header */}
      <header className="sticky top-0 w-full h-24 bg-white/60 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-12 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xl">V</span>
           </div>
           <h2 className="text-xl font-black tracking-tighter text-text hidden sm:block">VOICE<span className="text-primary">CONTRACT</span></h2>
        </div>
        
        <div className="flex items-center gap-8">
           <button onClick={() => router.push('/settings')} className="text-text-muted hover:text-primary transition-colors font-black uppercase tracking-widest text-[10px]">Vault_Settings</button>
           <div className="w-px h-6 bg-border/60" />
           {hasClerk ? <UserButton afterSignOutUrl="/" /> : <div className="w-10 h-10 bg-surface-muted rounded-full border border-border flex items-center justify-center text-xs font-black text-text-muted shadow-inner">CHIEF</div>}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-12 flex flex-col gap-16">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h1 className="text-4xl font-black tracking-tighter text-text mb-2 uppercase italic">
                 Command_Center
              </h1>
              <p className="text-text-muted text-lg font-medium">Select your ingestion method below.</p>
           </div>
        </div>

        {/* The Audio Hub - Primary Actions (NO CRM METRICS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           
           {/* Action 1: Live */}
           <motion.button 
             whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
             onClick={() => openPreFlight("live")}
             className="relative h-80 bg-text rounded-[48px] overflow-hidden group shadow-2xl border-4 border-white"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative z-10 h-full p-12 flex flex-col justify-between items-start text-left">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">Start_Live<br/>Meeting</h3>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Real-time legal interception & drafting</p>
                 </div>
              </div>
           </motion.button>

           {/* Action 2: Upload */}
           <motion.button 
             whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}
             onClick={() => openPreFlight("upload")}
             className="relative h-80 bg-surface rounded-[48px] overflow-hidden group shadow-xl border border-border/50 text-left"
           >
              <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 h-full p-12 flex flex-col justify-between items-start text-left">
                 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-text tracking-tighter uppercase italic leading-none mb-4">Upload_Call<br/>Recording</h3>
                    <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">Process pre-recorded audio via AI Vault</p>
                 </div>
              </div>
           </motion.button>
        </div>

        {/* Meeting Ledger - Historical Memory */}
        <div className="bg-surface rounded-[40px] border border-border/50 shadow-xl overflow-hidden flex flex-col">
          <div className="px-12 py-10 border-b border-border flex justify-between items-end">
            <div className="space-y-1">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Secure_Ledger</span>
               <h3 className="text-3xl font-black tracking-tight uppercase italic">Meeting_Memory</h3>
            </div>
            <div className="flex gap-4">
               <div className="px-4 py-2 bg-background border border-border rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Active: {sessions.filter(s => s.status === 'signed').length}</span>
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-border">
                  <th className="px-12 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Engagement / Entity</th>
                  <th className="px-12 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Generated_Assets</th>
                  <th className="px-12 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Vault_Status</th>
                  <th className="px-12 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</th>
                  <th className="px-12 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                   <tr><td colSpan={5} className="px-12 py-20 text-center font-bold text-text-muted animate-pulse">Accessing Encrypted Memory...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-12 py-20 text-center font-bold text-text-muted">No meetings processed. Initializing your account.</td></tr>
                ) : (
                  sessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-12 py-8">
                        <div className="font-black text-text uppercase tracking-tight text-lg">{session.client_name}</div>
                        <div className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1 opacity-40">HASH: {session.id.slice(0, 12)}</div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="flex gap-2">
                           {session.documents.map(doc => (
                             <span key={doc} className="px-3 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-black uppercase tracking-widest">
                               {doc}
                             </span>
                           ))}
                        </div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="flex items-center gap-3">
                           <div className={`w-2.5 h-2.5 rounded-full ${session.status === 'signed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-primary animate-pulse'}`} />
                           <span className="text-xs font-black uppercase tracking-widest">{session.status}</span>
                        </div>
                      </td>
                      <td className="px-12 py-8 text-xs font-bold text-text-muted uppercase tracking-widest">
                        {session.created_at}
                      </td>
                      <td className="px-12 py-8 text-right">
                        <button onClick={() => router.push(`/review/${session.id}`)} className="px-6 py-2 border-2 border-text text-text rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-text hover:text-white transition-all opacity-0 group-hover:opacity-100">Audit_Assets</button>
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