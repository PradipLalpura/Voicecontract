"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SuccessHandshake from "@/components/animations/SuccessHandshake";
import { useAuth } from "@clerk/nextjs";

type DocType = "msa" | "invoice" | "po";

/* ── Signature point for vector extraction ── */
interface SigPoint {
  x: number;
  y: number;
  t: number;
}

export default function DocumentVault() {
  const { session_id } = useParams();
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id;
  const router = useRouter();
  const { getToken } = useAuth();

  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST
    ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}`
    : "http://localhost:8000";

  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [providerSigned, setProviderSigned] = useState(false);
  const [clientLinkSent, setClientLinkSent] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocType>("msa");
  const [error, setError] = useState("");
  const [trackingId, setTrackingId] = useState("");

  /* ── Document content ── */
  const [msaContent, setMsaContent] = useState("");
  const [invoiceContent, setInvoiceContent] = useState("");
  const [poContent, setPoContent] = useState("");
  const [cryptoStamp, setCryptoStamp] = useState("");
  const [dealData, setDealData] = useState<any>(null);

  /* ── Signature ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureStrokes, setSignatureStrokes] = useState<SigPoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<SigPoint[]>([]);
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);

  /* ── Fetch real documents from backend ── */
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const token = hasClerk ? await getToken() : "dev_token";
        const res = await fetch(`${apiUrl}/api/dashboard/deals/${sessionId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const deal = await res.json();

        setMsaContent(deal.msa_text || "Document pending generation...");
        setInvoiceContent(deal.invoice_text || "Invoice pending generation...");
        setPoContent(deal.po_text || "Purchase Order pending generation...");
        setCryptoStamp(deal.crypto_stamp || "UNVERIFIED");
        setDealData(deal);
      } catch (err: any) {
        console.error("Failed to load documents:", err);
        setError("Could not load documents. Using fallback data.");
        setMsaContent(
          "MASTER SERVICE AGREEMENT\n\nThis agreement is made between the Provider and Client.\n\n1. SCOPE: As discussed during the recorded meeting.\n2. CONSIDERATION: As agreed.\n3. TIMELINE: As agreed.\n4. IP: Transfers on full payment."
        );
        setInvoiceContent("TAX INVOICE\n\nInvoice pending generation from pipeline.");
        setPoContent("PURCHASE ORDER\n\nPO pending generation from pipeline.");
        setCryptoStamp("FALLBACK");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) fetchDocuments();
  }, [sessionId, apiUrl, hasClerk, getToken]);

  const documents: Record<DocType, string> = {
    msa: msaContent,
    invoice: invoiceContent,
    po: poContent,
  };

  /* ── Canvas drawing with vector extraction (Task 3) ── */
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

  /* ── Task 3: Send signature to backend ── */
  const handleProviderSign = useCallback(async () => {
    if (signatureStrokes.length === 0) {
      setError("Please sign the document first.");
      return;
    }

    setIsSigning(true);
    setError("");

    try {
      const token = hasClerk ? await getToken() : "dev_token";

      // Convert to backend format: List[Stroke] where Stroke = { points: List[Point] }
      const strokes = signatureStrokes.map((stroke) => ({
        points: stroke.map((p) => ({ x: p.x, y: p.y, t: p.t })),
      }));

      const res = await fetch(`${apiUrl}/api/signature/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          strokes,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Signature execution failed" }));
        throw new Error(errBody.detail || `HTTP ${res.status}`);
      }

      // Response is a PDF blob
      const blob = await res.blob();
      setSignedPdfBlob(blob);
      setProviderSigned(true);
    } catch (err: any) {
      console.error("Signature execution failed:", err);
      setError(err.message || "Signature execution failed. Please try again.");
    } finally {
      setIsSigning(false);
    }
  }, [signatureStrokes, apiUrl, hasClerk, getToken, sessionId]);

  /* ── Task 4: Real PDF download ── */
  const handleDownload = useCallback(() => {
    if (!signedPdfBlob) {
      // Fallback: print
      window.print();
      return;
    }

    const url = URL.createObjectURL(signedPdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VoiceContract_${sessionId}_signed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [signedPdfBlob, sessionId]);

  /* ── Task 5: Wire dispatch to client ── */
  const handleDispatchToClient = useCallback(async () => {
    setIsDispatching(true);
    setError("");

    try {
      const token = hasClerk ? await getToken() : "dev_token";
      const res = await fetch(`${apiUrl}/api/dispatch/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          channels: {
            email: dealData?.client_email || "",
            whatsapp: dealData?.client_whatsapp || "",
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Dispatch failed" }));
        throw new Error(errBody.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTrackingId(data.tracking_id || "");
      setClientLinkSent(true);
    } catch (err: any) {
      console.error("Dispatch failed:", err);
      setError(err.message || "Failed to dispatch documents.");
    } finally {
      setIsDispatching(false);
    }
  }, [apiUrl, hasClerk, getToken, sessionId, dealData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-[10px] uppercase tracking-[0.5em] text-text-muted">
          Extracting_Legal_Nexus...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans p-8 md:p-16 flex flex-col items-center premium-noise overflow-y-auto">
      <div className="w-full max-w-6xl space-y-12 z-10">
        {/* Vault Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-10 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
              Legal_Trinity_v2.0
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">
              Document_Vault
            </h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              className="px-6 py-3 border border-border rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {signedPdfBlob ? "Download_Signed_PDF" : "Local_Download"}
            </button>
          </div>
        </div>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
            >
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700 font-bold">{error}</p>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Selection */}
        <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {(["msa", "invoice", "po"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveDoc(type)}
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                activeDoc === type
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {type === "msa" ? "Master_Agreement" : type === "invoice" ? "GST_Invoice" : "Purchase_Order"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Document Viewer */}
          <div className="lg:col-span-2">
            <motion.div
              key={activeDoc}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-[40px] p-16 shadow-2xl relative overflow-hidden min-h-[800px]"
            >
              <div className="absolute inset-0 bg-[url('/paper.svg')] opacity-20 pointer-events-none mix-blend-multiply" />

              <div className="relative z-10">
                <div 
                  className="whitespace-pre-wrap font-sans text-lg text-text leading-relaxed tracking-tight bg-transparent rich-text-contract"
                  dangerouslySetInnerHTML={{ __html: documents[activeDoc] }}
                />

                <div className="mt-32 pt-10 border-t-2 border-slate-100 flex justify-between items-center text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">
                  <span>Auth: VoiceContract_AI</span>
                  <span>STAMP: {cryptoStamp?.slice(0, 16)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Execution Sidebar */}
          <aside className="space-y-8">
            {!providerSigned ? (
              <div className="bg-surface border border-border rounded-[40px] p-10 shadow-xl space-y-10 sticky top-32">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight uppercase italic leading-none">
                    Provider_Pad
                  </h3>
                  <p className="text-sm font-medium text-text-muted leading-relaxed">
                    Apply your digital mark. The biometric vector will lock the PDF and vanish from memory.
                  </p>
                </div>

                <div className="h-48 bg-background border border-border rounded-[32px] relative shadow-inner overflow-hidden cursor-crosshair">
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
                  {signatureStrokes.length === 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-text-muted opacity-20 pointer-events-none uppercase tracking-[0.5em]">
                      Sign_Here
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleProviderSign}
                    disabled={isSigning}
                    className="w-full py-5 bg-text text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-apple hover:bg-black transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {isSigning ? "Encrypting_Vector..." : "Apply_Provider_Seal"}
                  </button>
                  {signatureStrokes.length > 0 && (
                    <button
                      onClick={clearSignature}
                      className="w-full py-3 text-text-muted font-bold text-[10px] uppercase tracking-widest hover:text-text transition-colors"
                    >
                      Clear_Signature
                    </button>
                  )}
                </div>
              </div>
            ) : !clientLinkSent ? (
              <div className="bg-surface border border-border rounded-[40px] p-10 shadow-xl space-y-8 sticky top-32">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Seal_Applied
                  </h3>
                  <p className="text-text-muted font-bold text-xs leading-relaxed uppercase tracking-widest">
                    Your vector is locked.<br />Send to client for counter-signature.
                  </p>
                </div>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/client-sign/${sessionId}`;
                    navigator.clipboard.writeText(link);
                    setError(""); // Clear any previous error
                    alert("Signing link copied to clipboard!");
                  }}
                  className="w-full py-4 bg-background border-2 border-border rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-surface-muted transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  Copy_Signing_Link
                </button>

                <div className="space-y-3 pt-4 border-t border-border">
                  {/* Email */}
                  <button
                    onClick={async () => {
                      setIsDispatching(true);
                      setError("");
                      try {
                        const token = hasClerk ? await getToken() : "dev_token";
                        const signingLink = `${window.location.origin}/client-sign/${sessionId}`;
                        const res = await fetch(`${apiUrl}/api/dispatch/send`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({
                            session_id: sessionId,
                            channels: { email: dealData?.client_email || "", whatsapp: "" },
                            client_name: dealData?.client_name || "",
                            signing_link: signingLink,
                          }),
                        });
                        if (!res.ok) throw new Error("Email dispatch failed");
                        const data = await res.json();
                        setTrackingId(data.tracking_id || "");
                        setClientLinkSent(true);
                      } catch (err: any) {
                        setError(err.message || "Failed to send email");
                      } finally {
                        setIsDispatching(false);
                      }
                    }}
                    disabled={isDispatching || !dealData?.client_email}
                    className="w-full py-4 bg-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {isDispatching ? "Sending..." : "Send_via_Email"}
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={async () => {
                      const signingLink = `${window.location.origin}/client-sign/${sessionId}`;
                      const phone = (dealData?.client_whatsapp || "").replace(/[+\s-]/g, "");
                      const message = `Your contract is ready for signature. Review and sign here: ${signingLink}`;
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
                    }}
                    disabled={!dealData?.client_whatsapp}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-green-700 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.212l-.29-.182-3.055.908.866-3.055-.198-.298A8 8 0 1112 20z"/></svg>
                    Send_via_WhatsApp
                  </button>

                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
                    <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] font-bold text-blue-600 leading-tight uppercase">
                      Client will receive a secure one-time signing link.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10 sticky top-32 flex flex-col items-center">
                <SuccessHandshake
                  onDownload={handleDownload}
                  onReturn={() => router.push("/dashboard")}
                  trackingId={trackingId}
                />
              </div>
            )}
          </aside>
        </div>
      </div>

      <footer className="mt-32 opacity-20 hover:opacity-50 transition-opacity">
        <span className="font-black text-[10px] tracking-[0.8em] uppercase text-text">
          Antarik // Genesis_01
        </span>
      </footer>
    </div>
  );
}
