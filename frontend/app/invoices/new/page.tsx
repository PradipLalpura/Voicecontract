"use client";

import { useState, useMemo } from "react";
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

interface LineItem {
  id: string;
  description: string;
  hsn_sac_code: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface InvoiceResult {
  invoice_number: string;
  content_html: string;
  total_amount: number;
}

const UNIT_OPTIONS = ["hours", "units", "licenses", "months"];
const PAYMENT_TERMS_OPTIONS = [
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due on Receipt",
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export const dynamic = "force-dynamic";

export default function NewInvoicePage() {
  const { getToken } = useAuth();

  // Biller
  const [billerName, setBillerName] = useState("");
  const [billerAddress, setBillerAddress] = useState("");
  const [billerGstin, setBillerGstin] = useState("");
  const [billerPan, setBillerPan] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  // Recipient
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientGstin, setRecipientGstin] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), description: "", hsn_sac_code: "", quantity: 1, unit: "hours", rate: 0 },
  ]);

  // Payment & notes
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");

  // Result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InvoiceResult | null>(null);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [lineItems]
  );

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: generateId(), description: "", hsn_sac_code: "", quantity: 1, unit: "hours", rate: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = await getToken();
      const res = await fetch(`${getApiBase()}/api/invoices/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          biller: {
            name: billerName,
            address: billerAddress,
            gstin: billerGstin,
            pan: billerPan,
            bank_details: {
              account_name: bankAccountName,
              account_number: bankAccountNumber,
              bank_name: bankName,
              ifsc_code: bankIfsc,
            },
          },
          recipient: {
            name: recipientName,
            address: recipientAddress,
            gstin: recipientGstin,
          },
          line_items: lineItems.map(({ id, ...rest }) => rest),
          payment_terms: paymentTerms,
          notes,
          currency: "INR",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({
        invoice_number: data.invoice_number || "N/A",
        content_html: data.html_content || "<p>No content returned.</p>",
        total_amount: data.total_amount || subtotal,
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate invoice.");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = billerName && recipientName && lineItems.some((i) => i.description && i.rate > 0);

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

      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-12">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2563EB] block mb-2">
            INVOICE_ENGINE
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
            Generate_Invoice
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Biller & Recipient */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Biller */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
                      <span className="text-[#2563EB] font-black text-sm">B</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2563EB]">
                      Biller Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Name *</label>
                      <input type="text" value={billerName} onChange={(e) => setBillerName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="Your Business Name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Address</label>
                      <textarea value={billerAddress} onChange={(e) => setBillerAddress(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 resize-none transition-all" placeholder="Full address..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">GSTIN</label>
                      <input type="text" value={billerGstin} onChange={(e) => setBillerGstin(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">PAN</label>
                      <input type="text" value={billerPan} onChange={(e) => setBillerPan(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="AAAAA0000A" />
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-4">Bank Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Account Name</label>
                        <input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="Account holder" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Account Number</label>
                        <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="XXXXXXXXXXXX" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Bank Name</label>
                        <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="HDFC Bank" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">IFSC Code</label>
                        <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="HDFC0000001" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-amber-400 font-black text-sm">R</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">
                      Recipient Details
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Name *</label>
                    <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="Client Company Ltd" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Address</label>
                    <textarea value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 resize-none transition-all" placeholder="Full address..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">GSTIN</label>
                    <input type="text" value={recipientGstin} onChange={(e) => setRecipientGstin(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all" placeholder="22BBBBB0000B1Z5" />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#2563EB]">
                    Line Items
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addLineItem}
                    className="px-4 py-2 bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2563EB]/20 transition-all"
                  >
                    + Add Row
                  </motion.button>
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-3 mb-3 px-2">
                  <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</span>
                  <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">HSN/SAC</span>
                  <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Qty</span>
                  <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Unit</span>
                  <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Rate (₹)</span>
                  <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Amount</span>
                  <span className="col-span-1" />
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {lineItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          className="md:col-span-3 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white placeholder-slate-600 text-sm transition-all"
                          placeholder="Service description"
                        />
                        <input
                          type="text"
                          value={item.hsn_sac_code}
                          onChange={(e) => updateLineItem(item.id, "hsn_sac_code", e.target.value)}
                          className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white placeholder-slate-600 text-sm transition-all"
                          placeholder="998314"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="md:col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white text-sm transition-all"
                          min={0}
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateLineItem(item.id, "unit", e.target.value)}
                          className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white text-sm appearance-none cursor-pointer transition-all"
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white text-sm transition-all"
                          min={0}
                          placeholder="0"
                        />
                        <div className="md:col-span-1 text-right font-black text-emerald-400 text-sm">
                          ₹{(item.quantity * item.rate).toLocaleString("en-IN")}
                        </div>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length <= 1}
                          className="md:col-span-1 flex justify-center items-center w-10 h-10 rounded-xl border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed mx-auto"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Totals */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-500">Subtotal</span>
                      <span className="text-xl font-black text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-xl px-5 py-2 text-[11px] font-bold text-[#2563EB]">
                      GST will be auto-detected and applied based on GSTIN state codes
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-400">Total</span>
                      <span className="text-2xl font-black text-emerald-400">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Terms & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white transition-all appearance-none cursor-pointer"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 resize-none transition-all"
                    placeholder="Additional notes or terms..."
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-400 text-sm font-bold flex items-center gap-3"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  className="px-12 py-5 bg-[#2563EB] text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating Invoice...
                    </>
                  ) : (
                    "Generate Invoice ⚡"
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Result View */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
                    Invoice_Generated
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Your invoice has been minted successfully.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-3 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Invoice No.</span>
                    <span className="text-lg font-black text-emerald-300">{result.invoice_number}</span>
                  </div>
                  <div className="bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-2xl px-6 py-3 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] block">Total</span>
                    <span className="text-lg font-black text-blue-300">₹{result.total_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Preview */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/5 overflow-hidden">
                <div className="bg-slate-100 px-8 py-4 flex items-center gap-2 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Invoice Preview
                  </span>
                </div>
                <div
                  className="p-8 sm:p-12 text-black prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.content_html }}
                />
              </div>

              <div className="flex justify-between">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 border-2 border-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-500 hover:text-white transition-all"
                >
                  ← Dashboard
                </Link>
                <button
                  onClick={() => setResult(null)}
                  className="px-8 py-4 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                >
                  New Invoice +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
