"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CardPlayer from "@/components/CardPlayer";
import { demoCard } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const card = demoCard();

  const watchDemo = () => {
    document.getElementById("templates")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[54rem] -translate-x-1/2 rounded-full bg-[#ff9d2e]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#7c2506]/30 blur-[100px]" />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-8">
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ffd97a]/30 bg-[#ffd97a]/10 px-4 py-1.5 text-sm font-medium text-[#ffd97a] backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffd97a]" />
            Raksha Bandhan 2026 · now live
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-4xl font-bold leading-tight tracking-tight text-[#fff6e9] sm:text-5xl lg:text-6xl"
          >
            Send a rakhi card
            <br />
            <span className="bg-gradient-to-r from-[#ffd97a] via-[#ff9d2e] to-[#ff6a00] bg-clip-text text-transparent">
              that comes alive
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-[#ffd9a0]/90"
          >
            Weave your names, your message and your photos into a hand-crafted animated card for
            your sister. Share one link — she&apos;ll watch it light up, again and again.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/create"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] px-7 py-3.5 text-base font-semibold text-[#2a0e04] shadow-[0_8px_32px_rgba(255,157,46,0.4)] transition-all hover:shadow-[0_12px_44px_rgba(255,157,46,0.6)] hover:brightness-110"
            >
              Create your Rakhi card ✨
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <button
              onClick={watchDemo}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-medium text-[#fff6e9] backdrop-blur transition-colors hover:border-[#ffd97a]/40 hover:bg-white/10"
            >
              ▶ Watch demo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#ffd9a0]/70"
          >
            <span>🖼️ 8 hand-crafted themes</span>
            <span>🎬 Animated &amp; looping</span>
            <span>📥 Video export</span>
            <span>🎁 Free to start</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#ff9d2e]/30 via-[#7c2506]/20 to-transparent blur-2xl" />
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <CardPlayer card={card} themeId="marigold" autoplay loop className="absolute inset-0" />
          </div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease }}
            className="absolute -left-4 top-10 rounded-2xl border border-white/10 bg-[#2a0e04]/80 px-4 py-2 text-sm text-[#ffd9a0] shadow-xl backdrop-blur"
          >
            🪔 Happy Raksha Bandhan!
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 1, ease }}
            className="absolute -right-3 bottom-12 rounded-2xl border border-white/10 bg-[#2a0e04]/80 px-4 py-2 text-sm text-[#ffd9a0] shadow-xl backdrop-blur"
          >
            💝 Made with love
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
