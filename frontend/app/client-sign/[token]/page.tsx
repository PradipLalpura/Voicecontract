"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SigPoint {
  x: number;
  y: number;
  t: number;
}

export default function ClientSignPage() {
  const { token } = useParams();
  const sessionId = Array.isArray(token) ? token[0] : token;

  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}`
    : "http://localhost:8000";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contractData, setContractData] = useState<any>(null);
  const [activeDoc, setActiveDoc] = useState<"msa" | "invoice" | "po">("msa");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureStrokes, setSignatureStrokes] = useState<SigPoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<SigPoint[]>([]);

  useEffect(() => {
    async function fetchContract() {
      try {
        const res = await fetch(`${apiUrl}/api/client-sign/${sessionId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Contract not found" }));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setContractData(data);
        if (data.client_signed || data.status === "fully_signed") {
          setSigned(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load contract.");
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchContract();
  }, [sessionId, apiUrl]);

  const getCanvasPoint = (e: any): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return null;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    ctx.beginPath();
    ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
    setIsDrawing(true);
    setCurrentStroke([{ x: pt.x, y: pt.y, t: Date.now() }]);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setCurrentStroke((prev) => [...prev, { x: pt.x, y: pt.y, t: Date.now() }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setSignatureStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureStrokes([]);
    setCurrentStroke([]);
  };

  const handleSign = useCallback(async () => {
    if (signatureStrokes.length === 0) {
      setError("Please sign the document first.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the terms before signing.");
      return;
    }

    setIsSigning(true);
    setError("");

    try {
      const strokes = signatureStrokes.map((stroke) => ({
        points: stroke.map((p) => ({ x: p.x, y: p.y, t: p.t })),
      }));

      const res = await fetch(`${apiUrl}/api/client-sign/${sessionId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: contractData?.client_name || "Client",
          strokes,
          agreed_to_terms: true,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Signing failed" }));
        throw new Error(errBody.detail || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      setSignedPdfBlob(blob);
      setSigned(true);
    } catch (err: any) {
      setError(err.message || "Signing failed.");
    } finally {
      setIsSigning(false);
    }
  }, [signatureStrokes, agreedToTerms, apiUrl, sessionId, contractData]);

  const handleDownload = () => {
    if (!signedPdfBlob) return;
    const url = URL.createObjectURL(signedPdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VoiceContract_${sessionId?.toString().slice(0, 8)}_signed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-[10px] uppercase tracking-[0.5em] text-[#999]">
          Loading_Contract...
        </span>
      </div>
    );
  }

  if (error && !contractData) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-[#0A0A0A]">{error}</h1>
        <p className="text-[#666] text-center max-w-md">
          This signing link may have expired or the contract may have already been signed.
        </p>
      </div>
    );
  }

  const documents: Record<string, string> = {
    msa: contractData?.msa_text || "",
    invoice: contractData?.invoice_text || "",
    po: contractData?.po_text || "",
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E5] z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A0A0A] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight">
                VOICE<span style={{ color: contractData?.brand_accent || "#2563EB" }}>CONTRACT</span>
              </h1>
              <p className="text-[10px] font-bold text-[#999] uppercase tracking-[0.3em]">
                Secure Document Signing
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#999] uppercase tracking-widest">From</p>
            <p className="font-black text-sm">{contractData?.provider_company || "Provider"}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-black tracking-tight mb-2">
            Hello, {contractData?.client_name || "Client"}
          </h2>
          <p className="text-[#666] text-lg">
            Please review the documents below and apply your digital signature.
          </p>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-red-700 flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {signed ? (
          /* ─── SUCCESS STATE ────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="flex flex-col items-center justify-center py-20 gap-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black tracking-tight">Contract Executed</h2>
              <p className="text-[#666] text-lg max-w-md">
                Both parties have signed. The contract is now legally binding.
              </p>
            </div>
            {signedPdfBlob && (
              <button
                onClick={handleDownload}
                className="px-10 py-4 bg-[#0A0A0A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all transform active:scale-95 shadow-xl"
              >
                Download_Signed_PDF
              </button>
            )}
            <div className="mt-8 text-center">
              <p className="text-[10px] font-bold text-[#BBB] uppercase tracking-[0.3em]">
                Secured with SHA-256 Crypto Stamp • Tamper-Proof Audit Trail
              </p>
            </div>
          </motion.div>
        ) : (
          /* ─── SIGNING STATE ────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Document Viewer */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              {/* Tabs */}
              <div className="flex gap-3 mb-6">
                {(["msa", "invoice", "po"] as const)
                  .filter((t) => documents[t])
                  .map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveDoc(type)}
                      className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeDoc === type
                          ? "bg-[#0A0A0A] text-white shadow-lg"
                          : "bg-white text-[#999] border border-[#E5E5E5] hover:text-[#0A0A0A] hover:border-[#CCC]"
                      }`}
                    >
                      {type === "msa" ? "Agreement" : type === "invoice" ? "Invoice" : "Purchase Order"}
                    </button>
                  ))}
              </div>

              {/* Document */}
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-12 shadow-lg min-h-[600px]">
                <pre className="whitespace-pre-wrap font-sans text-base text-[#333] leading-relaxed">
                  {documents[activeDoc]}
                </pre>
                <div className="mt-16 pt-6 border-t border-[#E5E5E5] flex justify-between text-[10px] font-bold text-[#BBB] uppercase tracking-[0.3em]">
                  <span>VoiceContract AI</span>
                  <span>STAMP: {contractData?.crypto_stamp?.slice(0, 16)}</span>
                </div>
              </div>
            </motion.div>

            {/* Signing Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 shadow-lg space-y-6 sticky top-32">
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-1">Your Signature</h3>
                  <p className="text-sm text-[#999]">
                    Draw your signature below to execute the contract.
                  </p>
                </div>

                {/* Signature Pad */}
                <div className="h-40 bg-[#FAFAFA] border-2 border-dashed border-[#DDD] rounded-2xl relative overflow-hidden cursor-crosshair touch-none">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {signatureStrokes.length === 0 && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[#CCC] text-sm font-bold">Draw your signature here</span>
                    </div>
                  )}
                </div>

                {signatureStrokes.length > 0 && (
                  <button
                    onClick={clearSignature}
                    className="text-[10px] font-bold text-[#999] uppercase tracking-widest hover:text-[#333] transition-colors"
                  >
                    ✕ Clear Signature
                  </button>
                )}

                {/* Terms Agreement */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-[#DDD] text-[#2563EB] focus:ring-[#2563EB] mt-0.5 cursor-pointer"
                  />
                  <span className="text-xs text-[#666] leading-relaxed group-hover:text-[#333] transition-colors">
                    I have read and agree to all terms and conditions outlined in the documents above.
                    I understand this constitutes a legally binding agreement.
                  </span>
                </label>

                {/* Sign Button */}
                <button
                  onClick={handleSign}
                  disabled={isSigning || !agreedToTerms || signatureStrokes.length === 0}
                  className="w-full py-4 bg-[#0A0A0A] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-black transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSigning ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Executing_Contract...
                    </span>
                  ) : (
                    "Sign & Execute Contract"
                  )}
                </button>
              </div>

              {/* Security Info */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-xs font-bold text-green-800">Secured by VoiceContract</p>
                  <p className="text-[10px] text-green-600 mt-1">
                    SHA-256 encrypted • Biometric vector capture • Tamper-proof audit trail
                  </p>
                </div>
              </div>

              {/* Provider Signed Badge */}
              {contractData?.provider_signed && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-blue-800">Provider Signed</p>
                    <p className="text-[10px] text-blue-600 mt-1">
                      {contractData?.provider_name} from {contractData?.provider_company} has already signed this contract.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center">
        <p className="text-[10px] font-bold text-[#CCC] uppercase tracking-[0.5em]">
          Powered by VoiceContract AI • Antarik Technologies
        </p>
      </footer>
    </div>
  );
}
