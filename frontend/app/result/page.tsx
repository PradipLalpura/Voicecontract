/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GapAlert } from "@/components/GapAlert";
import { ContractPreview } from "@/components/ContractPreview";
import { Button } from "@/components/ui/button";
import { downloadPDF } from "@/lib/api";
import { toast } from "sonner";
import { FileDown, RefreshCcw } from "lucide-react";

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const result = (window as any).__voiceContractResult;
      if (result) {
        setData(result);
      } else {
        router.push("/");
      }
    }
  }, [router]);

  const handleDownload = async () => {
    if (!data) return;
    setIsDownloading(true);
    try {
      await downloadPDF(data.contract, data.companyDetails);
      toast.success("PDF Downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartNew = () => {
    if (typeof window !== "undefined") {
      (window as any).__voiceContractFile = null;
      (window as any).__voiceContractResult = null;
    }
    router.push("/");
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen flex flex-col items-center p-6 lg:p-12 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Alerts & Actions */}
        <div className="lg:col-span-1 flex flex-col space-y-6 order-2 lg:order-1">
          <div className="space-y-4 bg-card border border-border p-6 rounded-xl">
            <h1 className="text-2xl font-bold text-foreground">Contract Ready</h1>
            <p className="text-muted-foreground text-sm">
              Your meeting has been processed and a service agreement generated based on your discussions.
            </p>
            
            <Button 
              className="w-full h-12 font-medium" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Generating PDF..." : (
                <>
                  <FileDown className="mr-2 h-5 w-5" /> Download PDF
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-10"
              onClick={handleStartNew}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Start New
            </Button>
          </div>

          {data.has_gaps && (
            <GapAlert gaps={data.gaps} />
          )}
        </div>

        {/* Right Column: Contract Preview */}
        <div className="lg:col-span-2 h-full order-1 lg:order-2">
          <ContractPreview contract={data.contract} companyDetails={data.companyDetails} />
        </div>

      </div>
    </main>
  );
}
