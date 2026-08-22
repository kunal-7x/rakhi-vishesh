"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const FREE_FEATURES = [
  "All 8 animated themes",
  "Unlimited cards",
  "Shareable link",
  "720p video export with watermark",
] as const;

const PRO_FEATURES = [
  "All 8 themes — forever",
  "1080p video export",
  "Watermark-free cards",
  "Priority support",
  "Early access to new themes",
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-24 py-24">
      <div className="pointer-events-none absolute left-0 top-1/3 h-72 w-72 rounded-full bg-[#7c2506]/25 blur-[100px]" />
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd97a]">
            Simple pricing
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#fff6e9] sm:text-4xl">
            Free to start,{" "}
            <span className="bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] bg-clip-text text-transparent">
              ₹99 for a lifetime
            </span>{" "}
            of every rakhi
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#ffd9a0]/75">
            One-time price. No subscription, no surprises. Just the nicest rakhi card your sister
            has ever received.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease }}
            className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
          >
            <h3 className="text-lg font-semibold text-[#fff6e9]">Free</h3>
            <p className="mt-1 text-sm text-[#ffd9a0]/70">For every brave first card</p>
            <p className="mt-6 text-5xl font-bold text-[#fff6e9]">
              ₹0
              <span className="ml-2 text-base font-normal text-[#ffd9a0]/60">forever</span>
            </p>
            <ul className="mt-8 flex-1 space-y-3 text-sm text-[#ffd9a0]/85">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[#2bd4c8]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/create"
              className="mt-8 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-[#fff6e9] transition-colors hover:border-[#ffd97a]/40 hover:bg-white/10"
            >
              Start creating — it&apos;s free
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.12, ease }}
            className="relative flex flex-col rounded-3xl border border-[#ffd97a]/40 bg-gradient-to-b from-[#ffd97a]/10 to-transparent p-8 shadow-[0_0_60px_rgba(255,217,122,0.12)] backdrop-blur"
          >
            <span className="absolute -top-3.5 left-8 rounded-full bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#2a0e04]">
              Best value
            </span>
            <h3 className="text-lg font-semibold text-[#fff6e9]">Pro</h3>
            <p className="mt-1 text-sm text-[#ffd9a0]/70">One-time, pay once keep forever</p>
            <p className="mt-6 text-5xl font-bold text-[#fff6e9]">
              ₹99
              <span className="ml-2 text-base font-normal text-[#ffd9a0]/60">lifetime</span>
            </p>
            <ul className="mt-8 flex-1 space-y-3 text-sm text-[#ffd9a0]/85">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[#ffd97a]">✦</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="mailto:hello@rakhivishesh.app?subject=Unlock%20RakhiVishesh%20Pro"
              className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] px-6 py-3 text-sm font-bold text-[#2a0e04] shadow-[0_8px_32px_rgba(255,157,46,0.4)] transition-all hover:brightness-110"
            >
              ✨ Unlock Pro (coming soon)
            </a>
            <p className="mt-3 text-center text-xs text-[#ffd9a0]/50">
              Payments open shortly — join the waitlist via email
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
