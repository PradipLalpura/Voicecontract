/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Step } from "@/lib/types";
import { transcribeAudio, extractTerms, generateContract } from "@/lib/api";

const initialSteps: Step[] = [
  { id: 0, title: "Transcribing Audio", subtitle: "Groq Whisper", state: "waiting" },
  { id: 1, title: "Extracting Deal Terms", subtitle: "Gemini 2.0 Flash", state: "waiting" },
  { id: 2, title: "Generating Contract", subtitle: "GPT-4o (Codex)", state: "waiting" },
  { id: 3, title: "Building PDF", subtitle: "Document Assembly", state: "waiting" },
];

export default function ProcessingPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [currentStepId, setCurrentStepId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const runPipeline = async () => {
      try {
        const file = (window as any).__voiceContractFile as File;
        if (!file) {
          throw new Error("No audio file found. Please go back and upload again.");
        }

        const companyDetailsStr = localStorage.getItem("voicecontract_company");
        if (!companyDetailsStr) {
          throw new Error("Company profile missing.");
        }
        const companyDetails = JSON.parse(companyDetailsStr);

        // Step 0: Transcription
        setCurrentStepId(0);
        const { transcript } = await transcribeAudio(file);
        setSteps(s => s.map(step => step.id === 0 ? { ...step, state: "done" } : step));

        // Step 1: Extraction & Gap Analysis
        setCurrentStepId(1);
        const extraction = await extractTerms(transcript);
        setSteps(s => s.map(step => step.id === 1 ? { ...step, state: "done" } : step));

        // Step 2: Contract Generation
        setCurrentStepId(2);
        const generation = await generateContract(extraction.terms, extraction.gaps, companyDetails);
        setSteps(s => s.map(step => step.id === 2 ? { ...step, state: "done" } : step));

        // Step 3: Finalizing (Passing data to result page)
        setCurrentStepId(3);
        
        // Store results for the result page
        if (typeof window !== "undefined") {
          (window as any).__voiceContractResult = {
            contract: generation.contract,
            gaps: extraction.gaps,
            has_gaps: extraction.has_gaps,
            companyDetails: companyDetails
          };
        }
        
        setSteps(s => s.map(step => step.id === 3 ? { ...step, state: "done" } : step));
        setCurrentStepId(4); // All done
        
        // Navigate to result
        setTimeout(() => {
          router.push("/result");
        }, 1000);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred in the pipeline.");
      }
    };

    runPipeline();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Processing Meeting</h1>
        <p className="text-muted-foreground">Please do not close this tab. This usually takes less than 60 seconds.</p>
        
        <div className="flex justify-center text-left">
          <ProcessingStatus 
            steps={steps} 
            currentStepId={currentStepId} 
            error={error} 
          />
        </div>
      </div>
    </main>
  );
}
