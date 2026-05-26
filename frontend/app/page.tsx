"use client";

import { useRouter } from "next/navigation";
import { CompanyForm } from "@/components/CompanyForm";
import { AudioUploader } from "@/components/AudioUploader";
import { CompanyDetails } from "@/lib/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("voicecontract_company");
    if (stored) {
      setCompanyDetails(JSON.parse(stored));
    }
  }, []);

  const handleSaveCompany = (details: CompanyDetails) => {
    setCompanyDetails(details);
    toast.success("Profile saved successfully");
  };

  const handleProcessAudio = (file: File) => {
    if (!companyDetails) {
      toast.error("Please save your company profile first");
      return;
    }
    
    // Convert file to base64 or pass it along to the processing page via context/state
    // For this MVP, we can store it in a global state, or pass it via IndexedDB, 
    // but the easiest is to just upload it here and pass the transcript to the next page.
    
    // To match the requested flow: "Navigate to /processing after submit"
    // We will pass the file details to a global store or just do the API call in /processing.
    // Since we can't easily pass File objects via URL, we'll start the upload here, 
    // get a temporary ID, or just pass a signal.
    
    // Let's store the file in a window-level variable temporarily for the MVP routing
    if (typeof window !== "undefined") {
      (window as any).__voiceContractFile = file;
    }
    
    router.push("/processing");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="max-w-3xl w-full space-y-12">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Client call ends. <span className="text-brand-green">Contract is ready.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your meeting recording. Our AI pipeline automatically extracts deal terms, catches missing clauses, and drafts a legally sound contract in 60 seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">1. Your Details</h2>
              <p className="text-sm text-muted-foreground mb-4">Saved locally for your next contracts.</p>
              <CompanyForm onSave={handleSaveCompany} initialData={companyDetails} />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">2. Meeting Audio</h2>
              <p className="text-sm text-muted-foreground mb-4">Upload the recording to start the pipeline.</p>
              <div className={!companyDetails ? "opacity-50 pointer-events-none grayscale" : ""}>
                <AudioUploader onProcess={handleProcessAudio} />
              </div>
              {!companyDetails && (
                <p className="text-brand-amber text-sm font-medium mt-2 text-center">
                  Save your profile first to unlock upload.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
