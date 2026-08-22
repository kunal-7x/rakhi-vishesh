"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import CardPlayer from "@/components/CardPlayer";
import PhotoUploader from "@/components/PhotoUploader";
import StepDots from "@/components/create/StepDots";
import TextField from "@/components/create/TextField";
import TextAreaField from "@/components/create/TextAreaField";
import { THEME_LIST } from "@/engine/themes";
import { demoCard } from "@/lib/utils";
import type { CardData, PhotoSpec, ThemeId } from "@/lib/types";

const STEPS = ["Theme", "Names", "Message", "Photos", "Preview"] as const;
const MAX_NAME = 40;
const MAX_MESSAGE = 600;

const ASPECTS: { id: CardData["aspect"]; label: string; icon: string }[] = [
  { id: "9:16", label: "Reel 9:16", icon: "📱" },
  { id: "1:1", label: "Square 1:1", icon: "⬛" },
  { id: "16:9", label: "Wide 16:9", icon: "🖥️" },
];

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "c" + Math.floor(Math.random() * 1e6).toString(10)
  );
}

interface CreateWizardProps {
  initialTheme?: ThemeId | null;
}

export default function CreateWizard({ initialTheme }: CreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<ThemeId>(initialTheme ?? "marigold");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<PhotoSpec[]>([]);
  const [aspect, setAspect] = useState<CardData["aspect"]>("9:16");
  const [cleanLink, setCleanLink] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const recipientOk = recipientName.trim().length > 0;
  const canProceed = step !== 1 || recipientOk;
  const slugHint =
    recipientName.trim() && senderName.trim()
      ? `${slugify(senderName)}-from-${slugify(recipientName)}`
      : "your-link-will-look-like: /r/sender-from-recipient";

  const previewCard: CardData = {
    id: "preview",
    senderName: senderName.trim(),
    recipientName: recipientName.trim() || "Sister",
    message,
    templateId,
    photos,
    aspect,
  };

  function goTo(i: number) {
    if (i < step) {
      setError(null);
      setStep(i);
    }
  }

  async function create() {
    setError(null);
    setCreating(true);
    try {
      const base = `${slugify(senderName.trim() || "brother")}-from-${slugify(recipientName.trim())}`.slice(0, 48);
      let id = base;
      for (let attempt = 0; attempt < 5; attempt++) {
        const photosOut: PhotoSpec[] = [];
        for (const p of photos) {
          if (p.url.startsWith("https://")) {
            photosOut.push(p);
            continue;
          }
          photosOut.push({ ...p, url: await uploadPhoto(p.url) });
        }
        const res = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            senderName: senderName.trim(),
            recipientName: recipientName.trim(),
            message,
            templateId,
            aspect,
            photos: photosOut,
          } satisfies CardData & { aspect: CardData["aspect"] }),
        });
        if (res.status === 200) {
          router.push(cleanLink ? `/r/${id}?clean=1&created=1` : `/r/${id}?created=1`);
          return;
        }
        if (res.status === 409) {
          id = `${base}-${attempt + 2}`.slice(0, 48);
          continue;
        }
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not create card. Please try again.");
      }
      throw new Error("That link name is taken. Try a slightly different pair of names.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  async function uploadPhoto(dataUrl: string): Promise<string> {
    const file = dataUrlToFile(dataUrl);
    if (!file) throw new Error("One of your photos could not be read. Remove and re-add it.");
    const res = await fetch("/api/upload", { method: "POST", body: (() => {
      const fd = new FormData();
      fd.append("file", file);
      return fd;
    })() });
    const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !data?.url) throw new Error(data?.error ?? "Photo upload failed. Please try again.");
    return data.url;
  }

  const nextLabel = step === STEPS.length - 1 ? "Create Card" : "Continue";
  const stepHeading = ["Pick a theme", "Who is it for?", "Your message", "Photos of your sister", "Preview"][step];

  return (
    <div className="rounded-2xl border border-amber-200/10 bg-white/[0.04] p-5 backdrop-blur sm:p-8">
      <StepDots labels={STEPS} current={step} onSelect={goTo} />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h2 className="mb-5 text-xl font-semibold text-[#fff6e9]">{stepHeading}</h2>

            {step === 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {THEME_LIST.map((t) => {
                  const selected = t.id === templateId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={`group rounded-2xl border p-2 text-left transition ${
                        selected
                          ? "border-[#ffd97a] bg-[#ffd97a]/10 shadow-[0_0_24px_rgba(255,217,122,0.18)]"
                          : "border-white/10 bg-black/20 hover:border-[#ffd97a]/40 hover:bg-black/30"
                      }`}
                    >
                      <span className="block aspect-[9/16] w-full overflow-hidden rounded-xl bg-black/40">
                        <CardPlayer card={demoCard()} themeId={t.id} />
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 px-1 pb-1">
                        <span className="text-sm">{t.emoji}</span>
                        <span className="truncate text-xs font-medium text-[#fff6e9]">{t.name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Recipient name"
                  value={recipientName}
                  onChange={setRecipientName}
                  placeholder="Your sister's name"
                  maxLength={MAX_NAME}
                  hint={recipientOk ? undefined : "Required — who is this for?"}
                  error={false}
                />
                <TextField
                  label="Your name (sender)"
                  value={senderName}
                  onChange={setSenderName}
                  placeholder="Your brother's name"
                  maxLength={MAX_NAME}
                  hint="We'll use 'Your Brother' if you leave it blank"
                />
              </div>
            )}

            {step === 2 && (
              <TextAreaField
                label="Message"
                value={message}
                onChange={setMessage}
                placeholder="Write a heartfelt message for your sister…"
                maxLength={MAX_MESSAGE}
                hint="Optional — a beautiful card is beautiful on its own"
              />
            )}

            {step === 3 && (
              <PhotoUploader value={photos} onChange={setPhotos} />
            )}

            {step === 4 && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-1 rounded-xl border border-amber-200/15 bg-black/25 p-1" role="group" aria-label="Aspect ratio">
                  {ASPECTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAspect(a.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        aspect === a.id ? "bg-[#ffd97a]/20 text-[#ffd97a]" : "text-[#ffd9a0]/60 hover:text-[#ffd9a0]"
                      }`}
                    >
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
                <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-amber-200/15 shadow-[0_8px_40px_rgba(0,0,0,0.45)]" style={{ aspectRatio: aspect?.replace(":", "/") }}>
                  <CardPlayer card={previewCard} aspect={aspect} />
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200/15 bg-black/25 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={cleanLink}
                    onChange={(e) => setCleanLink(e.target.checked)}
                    className="h-4 w-4 accent-[#ff9d2e]"
                  />
                  <span className="text-sm text-[#fff6e9]">
                    <strong className="text-[#ffd97a]">Clean link</strong>{" "}
                    <span className="text-[#ffd9a0]/70">— your sister sees ONLY the magic card (no buttons, no ads, no tools)</span>
                  </span>
                </label>
                <p className="text-center text-xs text-[#ffd9a0]/60">
                  Your link: <span className="font-mono text-[#ffd97a]/80">/r/{slugHint}</span>
                </p>
                <p className="text-center text-sm text-[#ffd9a0]/70">
                  A card for <span className="font-semibold text-[#ffd97a]">{recipientName.trim() || "Sister"}</span>
                  {senderName.trim() && (
                    <>
                      {" "}from <span className="font-semibold text-[#ffd97a]">{senderName.trim()}</span>
                    </>
                  )}
                </p>
                <p className="max-w-[340px] text-center text-xs text-[#ffd9a0]/60">
                  💡 Tap a photo on the card when it plays — it zooms in. Hover and it wiggles.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-[#ffd9a0] transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-0"
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={creating || !canProceed || (step === STEPS.length - 1 && !recipientOk)}
          onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : create())}
          className={`rounded-xl bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] px-6 py-2.5 text-sm font-bold text-[#2a0e04] shadow-[0_4px_20px_rgba(255,217,122,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:px-8 sm:text-base`}
        >
          {creating ? "Creating…" : nextLabel}
        </button>
      </div>
    </div>
  );
}

function dataUrlToFile(dataUrl: string): File | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], "photo.jpg", { type: m[1] });
}
