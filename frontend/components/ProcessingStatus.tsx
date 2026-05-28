"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Step } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { useEffect, useState } from "react";

interface ProcessingStatusProps {
  steps: Step[];
  currentStepId: number;
  error?: string | null;
}

export function ProcessingStatus({ steps, currentStepId, error }: ProcessingStatusProps) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    // Only tick if not all done and no error
    const isDone = currentStepId >= steps.length;
    if (isDone || error) return;
    
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStepId, steps.length, error]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-lg bg-card border-border overflow-hidden">
      <div className="bg-secondary/50 p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-semibold">Pipeline Status</h3>
        <span className="text-sm text-muted-foreground font-mono">{formatTime(elapsed)}</span>
      </div>
      <CardContent className="p-6 space-y-6">
        {steps.map((step) => {
          const isActive = step.id === currentStepId && !error;
          const isDone = step.id < currentStepId || (step.id === currentStepId && step.state === 'done');
          const isError = step.id === currentStepId && error;
          
          return (
            <div key={step.id} className={`flex items-start gap-4 transition-opacity duration-300 ${!isActive && !isDone && !isError ? 'opacity-40' : 'opacity-100'}`}>
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : isError ? (
                  <XCircle className="w-6 h-6 text-destructive" />
                ) : isActive ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>
              </div>
            </div>
          );
        })}
        
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
