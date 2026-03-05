"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useAudioCapture, AudioSource } from "@/hooks/useAudioCapture";
import { useTranscription, TranscriptEntry } from "@/hooks/useTranscription";

interface Answer {
  question: string;
  answer: string;
  timestamp: number;
  generationTime: number;
}

export default function SessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedSource, setSelectedSource] = useState<AudioSource>("mic");
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const answersEndRef = useRef<HTMLDivElement>(null);

  const { isCapturing, error: audioError, startCapture, stopCapture } = useAudioCapture();
  const {
    transcript,
    isTranscribing,
    startTranscription,
    stopTranscription,
    clearTranscript,
  } = useTranscription();

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Session timer
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Auto-scroll answers
  useEffect(() => {
    answersEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answers]);

  const handleStartSession = async () => {
    const stream = await startCapture(selectedSource);
    if (stream) {
      startTranscription(stream);
      setSessionStarted(true);
    }
  };

  const handleEndSession = () => {
    stopTranscription();
    stopCapture();
    setSessionStarted(false);
  };

  const handleGenerateAnswer = useCallback(async () => {
    if (isGenerating || transcript.length === 0) return;

    // Get the most recent transcript entries as the question
    const recentEntries = transcript.slice(-3);
    const question = recentEntries.map((e) => e.text).join(" ");

    // Build context from earlier transcript
    const context = transcript
      .slice(0, -3)
      .map((e) => e.text)
      .join(" ");

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate answer");
      }

      const data = await response.json();
      const generationTime = (Date.now() - startTime) / 1000;

      setAnswers((prev) => [
        ...prev,
        {
          question,
          answer: data.answer,
          timestamp: Date.now(),
          generationTime,
        },
      ]);
    } catch (err: any) {
      setAnswers((prev) => [
        ...prev,
        {
          question,
          answer: `Error: ${err.message}`,
          timestamp: Date.now(),
          generationTime: 0,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, transcript]);

  // Handle Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && sessionStarted) {
        e.preventDefault();
        handleGenerateAnswer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionStarted, handleGenerateAnswer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          {sessionStarted && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">Recording</span>
              </div>
              <span className="text-sm text-gray-500 font-mono">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {sessionStarted && (
            <button
              onClick={handleEndSession}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-all"
            >
              End Session
            </button>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm text-gray-400 transition-all"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      {!sessionStarted ? (
        /* Pre-session: Audio source selection */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <h1 className="text-3xl font-bold text-center mb-2">Start a Session</h1>
            <p className="text-gray-400 text-center mb-8">
              Choose how ZoomMate should capture audio
            </p>

            {audioError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {audioError}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <button
                onClick={() => setSelectedSource("mic")}
                className={`w-full p-5 rounded-xl border text-left transition-all ${
                  selectedSource === "mic"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-white/10 glass hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">🎙️</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Microphone</h3>
                    <p className="text-sm text-gray-400">
                      Uses your mic to pick up the interviewer&apos;s voice. Best for in-person
                      interviews or when audio comes through speakers.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedSource("system")}
                className={`w-full p-5 rounded-xl border text-left transition-all ${
                  selectedSource === "system"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-white/10 glass hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">🖥️</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">System Audio</h3>
                    <p className="text-sm text-gray-400">
                      Captures audio directly from your Zoom/Teams/Meet call. Best quality for
                      virtual interviews. You&apos;ll need to share your screen with audio.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={handleStartSession}
              className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-lg transition-all hover:scale-[1.02]"
            >
              Start Listening
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400">Enter</kbd>{" "}
              at any time to generate an answer
            </p>
          </div>
        </div>
      ) : (
        /* Active session: Transcript + Answers */
        <div className="flex-1 grid md:grid-cols-2 gap-0 md:gap-1 overflow-hidden">
          {/* Left: Live Transcript */}
          <div className="flex flex-col border-r border-white/5">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-300">Live Transcript</span>
              </div>
              <span className="text-xs text-gray-500">{transcript.length} entries</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {transcript.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <div className="text-center">
                    <div className="text-3xl mb-3">👂</div>
                    <p>Listening for speech...</p>
                    <p className="text-xs mt-1 text-gray-600">
                      Make sure your interviewer is speaking
                    </p>
                  </div>
                </div>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="glass rounded-lg p-3 animate-fade-in">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{entry.text}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Right: AI Answers */}
          <div className="flex flex-col">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse-slow" />
                <span className="text-sm font-medium text-gray-300">AI Answers</span>
              </div>
              <span className="text-xs text-gray-500">{answers.length} answers</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {answers.length === 0 && !isGenerating ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <div className="text-center">
                    <div className="text-3xl mb-3">⚡</div>
                    <p>Press Enter to generate an answer</p>
                    <p className="text-xs mt-1 text-gray-600">
                      Based on the latest transcript
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {answers.map((a, i) => (
                    <div
                      key={i}
                      className="glass rounded-lg p-4 border border-brand-500/20 animate-slide-up"
                    >
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                        <span>Q: {a.question.slice(0, 80)}...</span>
                        <span className="px-2 py-0.5 rounded bg-brand-600/20 text-brand-400">
                          {a.generationTime.toFixed(1)}s
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {a.answer}
                      </p>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="glass rounded-lg p-4 border border-brand-500/20 animate-pulse">
                      <div className="flex items-center gap-2 text-brand-400 text-sm">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Generating answer...
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={answersEndRef} />
            </div>

            {/* Generate button */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={handleGenerateAnswer}
                disabled={isGenerating || transcript.length === 0}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Answer
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs text-gray-300">
                      Enter
                    </kbd>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
