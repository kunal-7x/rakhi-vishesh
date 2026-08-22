"use client";

import { useCallback, useEffect, useRef } from "react";
import { RakhiRenderer, imageCache } from "@/engine/scenes";
import { ensureFonts } from "@/engine/fonts";
import type { CardData, AspectId } from "@/lib/types";

interface Props {
  card: CardData;
  themeId?: CardData["templateId"];
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  onReady?: () => void;
  interactive?: boolean;
  aspect?: AspectId;
  /** change this to force a remount of the timeline (replay) */
  replayKey?: number;
}

export default function CardPlayer({
  card,
  themeId,
  className,
  autoplay = true,
  loop = true,
  onReady,
  interactive = false,
  aspect,
  replayKey = 0,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef(card);
  cardRef.current = card;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const thisCard: CardData = {
      ...cardRef.current,
      templateId: themeId ?? cardRef.current.templateId,
      aspect: aspect ?? cardRef.current.aspect ?? "9:16",
    };

    const renderer = new RakhiRenderer(thisCard);
    let raf = 0;
    let start: number | null = null;
    let doneSent = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(canvas);

    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      if (start === null) start = ms;
      const el = (ms - start) / 1000;
      const total = renderer.timelineInfo.total;
      const t = loop ? el % total : Math.min(el, total);
      if (!loop && !doneSent && el >= total) {
        doneSent = true;
        onReadyRef.current?.();
      }
      renderer.render(ctx, { t, images: imageCache, fontReady: true, phase: "preview" });
    };

    if (autoplay) {
      ensureFonts().then(() => {
        raf = requestAnimationFrame(tick);
      });
    }

    let ptrX = 0;
    let ptrY = 0;

    const onMove = (e: PointerEvent) => {
      if (!interactiveRef.current) return;
      const r = canvas.getBoundingClientRect();
      ptrX = e.clientX - r.left;
      ptrY = e.clientY - r.top;
      const d = renderer.toDesign((ptrX * canvas.width) / r.width, (ptrY * canvas.height) / r.height);
      renderer.hoverIdx = renderer.hitTest(d.x, d.y);
      canvas.style.cursor = renderer.hoverIdx !== null ? "pointer" : "default";
    };
    const onLeave = () => {
      if (!interactiveRef.current) return;
      renderer.hoverIdx = null;
      canvas.style.cursor = "default";
    };
    const onClick = () => {
      if (!interactiveRef.current) return;
      if (renderer.focusIdx !== null) {
        renderer.focusIdx = null;
        return;
      }
      const r = canvas.getBoundingClientRect();
      const d = renderer.toDesign((ptrX * canvas.width) / r.width, (ptrY * canvas.height) / r.height);
      const hit = renderer.hitTest(d.x, d.y);
      if (hit !== null) renderer.focusIdx = hit;
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [themeId, autoplay, loop, aspect, replayKey]);

  const cb = useCallback(() => {
    void 0;
  }, []);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
