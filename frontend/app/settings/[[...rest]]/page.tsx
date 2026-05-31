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
    company_logo_filename: "",
    existing_msa_filename: "",
    existing_po_filename: "",
    existing_invoice_filename: ""
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
            company_logo_filename: data.company_logo_filename || "",
            existing_msa_filename: data.existing_msa_filename || "",
            existing_po_filename: data.existing_po_filename || "",
            existing_invoice_filename: data.existing_invoice_filename || ""
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
          company_logo_filename: identity.company_logo_filename,
          existing_msa_filename: identity.existing_msa_filename,
          existing_po_filename: identity.existing_po_filename,
          existing_invoice_filename: identity.existing_invoice_filename,
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

  const handleFileUpload = async (file: File, field: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = await getToken();
      const res = await fetch(`${apiUrl}/api/upload/vault`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setIdentity(prev => ({...prev, [field]: data.url}));
      } else {
        alert("Upload failed. The 'vault' bucket might be missing.");
      }
    } catch (e) {
      console.error(e);
      alert("Error uploading file.");
    }
  };

  const FileRow = ({ label, filename, field }: { label: string, filename: string, field: string }) => (
    <div className="flex items-center gap-4 p-4 border border-dashed border-border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${filename ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
         {filename ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
         ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
         )}
       </div>
       <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
          <p className="text-xs font-bold text-text truncate max-w-[200px]">{filename || "Not uploaded"}</p>
       </div>
       <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline relative">
         {filename ? "Replace" : "Upload"}
         <input 
           type="file" 
           className="absolute inset-0 opacity-0 cursor-pointer"
           onChange={(e) => {
             if (e.target.files?.[0]) handleFileUpload(e.target.files[0], field);
           }}
         />
       </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
           <div className="space-y-1">
             <h1 className="text-3xl font-black uppercase italic tracking-tighter text-text">Vault_Settings</h1>
             <p className="text-text-muted font-medium text-sm">Manage your Identity, Templates, and Security credentials.</p>
           </div>
           <Link href="/dashboard" className="px-6 py-2 bg-text text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-apple hover:bg-black transition-colors">
             Return_to_Hub
           </Link>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
           
           {/* Custom Profile Section */}
           <div className="flex-1 space-y-8">
             <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm space-y-8">
                <div className="space-y-2">
                   <h2 className="text-xl font-black uppercase tracking-tight">Legal Entity Settings</h2>
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
                     
                     <div className="pt-8 border-t border-border space-y-4">
                        <div className="space-y-2 mb-6">
                          <h2 className="text-xl font-black uppercase tracking-tight">Document Templates</h2>
                          <p className="text-xs text-text-muted">Upload existing templates or AI will generate missing ones.</p>
                        </div>
                        
                        <FileRow label="Company Logo (PNG)" filename={identity.company_logo_filename} field="company_logo_filename" />
                        <FileRow label="Master Service Agreement" filename={identity.existing_msa_filename} field="existing_msa_filename" />
                        <FileRow label="Purchase Order" filename={identity.existing_po_filename} field="existing_po_filename" />
                        <FileRow label="Invoice Template" filename={identity.existing_invoice_filename} field="existing_invoice_filename" />
                     </div>

                     <button 
                       onClick={handleSave}
                       disabled={saving}
                       className="w-full py-4 mt-8 bg-text text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-apple hover:bg-black transition-all disabled:opacity-50"
                     >
                       {saving ? "Updating Vault..." : "Save_Vault_Configuration"}
                     </button>
                  </div>
                )}
             </div>
           </div>

           {/* Security Settings Section (Clerk) */}
           <div className="lg:w-[600px] shrink-0">
             <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center">
               <div className="w-full mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Access Control</h2>
                    <p className="text-xs text-text-muted">Manage your authentication methods and devices.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Secured</span>
                  </div>
               </div>
               
               <div className="w-full overflow-hidden rounded-2xl border border-border bg-white flex justify-center">
                 <UserProfile 
                    routing="hash" 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none w-full max-w-full border-0",
                      }
                    }} 
                 />
               </div>
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}