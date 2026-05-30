"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import IdentityWizard from "@/components/IdentityWizard";

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      if (user) {
        // Update Clerk User Metadata so they don't get trapped in a loop
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingComplete: true,
            company_name: data.company_name,
            gst_number: data.gst_number,
          }
        });
      }
      
      // Fallback local storage for dev mode without Clerk
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingComplete', 'true');
      }
      
      // Navigate to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save profile:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-8 premium-noise">
      <div className="absolute top-8 left-8 flex items-center gap-2">
         <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">V</span>
         </div>
         <h2 className="text-lg font-bold tracking-tight text-text">VoiceContract</h2>
      </div>

      <div className="w-full max-w-2xl relative">
         {isSubmitting && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-sm rounded-3xl">
             <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border border-border">
               <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
               <span className="font-semibold text-sm">Provisioning Secure Vault...</span>
             </div>
           </div>
         )}
         
         <IdentityWizard onComplete={handleComplete} />
      </div>
    </div>
  );
}
