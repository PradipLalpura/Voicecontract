"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

export default function VoiceAssistantOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const isSpeechSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (isSpeechSupported) {
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
  }, [isSpeechSupported]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, transcript]);

  const sendToAmigo = async (text: string, isRetry = false) => {
    if (!text.trim()) return;
    
    // Add user message if not a retry
    const newMessages = isRetry ? messages : [...messages, { role: "user" as const, content: text }];
    if (!isRetry) {
      setMessages(newMessages);
    }
    
    setIsLoading(true);
    
    try {
      const host = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST 
        ? process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")
        : "localhost:8000";
      const apiUrl = `http://${host}`;
      
      const token = hasClerk ? await getToken() : "dev_token";

      const res = await fetch(`${apiUrl}/api/assistant/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: newMessages })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: "assistant" as const, content: data.reply }]);
      } else {
        throw new Error("API returned non-OK status");
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (!isRetry) {
        // Auto-retry once after 2 seconds
        setTimeout(() => sendToAmigo(text, true), 2000);
      } else {
        setMessages([...newMessages, { role: "error", content: "Neural link disrupted. Could not reach the server. Please try again later." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleListen = () => {
    if (!isSpeechSupported) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript) sendToAmigo(transcript);
      setTranscript("");
    } else {
      setTranscript("");
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
    if (textInput.trim() && !isLoading) {
      sendToAmigo(textInput);
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
        const baseAmplitude = isListening ? 25 : (isLoading ? 10 : 2);
        const noise = (isListening || isLoading) ? Math.random() * 8 : 0;
        const amplitude = Math.sin(i * 0.05 + phase) * baseAmplitude + noise;
        if (i === 0) ctx.moveTo(i, centerY + amplitude);
        else ctx.lineTo(i, centerY + amplitude);
      }
      ctx.strokeStyle = isListening ? "#ef4444" : (isLoading ? "#fbbf24" : "#2563EB"); 
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      phase += 0.12;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, isListening, isLoading]);

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
            className="mb-8 w-96 max-w-[calc(100vw-40px)] bg-white/95 backdrop-blur-3xl border border-border shadow-2xl rounded-[32px] overflow-hidden flex flex-col border-white/40"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border bg-white/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Amigo_Nexus_v1.0</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-text-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="h-80 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">Hello, I'm Amigo</h3>
                  <p className="text-sm text-text-muted">Ask me anything about VoiceContract, legal drafting, or meeting interceptions.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-primary text-white rounded-br-sm" : 
                      msg.role === "error" ? "bg-red-50 text-red-600 border border-red-200" :
                      "bg-slate-100 text-text rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              
              {transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed bg-primary/80 text-white italic">
                    "{transcript}"
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-4 flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-.15s]" />
                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-.3s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Controls */}
            <div className="p-6 bg-slate-50 border-t border-border flex flex-col gap-4">
               <div className="h-8 relative flex items-center justify-center">
                  <canvas ref={canvasRef} width={300} height={32} className="absolute inset-0 opacity-40" />
               </div>

               <div className="flex gap-3 items-center">
                  <form onSubmit={handleTextSubmit} className="flex-1 relative">
                    <input 
                      type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                      placeholder="Type a message..."
                      disabled={isLoading}
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm pr-10 disabled:opacity-50"
                    />
                    <button type="submit" disabled={isLoading || !textInput.trim()} className="absolute right-1 top-1 p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </form>
                  
                  {isSpeechSupported ? (
                    <button 
                      onClick={handleToggleListen}
                      className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-90 ${
                        isListening ? 'bg-red-500 text-white shadow-red-200' : 'bg-primary text-white shadow-blue-200'
                      }`}
                    >
                      {isListening ? (
                        <div className="w-3 h-3 bg-white rounded-sm animate-pulse" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] text-text-muted italic max-w-[60px] text-center leading-tight">Voice needs Chrome</span>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-text text-white rounded-[20px] shadow-2xl flex items-center justify-center relative group overflow-hidden border-2 border-white transition-colors duration-300 ${isOpen ? 'bg-primary' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
