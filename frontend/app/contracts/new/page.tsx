"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

function getApiBase() {
  let host = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST || "localhost:8000";
  host = host.replace(/^wss?:\/\//, "").split("/")[0];
  const protocol =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "https:"
      : "http:";
  return `${protocol}//${host}`;
}

const CONTRACT_TYPES = [
  { id: "msa", label: "MSA", desc: "Master Service Agreement", icon: "📜" },
  { id: "sow", label: "SOW", desc: "Statement of Work", icon: "📋" },
  { id: "nda", label: "NDA", desc: "Non-Disclosure Agreement", icon: "🔒" },
  { id: "employment", label: "EMPLOYMENT", desc: "Employment Contract", icon: "👤" },
  { id: "freelance", label: "FREELANCE", desc: "Freelancer Agreement", icon: "💼" },
  { id: "saas", label: "SAAS", desc: "SaaS Subscription Agreement", icon: "☁️" },
  { id: "consulting", label: "CONSULTING", desc: "Consulting Agreement", icon: "🎯" },
  { id: "vendor", label: "VENDOR", desc: "Vendor Agreement", icon: "🏭" },
];

const PAYMENT_TERMS_OPTIONS = [
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due on Receipt",
  "50% Advance, 50% on Delivery",
  "Milestone Based",
];

interface GeneratedResult {
  contract_number: string;
  content_html: string;
}

export const dynamic = "force-dynamic";

export default function NewContractPage() {
  const { getToken } = useAuth();

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1: contract type
  const [contractType, setContractType] = useState("");

  // Step 2: party details
  const [partyAName, setPartyAName] = useState("");
  const [partyAAddress, setPartyAAddress] = useState("");
  const [partyAGstin, setPartyAGstin] = useState("");
  const [partyBName, setPartyBName] = useState("");
  const [partyBAddress, setPartyBAddress] = useState("");
  const [partyBGstin, setPartyBGstin] = useState("");

  // Step 3: terms
  const [totalValue, setTotalValue] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Step 4: result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const canProceedStep2 =
    partyAName && partyAAddress && partyBName && partyBAddress;
  const canProceedStep3 = totalValue && effectiveDate && expiryDate;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/contracts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contract_type: contractType,
          party_a: {
            name: partyAName,
            address: partyAAddress,
            gstin: partyAGstin,
          },
          party_b: {
            name: partyBName,
            address: partyBAddress,
            gstin: partyBGstin,
          },
          total_value: parseFloat(totalValue),
          currency: "INR",
          payment_terms: paymentTerms,
          effective_date: effectiveDate,
          expiry_date: expiryDate,
          special_instructions: specialInstructions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({
        contract_number: data.contract_number || "N/A",
        content_html: data.html_content || data.content_html || "<p>No content returned.</p>",
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to generate contract.");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="text-lg font-black tracking-tighter hidden sm:block">
              VOICE<span className="text-[#2563EB]">CONTRACT</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2563EB] block mb-2">
            CONTRACT_ENGINE
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
            Generate_Contract
          </h1>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
                  step === s
                    ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 scale-110"
                    : step > s
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 rounded-full transition-colors duration-300 ${
                    step > s ? "bg-emerald-500/40" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* Step 1: Contract Type */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                Select_Contract_Type
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                Choose the type of legal instrument to generate.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CONTRACT_TYPES.map((ct) => (
                  <motion.button
                    key={ct.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setContractType(ct.id);
                      setStep(2);
                    }}
                    className={`relative p-6 rounded-3xl border-2 text-left transition-all duration-200 ${
                      contractType === ct.id
                        ? "bg-[#2563EB]/10 border-[#2563EB] shadow-lg shadow-blue-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-3xl mb-4">{ct.icon}</div>
                    <div className="text-sm font-black uppercase tracking-widest mb-1">
                      {ct.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-tight">
                      {ct.desc}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Party Details */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                Party_Details
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                Enter the legal entities involved in this contract.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Party A */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
                      <span className="text-[#2563EB] font-black text-sm">A</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2563EB]">
                      Party A (You)
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={partyAName}
                      onChange={(e) => setPartyAName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all"
                      placeholder="Your Company Pvt Ltd"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Address *
                    </label>
                    <textarea
                      value={partyAAddress}
                      onChange={(e) => setPartyAAddress(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 resize-none transition-all"
                      placeholder="Full registered address..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={partyAGstin}
                      onChange={(e) => setPartyAGstin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                {/* Party B */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-amber-400 font-black text-sm">B</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">
                      Party B (Client)
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={partyBName}
                      onChange={(e) => setPartyBName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all"
                      placeholder="Client Corp Ltd"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Address *
                    </label>
                    <textarea
                      value={partyBAddress}
                      onChange={(e) => setPartyBAddress(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 resize-none transition-all"
                      placeholder="Full registered address..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={partyBGstin}
                      onChange={(e) => setPartyBGstin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all"
                      placeholder="22BBBBB0000B1Z5"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-10">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-4 border-2 border-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-500 hover:text-white transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => canProceedStep2 && setStep(3)}
                  disabled={!canProceedStep2}
                  className="px-8 py-4 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Terms */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                Contract_Terms
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                Define the financial and temporal parameters.
              </p>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Total Value (INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">₹</span>
                      <input
                        type="number"
                        value={totalValue}
                        onChange={(e) => setTotalValue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all"
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white transition-all appearance-none cursor-pointer"
                    >
                      {PAYMENT_TERMS_OPTIONS.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Effective Date *
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 resize-none transition-all"
                      placeholder="Any specific clauses, conditions, or notes..."
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-400 text-sm font-bold flex items-center gap-3"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-10">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-4 border-2 border-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-500 hover:text-white transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!canProceedStep3 || loading}
                  className="px-10 py-4 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Contract ⚡"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Result */}
          {step === 4 && result && (
            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
                    Contract_Generated
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Your contract has been minted successfully.
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    Contract No.
                  </span>
                  <span className="text-lg font-black text-emerald-300">
                    {result.contract_number}
                  </span>
                </div>
              </div>

              {/* Contract Preview */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/5 overflow-hidden">
                <div className="bg-slate-100 px-8 py-4 flex items-center gap-2 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Contract Preview
                  </span>
                </div>
                <div
                  className="p-8 sm:p-12 text-black prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.content_html }}
                />
              </div>

              <div className="flex justify-between mt-10">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 border-2 border-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-500 hover:text-white transition-all"
                >
                  ← Dashboard
                </Link>
                <button
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setContractType("");
                  }}
                  className="px-8 py-4 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                >
                  New Contract +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
