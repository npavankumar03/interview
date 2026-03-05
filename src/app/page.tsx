"use client";

import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-gray-300 mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Real-time AI-powered interview assistant
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          Ace every interview with{" "}
          <span className="gradient-text">AI by your side</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up">
          ZoomMate listens to your interviewer in real-time, transcribes their questions, and
          generates smart answers in seconds. Your secret weapon for job interviews.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-600/25"
          >
            Start Free — 3 Sessions/Month
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 glass hover:bg-white/10 text-white rounded-xl font-semibold text-lg transition-all"
          >
            See How It Works
          </a>
        </div>

        <p className="mt-4 text-sm text-gray-500">No credit card required. Upgrade anytime.</p>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="glass rounded-2xl p-1 glow">
          <div className="bg-zinc-900/80 rounded-xl overflow-hidden">
            {/* Mock browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-gray-500">
                  zoommate.app/session
                </div>
              </div>
            </div>
            {/* Mock app UI */}
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-6 min-h-[400px]">
              {/* Left: Transcript */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400 font-medium">Live Transcript</span>
                </div>
                <div className="space-y-3">
                  <div className="glass rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-1">Interviewer</p>
                    <p className="text-white">
                      Can you tell me about a time you had to handle a difficult technical
                      decision under pressure?
                    </p>
                  </div>
                  <div className="glass rounded-lg p-3 opacity-60">
                    <p className="text-sm text-gray-400 mb-1">Interviewer</p>
                    <p className="text-white">
                      What was the outcome and what did you learn?
                    </p>
                  </div>
                </div>
              </div>
              {/* Right: AI Answer */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse-slow" />
                  <span className="text-sm text-gray-400 font-medium">AI Answer</span>
                </div>
                <div className="glass rounded-lg p-4 border-brand-500/30 border">
                  <p className="text-white leading-relaxed">
                    &quot;In my previous role, we faced a critical database migration with a tight
                    deadline. I had to choose between a zero-downtime approach that would take
                    longer to implement, or a maintenance-window approach that was faster but
                    would affect users...&quot;
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-brand-600/20 text-brand-400">
                      Generated in 1.2s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Start a session",
      description:
        "Open ZoomMate in a separate browser tab before your interview. Choose microphone or system audio capture.",
      icon: "🎙️",
    },
    {
      number: "02",
      title: "It listens in real-time",
      description:
        "ZoomMate transcribes the interviewer's questions as they speak. You see the words appear live on screen.",
      icon: "👂",
    },
    {
      number: "03",
      title: "Hit Enter for answers",
      description:
        "Press Enter or click the button. AI generates a smart, contextual answer in 1-2 seconds.",
      icon: "⚡",
    },
    {
      number: "04",
      title: "Answer with confidence",
      description:
        "Use the AI answer as a reference while you speak naturally. Review your session history later.",
      icon: "🎯",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          How it <span className="gradient-text">works</span>
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Four simple steps to transform your interview performance
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="glass rounded-xl p-6 hover:bg-white/[0.07] transition-all group">
              <div className="text-3xl mb-4">{step.icon}</div>
              <div className="text-sm text-brand-400 font-mono mb-2">{step.number}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Start free. Upgrade when you&apos;re ready.
        </p>

        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? "text-white" : "text-gray-500"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              annual ? "bg-brand-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                annual ? "left-7" : "left-1"
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-white" : "text-gray-500"}`}>
            Annual <span className="text-brand-400 text-xs">Save 20%</span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="glass rounded-2xl p-8">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-gray-400 text-sm mb-6">Perfect for trying it out</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {["3 sessions per month", "Real-time transcription", "AI-generated answers", "7-day session history"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                )
              )}
            </ul>
            <Link
              href="/dashboard"
              className="block text-center py-3 rounded-xl glass hover:bg-white/10 text-white font-medium transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="glass rounded-2xl p-8 border border-brand-500/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 rounded-full text-xs font-medium">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-gray-400 text-sm mb-6">For serious job seekers</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">${annual ? "10" : "12"}</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited sessions",
                "Real-time transcription",
                "Enhanced AI answers",
                "Unlimited session history",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block text-center py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all"
            >
              Start Pro Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ZoomMate. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <DemoSection />
      <HowItWorksSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
