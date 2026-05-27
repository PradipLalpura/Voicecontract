"use client";

import { useEffect, useState, useRef } from "react";
import { CompanyDetails } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Image as ImageIcon, X, Building2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyFormProps {
  onSave: (details: CompanyDetails) => void;
  initialData?: CompanyDetails | null;
}

export function CompanyForm({ onSave, initialData }: CompanyFormProps) {
  const [details, setDetails] = useState<CompanyDetails>({
    companyName: "",
    yourName: "",
    gstNumber: "",
    address: "",
    logo: "",
    clientName: "",
    clientLogo: "",
    brandDna: "",
  });

  const providerLogoRef = useRef<HTMLInputElement>(null);
  const clientLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setDetails(initialData);
    } else {
      const stored = localStorage.getItem("voicecontract_company");
      if (stored) {
        setDetails(JSON.parse(stored));
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'clientLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Logo must be under 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetails(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("voicecontract_company", JSON.stringify(details));
    onSave(details);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-1000">
      
      <div className="grid md:grid-cols-2 gap-10">
        
        {/* PROVIDER SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Building2 className="h-5 w-5 text-brand-cyan" />
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-starlight">Service Provider</h3>
          </div>

          <div className="space-y-4">
             <div 
                onClick={() => providerLogoRef.current?.click()}
                className="group relative h-20 w-full rounded-xl border border-dashed border-border bg-brand-surface/50 flex items-center justify-center cursor-pointer hover:border-brand-cyan transition-all overflow-hidden"
              >
                {details.logo ? (
                  <>
                    <img src={details.logo} alt="Provider" className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDetails(p => ({ ...p, logo: "" })); }} className="absolute top-2 right-2 bg-brand-void p-1 rounded-full border border-border opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-5 w-5 text-brand-dusk group-hover:text-brand-cyan" />
                    <span className="text-[9px] font-mono uppercase text-brand-dusk">Logo (Optional)</span>
                  </div>
                )}
                <input type="file" ref={providerLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-mono uppercase text-brand-dusk pl-1">Entity Name</Label>
                <Input name="companyName" className="h-11 bg-brand-void border-border rounded-lg focus:ring-1 focus:ring-brand-cyan" value={details.companyName} onChange={handleChange} required />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-mono uppercase text-brand-dusk pl-1">Signatory</Label>
                  <Input name="yourName" className="h-11 bg-brand-void border-border rounded-lg" value={details.yourName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-mono uppercase text-brand-dusk pl-1">GST Identification</Label>
                  <Input name="gstNumber" className="h-11 bg-brand-void border-border rounded-lg" value={details.gstNumber} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-mono uppercase text-brand-dusk pl-1">Registered Address</Label>
                <Input name="address" className="h-11 bg-brand-void border-border rounded-lg" value={details.address} onChange={handleChange} required />
              </div>
          </div>
        </div>

        {/* CLIENT SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <UserCircle2 className="h-5 w-5 text-brand-starlight" />
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-starlight">Counterparty (Client)</h3>
          </div>

          <div className="space-y-4">
             <div 
                onClick={() => clientLogoRef.current?.click()}
                className="group relative h-20 w-full rounded-xl border border-dashed border-border bg-brand-surface/50 flex items-center justify-center cursor-pointer hover:border-brand-starlight transition-all overflow-hidden"
              >
                {details.clientLogo ? (
                  <>
                    <img src={details.clientLogo} alt="Client" className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDetails(p => ({ ...p, clientLogo: "" })); }} className="absolute top-2 right-2 bg-brand-void p-1 rounded-full border border-border opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-5 w-5 text-brand-dusk group-hover:text-brand-starlight" />
                    <span className="text-[9px] font-mono uppercase text-brand-dusk">Client Logo</span>
                  </div>
                )}
                <input type="file" ref={clientLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'clientLogo')} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-mono uppercase text-brand-dusk pl-1">Client Business Name</Label>
                <Input name="clientName" className="h-11 bg-brand-void border-border rounded-lg focus:ring-1 focus:ring-brand-starlight" value={details.clientName} onChange={handleChange} required placeholder="e.g. Acme Corp" />
              </div>

              <div className="pt-4 p-4 border border-border bg-brand-surface/20 rounded-xl">
                 <p className="text-[10px] leading-relaxed text-brand-dusk font-sans uppercase tracking-wider">
                   Confidentiality Notice: These identities will be used strictly for document assembly and legal reasoning. Data is stored locally in your secure browser cache.
                 </p>
              </div>
          </div>
        </div>

      </div>

      <Button type="submit" className="w-full h-14 bg-brand-starlight hover:bg-white text-brand-void font-bold text-sm uppercase tracking-[0.3em] rounded-none border-x-4 border-brand-cyan transition-all group">
        Establish Legal Identities
      </Button>
    </form>
  );
}
