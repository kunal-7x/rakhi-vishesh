"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    emoji: "🎨",
    step: "01",
    title: "Pick a template",
    description:
      "Choose from 8 hand-crafted animated themes — marigold, peacock, diya, cosmic and more. Each one plays a full scene, not a still card.",
  },
  {
    emoji: "💝",
    step: "02",
    title: "Add names, message & photos",
    description:
      "Type your sister's name and yours, write your message, and add up to 12 photos. Your photos become part of the animation itself.",
  },
  {
    emoji: "🔗",
    step: "03",
    title: "Share the link & download the video",
    description:
      "Send one shareable link — she opens it and the card plays instantly. You can also download your card as a video to keep forever.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 border-y border-white/5 bg-[#1b0a03]/60 py-24">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#ff9d2e]/10 blur-[90px]" />
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd97a]">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#fff6e9] sm:text-4xl">
            From name to celebration in{" "}
            <span className="bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] bg-clip-text text-transparent">
              three steps
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.12, ease }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
            >
              <div className="absolute -right-6 -top-6 text-8xl font-black text-white/[0.03] transition-colors group-hover:text-[#ffd97a]/10">
                {s.step}
              </div>
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ffd97a]/25 bg-[#ffd97a]/10 text-2xl">
                {s.emoji}
              </div>
              <h3 className="text-lg font-semibold text-[#fff6e9]">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#ffd9a0]/75">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
