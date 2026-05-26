"use client";

import { Gap } from "@/lib/types";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface GapAlertProps {
  gaps: Gap[];
}

export function GapAlert({ gaps }: GapAlertProps) {
  if (!gaps || gaps.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <Alert className="border-brand-amber/50 bg-brand-amber/5 text-brand-amber">
        <AlertTriangle className="h-5 w-5 !text-brand-amber" />
        <AlertTitle className="text-lg font-semibold ml-2">
          ⚠️ {gaps.length} terms were not discussed in your call
        </AlertTitle>
        <AlertDescription className="ml-2 mt-2 text-brand-amber/80">
          We have applied standard Indian freelance defaults to protect you. Review them below before signing.
        </AlertDescription>
      </Alert>

      <Accordion className="w-full space-y-2">
        {gaps.map((gap, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border border-border bg-card rounded-lg px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-left">
                <span className="capitalize font-semibold text-foreground">
                  {gap.field.replace('_', ' ')}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-muted-foreground space-y-3">
              <p className="text-sm">
                <strong className="text-foreground">Why this matters:</strong> {gap.warning}
              </p>
              <div className="bg-secondary/50 p-3 rounded-md text-sm border border-border/50">
                <strong className="text-foreground block mb-1">Applied Default:</strong>
                {gap.default_value}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
