"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import IdentityWizard from "@/components/IdentityWizard";

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already onboarded
  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.onboardingComplete) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  const handleComplete = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      const host = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST || "localhost:8000";
      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      
      const res = await fetch(`${protocol}//${host}/api/users/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: data.company_name,
          gst_number: data.gst_number,
          address: data.address,
          onboarding_complete: true
        })
      });

      if (res.ok) {
        // Update Clerk Metadata to break the loop permanently
        if (user) {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              onboardingComplete: true,
              company_name: data.company_name
            }
          });
        }
        
        // Save local flag as double insurance
        if (typeof window !== 'undefined') {
          localStorage.setItem('onboardingComplete', 'true');
        }
        
        // Brief delay to allow metadata sync
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        throw new Error("Failed to save profile to database.");
      }
    } catch (error) {
      console.error("Onboarding failed:", error);
      setIsSubmitting(false);
      alert("System error during onboarding. Please try again.");
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-background flex items-center justify-center animate-pulse font-black text-text-muted uppercase tracking-[0.4em]">Initializing_Vault...</div>;

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-8 premium-noise">
      <div className="absolute top-12 left-12 flex items-center gap-3">
         <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl">V</span>
         </div>
         <h2 className="text-xl font-black tracking-tighter text-text uppercase">VoiceContract</h2>
      </div>

      <div className="w-full max-w-2xl relative">
         <AnimatePresence>
           {isSubmitting && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 flex items-center justify-center bg-surface/60 backdrop-blur-md rounded-[40px]"
             >
               <div className="flex flex-col items-center gap-6">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
                 <span className="font-black text-[10px] uppercase tracking-[0.5em] text-primary">Provisioning_Legal_Grid</span>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
         
         <IdentityWizard onComplete={handleComplete} />
      </div>

      <div className="absolute bottom-12 text-[10px] font-black text-text/10 uppercase tracking-[0.8em]">Secure_Genesis_01</div>
    </div>
  );
}
