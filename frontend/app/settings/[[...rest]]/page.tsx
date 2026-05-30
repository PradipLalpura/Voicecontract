"use client";

import { UserProfile, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [identity, setIdentity] = useState({
    company_name: "",
    gst_number: "",
    address: "",
    brand_dna_url: "antarik_master_template.pdf"
  });

  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST 
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}` 
    : "http://localhost:8000";

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/api/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIdentity({
            company_name: data.company_name || "",
            gst_number: data.gst_number || "",
            address: data.address || "",
            brand_dna_url: data.brand_dna_url || "antarik_master_template.pdf"
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [getToken, apiUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${apiUrl}/api/users/onboard`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company_name: identity.company_name,
          gst_number: identity.gst_number,
          address: identity.address,
          brand_dna_url: identity.brand_dna_url,
          onboarding_complete: true
        })
      });
      alert("Identity Updated Successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update identity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
           <div className="space-y-1">
             <h1 className="text-3xl font-black uppercase italic tracking-tighter text-text">Vault_Settings</h1>
             <p className="text-text-muted font-medium text-sm">Manage your Identity and Security credentials.</p>
           </div>
           <Link href="/dashboard" className="px-6 py-2 bg-white border border-border rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
             Back_to_Hub
           </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
           
           {/* Custom Profile Section */}
           <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm space-y-8">
              <div className="space-y-2">
                 <h2 className="text-xl font-black uppercase tracking-tight">Company Identity</h2>
                 <p className="text-xs text-text-muted">These details are applied to your generated contracts.</p>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-5">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Legal Entity Name</label>
                      <input 
                        type="text" 
                        value={identity.company_name}
                        onChange={e => setIdentity({...identity, company_name: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">GST Identification Number</label>
                      <input 
                        type="text" 
                        value={identity.gst_number}
                        onChange={e => setIdentity({...identity, gst_number: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Registered Address</label>
                      <textarea 
                        value={identity.address}
                        onChange={e => setIdentity({...identity, address: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none" 
                      />
                   </div>
                   
                   <div className="pt-4 border-t border-border">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Brand DNA Template</label>
                      <div className="flex items-center gap-4 p-4 border border-dashed border-border rounded-xl bg-slate-50/50">
                         <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         </div>
                         <div className="flex-1">
                            <p className="text-xs font-bold text-text truncate max-w-[200px]">{identity.brand_dna_url}</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest">Active Template</p>
                         </div>
                         <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline relative">
                           Replace
                           <input 
                             type="file" 
                             className="absolute inset-0 opacity-0 cursor-pointer"
                             onChange={(e) => {
                               if (e.target.files?.[0]) setIdentity({...identity, brand_dna_url: e.target.files[0].name});
                             }}
                           />
                         </button>
                      </div>
                   </div>

                   <button 
                     onClick={handleSave}
                     disabled={saving}
                     className="w-full py-4 bg-text text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-apple hover:bg-black transition-all disabled:opacity-50"
                   >
                     {saving ? "Saving..." : "Save_Identity"}
                   </button>
                </div>
              )}
           </div>

           {/* Clerk Security Section */}
           <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center">
             <div className="w-full mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight">Security & Auth</h2>
                <p className="text-xs text-text-muted">Manage your connected accounts and sessions.</p>
             </div>
             {/* Use Hash Routing as instructed by Clerk error */}
             <UserProfile routing="hash" />
           </div>

        </div>
      </div>
    </div>
  );
}