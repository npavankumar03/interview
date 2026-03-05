"use client";

import { useState, useRef, useCallback } from "react";

export interface TranscriptEntry {
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface UseTranscriptionReturn {
  transcript: TranscriptEntry[];
  currentText: string;
  isTranscribing: boolean;
  startTranscription: (stream: MediaStream) => void;
  stopTranscription: () => void;
  clearTranscript: () => void;
}

export function useTranscription(): UseTranscriptionReturn {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startTranscription = useCallback((stream: MediaStream) => {
    // Connect to our API which proxies to Deepgram
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/transcribe`;

    // For development, we'll use a direct approach with MediaRecorder
    // sending audio chunks to our REST API endpoint
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: getSupportedMimeType(),
    });
    mediaRecorderRef.current = mediaRecorder;

    // Collect audio data and send periodically
    let audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Every 2 seconds, send accumulated audio for transcription
    const intervalId = setInterval(async () => {
      if (audioChunks.length === 0) return;

      const audioBlob = new Blob(audioChunks, { type: getSupportedMimeType() });
      audioChunks = [];

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text && data.text.trim()) {
            setTranscript((prev) => [
              ...prev,
              {
                text: data.text.trim(),
                timestamp: Date.now(),
                isFinal: true,
              },
            ]);
            setCurrentText(data.text.trim());
          }
        }
      } catch (err) {
        console.error("Transcription error:", err);
      }
    }, 2000);

    mediaRecorder.onstop = () => {
      clearInterval(intervalId);
    };

    mediaRecorder.start(1000); // Collect data every second
    setIsTranscribing(true);

    // Store interval ID for cleanup
    (mediaRecorder as any)._intervalId = intervalId;
  }, []);

  const stopTranscription = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const intervalId = (mediaRecorderRef.current as any)._intervalId;
      if (intervalId) clearInterval(intervalId);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsTranscribing(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setCurrentText("");
  }, []);

  return {
    transcript,
    currentText,
    isTranscribing,
    startTranscription,
    stopTranscription,
    clearTranscript,
  };
}

function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm";
}
