"use client";

import { useEffect, useRef } from "react";
import { Renderer } from "@/engine/renderer";
import { RakhiRenderer } from "@/engine/scenes";
import { ensureFonts } from "@/engine/fonts";
import type { CardData } from "@/lib/types";
import type { ThemeId } from "@/engine/types";
interface Props {
  card: CardData;
  themeId?: ThemeId;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onReady?: () => void;
  speed?: number;
}

export default function CardPlayer({ card, themeId, className, autoplay = true, loop = true, onReady, speed = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef(card);
  cardRef.current = card;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const thisCard = themeId ? { ...cardRef.current, templateId: themeId } : cardRef.current;
    const renderer = new RakhiRenderer(thisCard);
    let raf = 0;
    let start: number | null = null;
    let done = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    resize();

    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      if (start === null) start = ms;
      const el = (ms - start) / 1000;
      const total = renderer.timelineInfo.total;
      const t = loop ? el % total : Math.min(el, total);
      if (!loop && !done && el >= total) {
        done = true;
        onReady?.();
      }
      renderer.render(ctx, { t, images: new Map(), fontReady: true });
    };

    if (autoplay) {
      ensureFonts().then(() => {
        raf = requestAnimationFrame(tick);
      });
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [themeId, autoplay, loop, onReady, speed]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export { Renderer };
