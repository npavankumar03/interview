"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Logo } from "@/components/Logo";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  credits: number;
  created_at: string;
}

interface Stats {
  total_users: number;
  pro_users: number;
  admins: number;
  total_credits: number;
}

type Tab = "users" | "settings";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editSettings, setEditSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Grant credits modal
  const [grantModal, setGrantModal] = useState<{ userId: string; email: string } | null>(null);
  const [grantAmount, setGrantAmount] = useState("10");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session as any)?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setStats(data.stats);
    }
    setLoading(false);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin?action=settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      setEditSettings(data.settings);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.role === "admin") {
      fetchUsers();
      fetchSettings();
    }
  }, [status, session, fetchUsers, fetchSettings]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const adminAction = async (body: any) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const handleGrantCredits = async () => {
    if (!grantModal) return;
    const ok = await adminAction({
      action: "grant_credits",
      userId: grantModal.userId,
      credits: parseInt(grantAmount),
    });
    if (ok) {
      showMessage(`Granted ${grantAmount} credits to ${grantModal.email}`);
      fetchUsers();
    }
    setGrantModal(null);
  };

  const handleTogglePlan = async (user: User) => {
    const newPlan = user.plan === "pro" ? "free" : "pro";
    const ok = await adminAction({ action: "set_plan", userId: user.id, plan: newPlan });
    if (ok) {
      showMessage(`${user.email} → ${newPlan}`);
      fetchUsers();
    }
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const ok = await adminAction({ action: "set_role", userId: user.id, role: newRole });
    if (ok) {
      showMessage(`${user.email} → ${newRole}`);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    const ok = await adminAction({ action: "delete_user", userId: user.id });
    if (ok) {
      showMessage(`Deleted ${user.email}`);
      fetchUsers();
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // Only send values that changed and aren't masked
    const changed: Record<string, string> = {};
    for (const [key, value] of Object.entries(editSettings)) {
      if (value !== settings[key] && !value.startsWith("•")) {
        changed[key] = value;
      }
    }

    if (Object.keys(changed).length === 0) {
      showMessage("No changes to save");
      setSaving(false);
      return;
    }

    const ok = await adminAction({ action: "update_settings_batch", settings: changed });
    if (ok) {
      showMessage("Settings saved!");
      fetchSettings();
    } else {
      showMessage("Failed to save settings");
    }
    setSaving(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading admin panel...</div>
      </div>
    );
  }

  const settingsFields = [
    { key: "openai_api_key", label: "OpenAI API Key", type: "password", desc: "Your OpenAI API key for answer generation" },
    { key: "openai_model", label: "OpenAI Model", type: "text", desc: "e.g., gpt-4o, gpt-4o-mini, gpt-3.5-turbo" },
    { key: "deepgram_api_key", label: "Deepgram API Key", type: "password", desc: "For real-time speech-to-text" },
    { key: "stripe_secret_key", label: "Stripe Secret Key", type: "password", desc: "For payment processing" },
    { key: "stripe_publishable_key", label: "Stripe Publishable Key", type: "password", desc: "Public key for Stripe checkout" },
    { key: "stripe_webhook_secret", label: "Stripe Webhook Secret", type: "password", desc: "For verifying Stripe webhooks" },
    { key: "stripe_pro_price_id", label: "Stripe Pro Price ID", type: "text", desc: "The Price ID for the Pro plan" },
    { key: "free_credits", label: "Default Free Credits", type: "number", desc: "Credits given to new free users" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm text-gray-400 transition-all"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Success message */}
      {message && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm animate-fade-in">
          {message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4">
              <div className="text-sm text-gray-400">Total Users</div>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-sm text-gray-400">Pro Users</div>
              <div className="text-2xl font-bold">{stats.pro_users}</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-sm text-gray-400">Admins</div>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-sm text-gray-400">Total Credits</div>
              <div className="text-2xl font-bold">{Number(stats.total_credits).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 glass rounded-lg w-fit">
          {(["users", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                tab === t ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "users" ? "Users & Credits" : "API Keys & Settings"}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">User</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Role</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Plan</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Credits</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Joined</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">{user.name || "—"}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleRole(user)}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-zinc-700/50 text-gray-400"
                          }`}
                        >
                          {user.role}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePlan(user)}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            user.plan === "pro"
                              ? "bg-brand-600/20 text-brand-400"
                              : "bg-zinc-700/50 text-gray-400"
                          }`}
                        >
                          {user.plan}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white font-mono">{user.credits}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setGrantModal({ userId: user.id, email: user.email })}
                            className="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-400 text-xs font-medium hover:bg-brand-600/30 transition-all"
                          >
                            Grant Credits
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="glass rounded-xl p-6">
            <div className="space-y-6">
              {settingsFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{field.desc}</p>
                  <input
                    type={field.type}
                    value={editSettings[field.key] || ""}
                    onChange={(e) =>
                      setEditSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono text-sm"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save All Settings"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  API keys are encrypted in the database. Masked values (••••) won&apos;t be overwritten unless you enter a new value.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grant Credits Modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-1">Grant Credits</h3>
            <p className="text-sm text-gray-400 mb-4">
              Add credits to <span className="text-white">{grantModal.email}</span>
            </p>
            <input
              type="number"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              min="1"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 mb-4 text-lg font-mono"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleGrantCredits}
                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all"
              >
                Grant {grantAmount} Credits
              </button>
              <button
                onClick={() => setGrantModal(null)}
                className="px-6 py-3 rounded-xl glass hover:bg-white/10 text-gray-400 font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
