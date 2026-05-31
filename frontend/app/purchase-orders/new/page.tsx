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
  item_code: string;
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface POResult {
  po_number: string;
  content_html: string;
  total_amount: number;
}

const UNIT_OPTIONS = ["units", "hours", "kg", "liters", "meters", "pieces", "boxes", "licenses", "months"];
const DELIVERY_TERMS_OPTIONS = ["Ex-Works", "FOB", "CIF", "DDU", "DDP"];
const PAYMENT_TERMS_OPTIONS = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt", "Advance Payment"];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export const dynamic = "force-dynamic";

export default function NewPurchaseOrderPage() {
  const { getToken } = useAuth();

  // Buyer
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerGstin, setBuyerGstin] = useState("");
  const [buyerContactPerson, setBuyerContactPerson] = useState("");
  const [buyerDepartment, setBuyerDepartment] = useState("");

  // Vendor
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [vendorContactPerson, setVendorContactPerson] = useState("");

  // Delivery
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("Ex-Works");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), item_code: "", description: "", hsn_sac: "", quantity: 1, unit: "units", rate: 0 },
  ]);

  // Payment & special instructions
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<POResult | null>(null);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [lineItems]
  );

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: generateId(), item_code: "", description: "", hsn_sac: "", quantity: 1, unit: "units", rate: 0 },
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
      const res = await fetch(`${getApiBase()}/api/purchase-orders/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          buyer: {
            name: buyerName,
            address: buyerAddress,
            gstin: buyerGstin,
            contact_person: buyerContactPerson,
            department: buyerDepartment,
          },
          vendor: {
            name: vendorName,
            address: vendorAddress,
            gstin: vendorGstin,
            contact_person: vendorContactPerson,
          },
          delivery: {
            delivery_address: deliveryAddress,
            delivery_date: deliveryDate,
            delivery_terms: deliveryTerms,
          },
          line_items: lineItems.map(({ id, ...rest }) => rest),
          payment_terms: paymentTerms,
          special_instructions: specialInstructions,
          currency: "INR",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({
        po_number: data.po_number || "N/A",
        content_html: data.html_content || "<p>No content returned.</p>",
        total_amount: data.total_amount || subtotal,
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate purchase order.");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = buyerName && vendorName && lineItems.some((i) => i.description && i.rate > 0);

  const inputClasses = "w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] font-bold text-white placeholder-slate-600 transition-all";

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
            PO_ENGINE
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
            Generate_Purchase_Order
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
              {/* Buyer & Vendor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Buyer */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
                      <span className="text-[#2563EB] font-black text-sm">B</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2563EB]">
                      Buyer Details
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Company Name *</label>
                    <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={inputClasses} placeholder="Your Organization" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Address</label>
                    <textarea value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={2} className={`${inputClasses} resize-none`} placeholder="Full address..." />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">GSTIN</label>
                      <input type="text" value={buyerGstin} onChange={(e) => setBuyerGstin(e.target.value)} className={inputClasses} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Contact Person</label>
                      <input type="text" value={buyerContactPerson} onChange={(e) => setBuyerContactPerson(e.target.value)} className={inputClasses} placeholder="Jane Smith" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Department</label>
                    <input type="text" value={buyerDepartment} onChange={(e) => setBuyerDepartment(e.target.value)} className={inputClasses} placeholder="Procurement / IT / Engineering" />
                  </div>
                </div>

                {/* Vendor */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-amber-400 font-black text-sm">V</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">
                      Vendor Details
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Company Name *</label>
                    <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputClasses} placeholder="Vendor Corp Ltd" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Address</label>
                    <textarea value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} rows={2} className={`${inputClasses} resize-none`} placeholder="Full address..." />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">GSTIN</label>
                      <input type="text" value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)} className={inputClasses} placeholder="22BBBBB0000B1Z5" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Contact Person</label>
                      <input type="text" value={vendorContactPerson} onChange={(e) => setVendorContactPerson(e.target.value)} className={inputClasses} placeholder="John Doe" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-400 font-black text-sm">D</span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">
                    Delivery Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Delivery Address</label>
                    <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={3} className={`${inputClasses} resize-none`} placeholder="Ship to address..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Delivery Date</label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Delivery Terms</label>
                    <select value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} className={`${inputClasses} appearance-none cursor-pointer`}>
                      {DELIVERY_TERMS_OPTIONS.map((dt) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#2563EB]">
                    Order Items
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addLineItem}
                    className="px-4 py-2 bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2563EB]/20 transition-all"
                  >
                    + Add Item
                  </motion.button>
                </div>

                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-12 gap-3 mb-3 px-2">
                  <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Code</span>
                  <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</span>
                  <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-slate-500">HSN/SAC</span>
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
                        className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
                      >
                        <input
                          type="text"
                          value={item.item_code}
                          onChange={(e) => updateLineItem(item.id, "item_code", e.target.value)}
                          className="lg:col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white placeholder-slate-600 text-sm transition-all"
                          placeholder="ITM-01"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          className="lg:col-span-3 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white placeholder-slate-600 text-sm transition-all"
                          placeholder="Item description"
                        />
                        <input
                          type="text"
                          value={item.hsn_sac}
                          onChange={(e) => updateLineItem(item.id, "hsn_sac", e.target.value)}
                          className="lg:col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white placeholder-slate-600 text-sm transition-all"
                          placeholder="8471"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="lg:col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white text-sm transition-all"
                          min={0}
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateLineItem(item.id, "unit", e.target.value)}
                          className="lg:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white text-sm appearance-none cursor-pointer transition-all"
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="lg:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]/40 font-bold text-white text-sm transition-all"
                          min={0}
                          placeholder="0"
                        />
                        <div className="lg:col-span-1 text-right font-black text-emerald-400 text-sm">
                          ₹{(item.quantity * item.rate).toLocaleString("en-IN")}
                        </div>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length <= 1}
                          className="lg:col-span-1 flex justify-center items-center w-10 h-10 rounded-xl border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed mx-auto"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Totals */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-500">Order Total</span>
                      <span className="text-2xl font-black text-emerald-400">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Terms & Special Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className={`${inputClasses} appearance-none cursor-pointer`}
                  >
                    {PAYMENT_TERMS_OPTIONS.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Special Instructions</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                    className={`${inputClasses} resize-none`}
                    placeholder="Packaging requirements, quality specs..."
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
                      Generating PO...
                    </>
                  ) : (
                    "Generate Purchase Order ⚡"
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
                    PO_Generated
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Your purchase order has been minted successfully.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-3 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">PO No.</span>
                    <span className="text-lg font-black text-emerald-300">{result.po_number}</span>
                  </div>
                  <div className="bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-2xl px-6 py-3 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] block">Total</span>
                    <span className="text-lg font-black text-blue-300">₹{result.total_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* PO Preview */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/5 overflow-hidden">
                <div className="bg-slate-100 px-8 py-4 flex items-center gap-2 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Purchase Order Preview
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
                  New PO +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
