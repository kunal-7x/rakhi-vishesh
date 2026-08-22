"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CardPlayer from "@/components/CardPlayer";
import { demoCard } from "@/lib/utils";
import type { ThemeConfig } from "@/engine/types";

interface ThemeCardProps {
  theme: ThemeConfig;
  selected?: boolean;
  index: number;
}

export function ThemeCard({ theme, selected = false, index }: ThemeCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.06 } },
      }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative"
    >
      <Link
        href={`/create?template=${theme.id}`}
        aria-label={`Create a card with the ${theme.name} template`}
        className={`group block overflow-hidden rounded-2xl border backdrop-blur transition-colors ${
          selected
            ? "border-[#ffd97a] bg-[#ffd97a]/10 shadow-[0_0_40px_rgba(255,217,122,0.25)]"
            : "border-white/10 bg-white/5 hover:border-[#ffd97a]/40"
        }`}
      >
        <div className={`relative aspect-[3/4] overflow-hidden ${theme.ui.card}`}>
          <CardPlayer card={demoCard()} themeId={theme.id} autoplay loop className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2a0e04]/90 via-transparent to-transparent" />
        </div>
        <div className="flex items-start justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="flex items-center gap-1.5 text-base font-semibold text-[#fff6e9]">
              <span className="text-lg">{theme.emoji}</span>
              {theme.name}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#ffd9a0]/70">
              {theme.tagline}
            </p>
          </div>
          <span
            className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              selected
                ? "border-[#ffd97a]/60 bg-[#ffd97a] text-[#2a0e04]"
                : "border-white/15 bg-white/5 text-[#ffd9a0]/80"
            }`}
          >
            {selected ? "Selected ✨" : "Use"}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
