"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { THEMES } from "@/engine/themes";
import { cardUrl } from "@/lib/utils";
import type { ThemeId } from "@/lib/types";

interface AdminCard {
  id: string;
  sender_name: string;
  recipient_name: string;
  template_id: string;
  views: number;
  photoCount: number;
  created_at: string;
}

interface StatsResponse {
  cards: AdminCard[];
  stats: {
    totalCards: number;
    totalViews: number;
  };
}

export default function AdminPage() {
  const [pass, setPass] = useState("");
  const [sessionPass, setSessionPass] = useState<string | null>(null);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchStats = useCallback(async (p: string): Promise<StatsResponse | null> => {
    const res = await fetch("/api/admin/stats", { headers: { "x-admin-pass": p } });
    if (res.status === 401) {
      setError("Wrong passphrase");
      return null;
    }
    if (!res.ok) {
      setError(`Server error (${res.status})`);
      return null;
    }
    const json = (await res.json()) as StatsResponse;
    setData(json);
    return json;
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await fetchStats(pass);
      if (result) setSessionPass(pass);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefetch = async () => {
    if (!sessionPass) return;
    setError("");
    setLoading(true);
    try {
      await fetchStats(sessionPass);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!sessionPass || deletingId) return;
    if (!window.confirm(`Delete card "${id}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-pass": sessionPass },
      });
      if (!res.ok) {
        setError(`Delete failed (${res.status})`);
        return;
      }
      setData((prev) => (prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== id) } : prev));
      setToast("Card deleted");
    } catch {
      setError("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(cardUrl(id));
      setToast("Link copied");
    } catch {
      setError("Couldn't copy link");
    }
  };

  const handleLogout = () => {
    setSessionPass(null);
    setPass("");
    setData(null);
    setError("");
  };

  if (!sessionPass) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-3xl">
              🛡️
            </div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-zinc-400">Enter the admin passphrase to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Passphrase"
              autoFocus
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/60"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !pass}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Checking…" : "Unlock"}
            </button>
          </form>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-4 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            ← Back to app
          </button>
        </motion.div>
      </div>
    );
  }

  const stats = data?.stats ?? { totalCards: 0, totalViews: 0 };

  return (
    <div className="min-h-dvh bg-zinc-950 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">🛡️ Admin Dashboard</h1>
              <p className="mt-1 text-sm text-zinc-400">Manage and monitor RakhiVishesh cards</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefetch}
                disabled={loading}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                {loading ? "Refreshing…" : "🔄 Refetch"}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          </header>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/15 to-amber-500/5 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-300/80">Total cards</p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-white">{stats.totalCards}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/80">Total views</p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-white">{stats.totalViews}</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Cards</h2>
            </div>
            {data && data.cards.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-zinc-400">No cards yet. Create one from the home page!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400">
                      <th className="px-6 py-3 font-medium">Recipient</th>
                      <th className="px-4 py-3 font-medium">Sender</th>
                      <th className="px-4 py-3 font-medium">Template</th>
                      <th className="px-4 py-3 font-medium">Views</th>
                      <th className="px-4 py-3 font-medium">Photos</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-6 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.cards ?? []).map((c) => {
                      const t = THEMES[c.template_id as ThemeId] ?? THEMES.marigold;
                      return (
                        <tr key={c.id} className="border-b border-white/5 text-zinc-200 transition hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{c.recipient_name}</div>
                            <div className="mt-0.5 font-mono text-xs text-zinc-500">{c.id}</div>
                          </td>
                          <td className="px-4 py-4">{c.sender_name}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5">
                              <span>{t.emoji}</span>
                              <span className="text-zinc-300">{t.name}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4 tabular-nums">{c.views}</td>
                          <td className="px-4 py-4">{c.photoCount}</td>
                          <td className="px-4 py-4 text-zinc-400">
                            {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleCopy(c.id)}
                                className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                              >
                                🔗 Copy
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                disabled={deletingId === c.id}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                              >
                                {deletingId === c.id ? "…" : "🗑️ Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
