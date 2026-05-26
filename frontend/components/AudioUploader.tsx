"use client";

import { useState, useCallback } from "react";
import { UploadCloud, FileAudio, X } from "lucide-react";
import { Button } from "./ui/button";

interface AudioUploaderProps {
  onProcess: (file: File) => void;
}

const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "video/mp4"];

export function AudioUploader({ onProcess }: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
      setError("Only MP3, WAV, M4A, and MP4 files are accepted.");
      return;
    }
    if (selectedFile.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 25MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      setIsProcessing(true);
      onProcess(file);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center min-h-[240px] ${
          dragActive ? "border-brand-green bg-brand-green/5" : "border-border bg-card"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="audio-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".mp3,.wav,.m4a,.mp4,audio/*"
        />

        {file ? (
          <div className="flex flex-col items-center text-center space-y-3 z-10 pointer-events-none">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <FileAudio className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium truncate max-w-[200px]">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-muted-foreground hover:text-destructive pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                setFile(null);
              }}
            >
              <X className="h-4 w-4 mr-2" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 z-10 pointer-events-none">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Drop your meeting recording here</p>
              <p className="text-sm text-muted-foreground mt-1">Accepts MP3, WAV, M4A up to 25MB</p>
            </div>
            <Button variant="secondary" className="pointer-events-auto">Browse Files</Button>
          </div>
        )}
      </div>

      {error && <p className="text-destructive text-sm text-center font-medium">{error}</p>}

      <Button
        className="w-full font-semibold text-lg h-12"
        size="lg"
        disabled={!file || isProcessing}
        onClick={handleSubmit}
      >
        {isProcessing ? "Processing Meeting..." : "Process Meeting"}
      </Button>
    </div>
  );
}
