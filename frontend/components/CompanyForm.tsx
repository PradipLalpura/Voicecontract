"use client";

import { useEffect, useState, useRef } from "react";
import { CompanyDetails } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Image as ImageIcon, FileText, X, Upload } from "lucide-react";
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
    brandDna: "",
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const dnaInputRef = useRef<HTMLInputElement>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetails(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDnaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDetails(prev => ({ ...prev, brandDna: event.target?.result as string }));
        toast.success("Brand DNA loaded");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("voicecontract_company", JSON.stringify(details));
    onSave(details);
  };

  return (
    <Card className="w-full max-w-lg bg-brand-surface border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl italic font-heading text-brand-cyan">Company Profile</CardTitle>
        <CardDescription className="text-brand-dusk">Configure your professional identity.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-xs uppercase tracking-widest font-mono text-brand-dusk">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                className="bg-brand-void border-border focus:border-brand-cyan transition-all"
                placeholder="Antarik"
                value={details.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yourName" className="text-xs uppercase tracking-widest font-mono text-brand-dusk">Signatory Name</Label>
              <Input
                id="yourName"
                name="yourName"
                className="bg-brand-void border-border focus:border-brand-cyan transition-all"
                placeholder="Pradip Lalpura"
                value={details.yourName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs uppercase tracking-widest font-mono text-brand-dusk">Business Address</Label>
            <Input
              id="address"
              name="address"
              className="bg-brand-void border-border focus:border-brand-cyan transition-all"
              placeholder="Ahmedabad, Gujarat"
              value={details.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstNumber" className="text-xs uppercase tracking-widest font-mono text-brand-dusk">GST Number</Label>
            <Input
              id="gstNumber"
              name="gstNumber"
              className="bg-brand-void border-border focus:border-brand-cyan transition-all"
              placeholder="24XXXXX"
              value={details.gstNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-mono text-brand-dusk">Company Logo</Label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="h-24 rounded-lg border border-dashed border-border bg-brand-void flex flex-col items-center justify-center cursor-pointer hover:border-brand-cyan transition-colors group relative overflow-hidden"
              >
                {details.logo ? (
                  <>
                    <img src={details.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDetails(p => ({ ...p, logo: "" })); }}
                      className="absolute top-1 right-1 bg-brand-void/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 text-brand-dusk group-hover:text-brand-cyan transition-colors" />
                    <span className="text-[10px] mt-1 text-brand-dusk uppercase">Upload PNG</span>
                  </>
                )}
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-mono text-brand-dusk">Brand DNA / Format</Label>
              <div 
                onClick={() => dnaInputRef.current?.click()}
                className="h-24 rounded-lg border border-dashed border-border bg-brand-void flex flex-col items-center justify-center cursor-pointer hover:border-brand-cyan transition-colors group"
              >
                {details.brandDna ? (
                  <>
                    <FileText className="h-6 w-6 text-brand-cyan" />
                    <span className="text-[10px] mt-1 text-brand-cyan uppercase">Document Loaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-brand-dusk group-hover:text-brand-cyan transition-colors" />
                    <span className="text-[10px] mt-1 text-brand-dusk uppercase">Upload .txt / .md</span>
                  </>
                )}
                <input type="file" ref={dnaInputRef} className="hidden" accept=".txt,.md" onChange={handleDnaUpload} />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-void font-bold py-6 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]">
            Save Professional Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
