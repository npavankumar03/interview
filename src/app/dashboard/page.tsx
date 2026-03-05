"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

interface SessionHistory {
  id: string;
  title: string;
  created_at: string;
  duration_seconds: number;
  audio_source: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setCredits(data.credits || 0);
      }
    } catch {
      // Will be empty on first load
    } finally {
      setLoading(false);
    }
  };

  const plan = (session as any)?.plan || "free";
  const role = (session as any)?.role || "user";
  const userCredits = (session as any)?.credits ?? credits;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {session?.user?.name || session?.user?.email}
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              plan === "pro"
                ? "bg-brand-600/20 text-brand-400"
                : "bg-zinc-700/50 text-gray-400"
            }`}
          >
            {plan === "pro" ? "Pro" : "Free"}
          </div>
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              Admin
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-400">Ready for your next interview?</p>
        </div>

        {/* Start Session Card */}
        <div className="glass rounded-2xl p-8 mb-8 glow border border-brand-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Start New Session</h2>
              <p className="text-gray-400 text-sm">
                Open this before your interview. ZoomMate will listen and help you answer.
              </p>
            </div>
            <button
              onClick={() => router.push("/session")}
              disabled={userCredits <= 0}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
            >
              {userCredits <= 0 ? "No Credits — Contact Admin" : "Start Session"}
            </button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="glass rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-1">Credits Remaining</div>
            <div className="text-2xl font-bold font-mono">
              {userCredits >= 999999 ? "Unlimited" : userCredits}
            </div>
            <p className="text-xs text-gray-500 mt-1">1 credit = 1 AI answer</p>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-1">Plan</div>
            <div className="text-2xl font-bold capitalize">{plan}</div>
            {plan === "free" && (
              <button
                onClick={() => router.push("/#pricing")}
                className="text-sm text-brand-400 hover:text-brand-300 mt-1 transition-colors"
              >
                Upgrade to Pro →
              </button>
            )}
          </div>
          <div className="glass rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-1">Total Sessions</div>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </div>
        </div>

        {/* Session History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
          {loading ? (
            <div className="text-gray-500 text-sm animate-pulse">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-gray-400 mb-1">No sessions yet</p>
              <p className="text-sm text-gray-500">
                Start your first session to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="glass rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.07] transition-all cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-white">{s.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(s.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {formatDuration(s.duration_seconds)}
                      {" · "}
                      {s.audio_source === "system" ? "System Audio" : "Microphone"}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
