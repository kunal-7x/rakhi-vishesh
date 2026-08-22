"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { themeList } from "@/lib/utils";
import { ThemeCard } from "@/components/cards/ThemeCard";

const ease = [0.22, 1, 0.36, 1] as const;

function TemplateGalleryGrid() {
  const params = useSearchParams();
  const selected = params.get("template");
  const themes = themeList();

  return (
    <section id="templates" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="mx-auto mb-12 max-w-2xl text-center"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd97a]">
          8 themes · hand-crafted
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[#fff6e9] sm:text-4xl">
          Pick the template that feels like{" "}
          <span className="bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] bg-clip-text text-transparent">
            your bond
          </span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#ffd9a0]/75">
          Every theme is a full animated scene — petals, diyas, peacocks, stars. Tap one to start
          your card with it pre-selected.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ staggerChildren: 0.06 }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {themes.map((theme, i) => (
          <ThemeCard key={theme.id} theme={theme} selected={selected === theme.id} index={i} />
        ))}
      </motion.div>
    </section>
  );
}

export function TemplateGallery() {
  return (
    <Suspense fallback={<div className="px-6 py-24 text-center text-[#ffd9a0]/60">Loading templates…</div>}>
      <TemplateGalleryGrid />
    </Suspense>
  );
}
