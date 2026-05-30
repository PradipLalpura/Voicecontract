"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceAssistantOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const sendToLex = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setAgentResponse("");
    try {
      const host = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST || "localhost:8000";
      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      const res = await fetch(`${protocol}//${host}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAgentResponse(data.reply);
        speakResponse(data.reply);
      } else {
        setAgentResponse("I'm having trouble connecting to the legal grid. Please try again.");
      }
    } catch (error) {
      setAgentResponse("Neural link disrupted. Check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript) sendToLex(transcript);
    } else {
      setTranscript("");
      setAgentResponse("");
      window.speechSynthesis.cancel();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch(e) {
        console.error(e);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendToLex(textInput);
      setTextInput("");
    }
  };

  // Audio Waveform Animation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      const centerY = canvas.height / 2;
      for (let i = 0; i < canvas.width; i++) {
        const baseAmplitude = isListening ? 25 : (isProcessing ? 10 : (agentResponse ? 15 : 2));
        const noise = (isListening || isProcessing) ? Math.random() * 8 : 0;
        const amplitude = Math.sin(i * 0.05 + phase) * baseAmplitude + noise;
        if (i === 0) ctx.moveTo(i, centerY + amplitude);
        else ctx.lineTo(i, centerY + amplitude);
      }
      ctx.strokeStyle = isListening ? "#ef4444" : (isProcessing ? "#fbbf24" : "#2563EB"); 
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      phase += 0.12;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, isListening, isProcessing, agentResponse]);

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
            className="mb-8 w-96 bg-white/80 backdrop-blur-3xl border border-border shadow-2xl rounded-[40px] overflow-hidden flex flex-col border-white/40"
          >
            <div className="p-8 pb-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Lex_Nexus_v1.0</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-text-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="min-h-[120px] flex flex-col justify-end mb-6">
                {isProcessing ? (
                  <div className="flex gap-2 items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-.5s]" />
                  </div>
                ) : agentResponse ? (
                  <p className="text-lg font-bold text-text leading-snug">{agentResponse}</p>
                ) : transcript ? (
                  <p className="text-lg text-text-muted font-medium italic">"{transcript}"</p>
                ) : (
                  <p className="text-lg text-text-muted font-medium">I'm Lex. Ask me anything about VoiceContract, legal drafting, or meeting interceptions.</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-8 bg-slate-50/50 border-t border-border flex flex-col gap-6">
               <div className="h-12 relative flex items-center justify-center">
                  <canvas ref={canvasRef} width={384} height={48} className="absolute inset-0 opacity-40" />
               </div>

               <div className="flex gap-4 items-center">
                  <form onSubmit={handleTextSubmit} className="flex-1 relative">
                    <input 
                      type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-white border border-border rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm pr-12"
                    />
                    <button type="submit" className="absolute right-2 top-1.5 p-2 text-primary hover:bg-primary/5 rounded-xl transition-colors">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </form>
                  
                  <div className="w-px h-8 bg-border" />
                  
                  <button 
                    onClick={handleToggleListen}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                      isListening ? 'bg-red-500 text-white shadow-red-200' : 'bg-primary text-white shadow-blue-200'
                    }`}
                  >
                    {isListening ? (
                      <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    )}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-text text-white rounded-[24px] shadow-2xl flex items-center justify-center relative group overflow-hidden border-2 border-white"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <svg className="w-8 h-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>
    </div>
  );
}
