"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceAssistantOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
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
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If we have a transcript, send it to Lex
        if (transcript) {
          sendToLex(transcript);
        }
      };
    }
  }, [transcript]);

  const sendToLex = async (text: string) => {
    setAgentResponse("Processing your request...");
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
        setAgentResponse("Lex is currently offline. Please try again later.");
      }
    } catch (error) {
      setAgentResponse("Network error connecting to Lex.");
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang === 'en-US' && v.name.includes('Google')) || null;
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
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

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript("");
      setAgentResponse("");
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      try { recognitionRef.current?.stop(); } catch(e) {}
    }
  }, [isOpen]);

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
        const baseAmplitude = isListening ? 20 : (agentResponse ? 15 : 2);
        const noise = isListening ? Math.random() * 5 : 0;
        const amplitude = Math.sin(i * 0.05 + phase) * baseAmplitude + noise;
        
        if (i === 0) ctx.moveTo(i, centerY + amplitude);
        else ctx.lineTo(i, centerY + amplitude);
      }
      
      ctx.strokeStyle = isListening ? "#ef4444" : "#2563EB"; 
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      phase += 0.1;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, isListening, agentResponse]);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-6 w-80 bg-surface/90 backdrop-blur-2xl border border-border shadow-apple-lg rounded-3xl overflow-hidden flex flex-col"
          >
            <div className="p-6 pb-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Lex // AI Assistant</span>
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="min-h-[80px] flex flex-col justify-end">
                {agentResponse ? (
                  <p className="text-sm font-medium text-text leading-relaxed">{agentResponse}</p>
                ) : transcript ? (
                  <p className="text-sm text-text-muted italic">"{transcript}"</p>
                ) : (
                  <p className="text-sm text-text-muted">Hi, I'm Lex. Tap the mic and ask me anything about VoiceContract or legal compliance.</p>
                )}
              </div>
            </div>

            <div className="h-24 bg-background border-t border-border relative flex items-center justify-center">
              <canvas ref={canvasRef} width={320} height={96} className="absolute inset-0 opacity-50" />
              
              <button 
                onClick={handleToggleListen}
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
                  isListening ? 'bg-red-50 text-red-500' : 'bg-surface border border-border text-primary'
                }`}
              >
                {isListening ? (
                  <div className="w-4 h-4 bg-red-500 rounded-sm animate-pulse" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-text text-surface rounded-full shadow-apple-lg flex items-center justify-center relative group"
      >
        <div className="absolute inset-0 rounded-full bg-text blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
        <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>
    </div>
  );
}
