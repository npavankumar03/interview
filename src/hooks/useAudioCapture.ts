"use client";

import { useState, useRef, useCallback } from "react";

export type AudioSource = "mic" | "system";

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  audioSource: AudioSource | null;
  error: string | null;
  startCapture: (source: AudioSource) => Promise<MediaStream | null>;
  stopCapture: () => void;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = useCallback(async (source: AudioSource): Promise<MediaStream | null> => {
    setError(null);

    try {
      let stream: MediaStream;

      if (source === "mic") {
        // Microphone capture - straightforward
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
      } else {
        // System audio capture via screen share
        // This prompts the user to share a tab/window/screen WITH audio
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true, // Required by browsers, but we only use the audio track
        });

        // Verify we got audio tracks
        if (stream.getAudioTracks().length === 0) {
          throw new Error(
            "No audio detected. When sharing your screen, make sure to check 'Share audio' at the bottom of the dialog."
          );
        }

        // Stop video tracks immediately — we don't need them
        stream.getVideoTracks().forEach((track) => track.stop());
      }

      streamRef.current = stream;
      setIsCapturing(true);
      setAudioSource(source);

      // Listen for track ending (user stops sharing)
      stream.getAudioTracks()[0]?.addEventListener("ended", () => {
        setIsCapturing(false);
        setAudioSource(null);
        streamRef.current = null;
      });

      return stream;
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Permission denied. Please allow audio access and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No audio device found. Please check your microphone settings.");
      } else {
        setError(err.message || "Failed to capture audio. Please try again.");
      }
      setIsCapturing(false);
      return null;
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setAudioSource(null);
  }, []);

  return { isCapturing, audioSource, error, startCapture, stopCapture };
}
