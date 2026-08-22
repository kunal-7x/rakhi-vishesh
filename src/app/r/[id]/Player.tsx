"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CardPlayer from "@/components/CardPlayer";
import { THEMES } from "@/engine/themes";
import { canWebCodecs, exportVideo, mediaRecorderMime, type ExportRes } from "@/engine/export";
import { preloadImage } from "@/engine/scenes";
import { cardUrl, shareText } from "@/lib/utils";
import type { CardData } from "@/lib/types";

interface Toast {
  id: number;
  text: string;
  tone: "success" | "error";
}

export default function PlayerClient({ card }: { card: CardData }) {
  const theme = THEMES[card.templateId];
  const [quality, setQuality] = useState<ExportRes>("1080");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, tone: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    fetch(`/api/cards/${card.id}/view`).catch(() => undefined);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("created") === "1") {
        setTimeout(() => showToast("Your card is live! Share it now ✨"), 600);
      }
    }
  }, [card.id, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && (e.target as HTMLElement | null)?.tagName !== "SELECT") {
        setPlayerKey((k) => k + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDownload = async () => {
    if (!canWebCodecs() && mediaRecorderMime() === null) {
      showToast("Use Chrome/Edge for best export", "error");
      return;
    }
    setRendering(true);
    setProgress(0);
    try {
      for (const p of card.photos) {
        await preloadImage(p.url);
      }
      const { blob, ext } = await exportVideo(card, {
        width: 1080,
        height: 1080,
        fps: 30,
        quality,
        onProgress: (pct) => setProgress(pct),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rakhi.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      showToast("Video saved!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed. Try again.", "error");
    } finally {
      setRendering(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl(card.id));
      showToast("Link copied!");
    } catch {
      showToast("Couldn't copy link", "error");
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText(card))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleReplay = () => setPlayerKey((k) => k + 1);

  const bgStyle = {
    background: `linear-gradient(160deg, ${theme.bgDeep} 0%, ${theme.bg[0]} 45%, ${theme.bg[1]} 100%)`,
  };

  const accentGlow = {
    background: `radial-gradient(circle at 50% 30%, ${theme.accent}22 0%, transparent 60%)`,
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10" style={bgStyle}>
      <div className="pointer-events-none absolute inset-0" style={accentGlow} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-5"
      >
        <header className="flex flex-col items-center gap-1 text-center">
          <div className="text-sm font-medium tracking-wide" style={{ color: theme.textSoft }}>
            {theme.emoji} {theme.name}
          </div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: theme.text }}>
            For {card.recipientName} 💝 from {card.senderName}
          </h1>
        </header>

        <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50">
          <div className="relative aspect-square w-full">
            <CardPlayer key={playerKey} card={card} autoplay loop />
            <AnimatePresence>
              {rendering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm"
                >
                  <div className="text-4xl">🎞️</div>
                  <p className="text-sm font-medium text-white">
                    Rendering video… <span className="tabular-nums">{progress}%</span>
                  </p>
                  <div className="h-2 w-56 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{ width: `${progress}%`, backgroundColor: theme.accent }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur-md">
          <button
            onClick={handleReplay}
            title="Replay (R)"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
            disabled={rendering}
          >
            🔁 Replay
          </button>
          <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as ExportRes)}
              className="bg-transparent font-medium outline-none"
              aria-label="Video quality"
            >
              <option value="720" className="text-black">video_720p</option>
              <option value="1080" className="text-black">video_1080p</option>
            </select>
          </label>
          <button
            onClick={handleDownload}
            className={`rounded-xl bg-gradient-to-r ${theme.ui.btn} px-4 py-2.5 text-sm font-semibold ${theme.ui.btnText} shadow-lg transition hover:brightness-110 disabled:opacity-50`}
            disabled={rendering}
          >
            🎬 Download Video
          </button>
          <button
            onClick={handleCopy}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
            disabled={rendering || !!toast}
          >
            🔗 Copy Link
          </button>
          <button
            onClick={handleWhatsApp}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
            disabled={rendering}
          >
            💬 WhatsApp Share
          </button>
        </div>

        <Link
          href="/create"
          className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/15"
          style={{ color: theme.textSoft }}
        >
          Make your own card ✨
        </Link>

        <Link href="/" className="text-xs text-white/50 transition hover:text-white/80">
          ← Home
        </Link>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-2xl ${
              toast.tone === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
