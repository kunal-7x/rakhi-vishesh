import type { CardData, RenderContext, ThemeConfig, ThemeId } from "./types";
import { THEMES } from "./themes";
import {
  clamp01,
  clampMinMax,
  easeOutBack,
  lerp,
  smoothstep,
} from "./easing";
import { randRange, seededRng } from "./rand";

export const DESIGN_W = 1080;
export const DESIGN_H = 1080;

export interface SceneTiming {
  name: string;
  start: number;
  duration: number;
}

export interface Timeline {
  scenes: SceneTiming[];
  total: number;
  introDuration: number;
  namesDuration: number;
  photoCount: number;
  messageDuration: number;
  finaleDuration: number;
}

export function buildTimeline(card: CardData): Timeline {
  const intro = 5.6;
  const names = 6.4;
  const photoCount = Math.max(0, card.photos.length);
  const withPhotos = photoCount > 0 ? 4.1 * photoCount + 1.4 : 2.2;
  const message = clampMinMax(4.6 + card.message.length * 0.062, 5.2, 16);
  const finale = 9.5;

  let cursor = 0;
  const scenes: SceneTiming[] = [];
  const add = (name: string, duration: number) => {
    scenes.push({ name, start: cursor, duration });
    cursor += duration;
  };
  add("intro", intro);
  add("names", names);
  add("photos", withPhotos);
  add("message", message);
  add("finale", finale);
  return {
    scenes,
    total: cursor,
    introDuration: intro,
    namesDuration: names,
    photoCount,
    messageDuration: message,
    finaleDuration: finale,
  };
}

export function sceneAt(timeline: Timeline, t: number): SceneTiming {
  for (const s of timeline.scenes) {
    if (t >= s.start && t < s.start + s.duration) return s;
  }
  return timeline.scenes[timeline.scenes.length - 1];
}

function swirlRng(card: CardData, salt: string): () => number {
  return seededRng(card.id + "|" + salt);
}

export class Renderer {
  private theme: ThemeConfig;
  private timeline: Timeline;
  private lastW = 0;
  private lastH = 0;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private card: CardData) {
    this.theme = THEMES[card.templateId as ThemeId] ?? THEMES.marigold;
    this.timeline = buildTimeline(card);
  }

  get themeConfig(): ThemeConfig {
    return this.theme;
  }

  get cardData(): CardData {
    return this.card;
  }

  get timelineInfo(): Timeline {
    return this.timeline;
  }

  bind(w: number, h: number): void {
    if (w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;
    const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
    this.scale = scale;
    this.offsetX = (w - DESIGN_W * scale) / 2;
    this.offsetY = (h - DESIGN_H * scale) / 2;
  }

  render(ctx: CanvasRenderingContext2D, info: Omit<RenderContext, "t"> & { t: number }): void {
    const t = info.t;
    const phase = info.phase ?? "preview";
    this.bind(ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.offsetX || this.offsetY) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawBase(ctx, t);
    const idx = this.sceneIdxAt(t);
    if (idx === 0) this.drawIntro(ctx, t);
    else if (idx === 1) this.drawNames(ctx, t);
    else if (idx === 2) this.drawPhotos(ctx, t, info);
    else if (idx === 3) this.drawMessage(ctx, t, info);
    else this.drawFinale(ctx, t);

    ctx.restore();
  }

  // ---------- internal ----------

  private sceneIdxAt(t: number): number {
    for (let i = 0; i < this.timeline.scenes.length; i++) {
      const s = this.timeline.scenes[i];
      if (t < s.start + s.duration) return i;
    }
    return 4;
  }

  protected drawBase(ctx: CanvasRenderingContext2D, t: number): void {
    const { theme } = this;
    const g = ctx.createLinearGradient(0, 0, DESIGN_W, DESIGN_H);
    g.addColorStop(0, theme.bg[0]);
    g.addColorStop(0.55, theme.bg[1]);
    g.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    const rg = ctx.createRadialGradient(DESIGN_W / 2, DESIGN_H * 0.42, 120, DESIGN_W / 2, DESIGN_H * 0.42, 900);
    rg.addColorStop(0, theme.bgDeep + "00");
    rg.addColorStop(1, theme.bgDeep + "cc");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    const shimmer = 0.5 + 0.5 * Math.sin(t * 0.9);
    ctx.save();
    ctx.globalAlpha = 0.06 + shimmer * 0.04;
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 420;
      const y = DESIGN_H - 140 - (i % 2 === 0 ? 0 : 40);
      ctx.beginPath();
      ctx.arc(x, y, 190 + i * 26, 0, Math.PI * 2);
      ctx.strokeStyle = theme.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  protected glowText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    font: string,
    color: string,
    opts: { blur: number; alpha?: number; rotate?: number; letterSpacing?: number; weight?: string },
  ): void {
    ctx.save();
    ctx.translate(x, y);
    if (opts.rotate) ctx.rotate(opts.rotate);
    ctx.font = `${opts.weight ?? "600"} ${size}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = opts.blur;
    ctx.shadowOffsetY = 4;
    ctx.globalAlpha = opts.alpha ?? 1;
    ctx.fillStyle = color;
    const spacing = opts.letterSpacing ?? 0;
    if (spacing === 0) {
      ctx.fillText(text, 0, 0);
    } else {
      const chars = [...text];
      const widths = chars.map((ch) => ctx.measureText(ch).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
      let cx = -total / 2;
      chars.forEach((ch, i) => {
        ctx.fillText(ch, cx + widths[i] / 2, 0);
        cx += widths[i] + spacing;
      });
    }
    ctx.restore();
  }

  protected drawSparkles(
    ctx: CanvasRenderingContext2D,
    t: number,
    count: number,
    rng: () => number,
    opts: { yy0: number; yy1: number; size: number; color?: string },
  ): void {
    const { theme } = this;
    for (let i = 0; i < count; i++) {
      const sx = rng() * DESIGN_W;
      const sy = lerp(opts.yy0, opts.yy1, i / count) + Math.sin(t * 1.4 + i) * 14;
      const tw = 0.5 + 0.5 * Math.sin(t * (2.2 + (i % 5) * 0.4) + i * 1.7);
      const alpha = 0.25 + tw * 0.7;
      const size = opts.size * (0.6 + tw * 0.7);
      ctx.save();
      ctx.translate(sx, (sy + t * 8) % DESIGN_H);
      ctx.rotate(t * 0.6 + i);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = opts.color ?? theme.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 4;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * size, Math.sin(ang) * size);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  protected drawSwirls(ctx: CanvasRenderingContext2D, t: number, color: string, alpha: number, size: number, salt: string): void {
    const rng = swirlRng(this.card, salt + "|swirls");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.4;
    for (let i = 0; i < 9; i++) {
      const cx = rng() * DESIGN_W;
      const cy = rng() * DESIGN_H;
      const r = randRange(rng, 26, 68) * size;
      const rot = t * randRange(rng, 0.3, 0.9) + i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, rot, rot + Math.PI * randRange(rng, 1.1, 1.7));
      ctx.stroke();
    }
    ctx.restore();
  }

  protected drawRibbons(ctx: CanvasRenderingContext2D, t: number, color: string, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const yBase = 60 + i * 200;
      ctx.beginPath();
      for (let x = 0; x <= DESIGN_W + 200; x += 26) {
        const y = yBase + Math.sin(x * 0.012 + t * (0.7 + i * 0.2) + i * 2) * 46;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  protected drawDots(ctx: CanvasRenderingContext2D, t: number, color: string, alpha: number): void {
    const rng = swirlRng(this.card, "dots");
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const x = rng() * DESIGN_W;
      const y = rng() * DESIGN_H;
      const r = randRange(rng, 2.2, 6.5);
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 0.8);
      ctx.globalAlpha = alpha * (0.4 + tw * 0.6);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  protected motifBg(ctx: CanvasRenderingContext2D, t: number): void {
    const { theme, card } = this;
    switch (theme.id) {
      case "marigold":
        this.drawSwirls(ctx, t, theme.accent, 0.14, 1, card.id);
        this.drawDots(ctx, t, theme.gold, 0.2);
        break;
      case "peacock":
        this.drawRibbons(ctx, t, theme.accent, 0.16);
        this.drawDots(ctx, t, theme.accentSoft, 0.22);
        break;
      case "diya":
        this.drawSwirls(ctx, t, theme.accent, 0.1, 0.8, card.id + "d");
        this.drawDots(ctx, t, theme.accentSoft, 0.24);
        break;
      case "rose":
        this.drawSwirls(ctx, t, theme.accent, 0.12, 1.15, card.id + "r");
        this.drawDots(ctx, t, theme.accentSoft, 0.16);
        break;
      case "cosmic":
        this.drawSparkles(ctx, t, 46, swirlRng(card, "cos"), { yy0: 90, yy1: DESIGN_H - 40, size: 9 });
        break;
      case "jewel":
        this.drawRibbons(ctx, t, theme.accent, 0.12);
        this.drawDots(ctx, t, theme.gold, 0.2);
        break;
      case "mehndi":
        this.drawSwirls(ctx, t, theme.accent, 0.16, 1.3, card.id + "m");
        this.drawDots(ctx, t, theme.gold, 0.2);
        break;
      default:
        this.drawRibbons(ctx, t, theme.accent, 0.14);
        this.drawSparkles(ctx, t, 26, swirlRng(card, "cf"), { yy0: 100, yy1: DESIGN_H - 60, size: 12 });
    }
  }

  // ----- 0. INTRO -----
  private titleForCard(): string {
    return "HAPPY RAKSHA BANDHAN";
  }

  private drawIntro(ctx: CanvasRenderingContext2D, t: number): void {
    const { theme } = this;
    const p = clamp01(t / 5.6);
    this.motifBg(ctx, t);

    const cx = DESIGN_W / 2;
    const cy = DESIGN_H * 0.46;

    const phase1 = smoothstep(0.08, 0.55, p);
    const phase2 = smoothstep(0.5, 0.95, p);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);

    const ringR = 340 - phase1 * 10 + Math.sin(t * 0.8) * 4;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.14 + phase1 * 0.3 - i * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, ringR - i * 42 + Math.sin(t * 0.9 + i) * 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate((Math.PI / 4) * 2);
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const wob = Math.sin(t * 1.6 + i * 1.3) * 6;
      const r = ringR - 84 + wob;
      const dir = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, 6 + dir * 2, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? theme.gold : theme.accent;
      ctx.globalAlpha = 0.85;
      ctx.fill();
    }
    ctx.restore();

    const titleScale = easeOutBack(phase1);
    const titleAlpha = phase1;

    ctx.save();
    ctx.translate(cx, cy - 40);
    ctx.scale(titleScale, titleScale);
    ctx.globalAlpha = titleAlpha;
    ctx.font = `900 104px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 40;
    ctx.fillStyle = theme.text;
    ctx.fillText(this.titleForCard(), 0, 0);
    ctx.shadowBlur = 0;
    ctx.font = `600 38px 'Dancing Script', cursive`;
    ctx.fillStyle = theme.accentSoft;
    ctx.globalAlpha = titleAlpha * (0.5 + phase2 * 0.5);
    ctx.fillText("· the thread that binds us ·", 0, 104);
    ctx.restore();

    this.drawSparkles(ctx, t, 30, swirlRng(this.card, "intro-s"), { yy0: 200, yy1: DESIGN_H - 150, size: 10 });
  }

  // ----- 1. NAMES -----
  private drawNames(ctx: CanvasRenderingContext2D, t: number): void {
    const { theme, card } = this;
    this.motifBg(ctx, t);
    const cx = DESIGN_W / 2;
    const p = clamp01(t / 6.4);
    const to = smoothstep(0.08, 0.42, p);
    const from = smoothstep(0.48, 0.88, p);

    const toSize = clampMinMax(150 - Math.min(100, this.widthOf(to, card.recipientName)), 64, 150);
    const fromSize = clampMinMax(96 - Math.min(56, this.widthOf(from, card.senderName)), 48, 96);

    ctx.save();
    ctx.translate(cx, DESIGN_H * 0.42);
    ctx.scale(easeOutBack(to), easeOutBack(to));
    ctx.globalAlpha = to;
    this.glowText(ctx, "FOR", 0, -150, 42, "'Dancing Script', cursive", theme.accentSoft, { blur: 12 });
    ctx.restore();

    const scale = easeOutBack(to);
    ctx.save();
    ctx.translate(cx, DESIGN_H * 0.42);
    ctx.scale(scale, scale);
    ctx.globalAlpha = clamp01(to * 1.25);
    ctx.font = `700 ${toSize}px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 30;
    ctx.fillStyle = theme.text;
    ctx.fillText(card.recipientName, 0, 10);
    ctx.restore();

    this.drawSparkles(ctx, t, 22, swirlRng(card, "names"), { yy0: 260, yy1: DESIGN_H - 220, size: 9 });

    if (from > 0.1) {
      const fc = easeOutBack(from);
      ctx.save();
      ctx.translate(cx, DESIGN_H * 0.72);
      ctx.scale(fc, fc);
      ctx.globalAlpha = clamp01(from * 1.2);
      this.glowText(ctx, "FROM", 0, -92, 34, "'Dancing Script', cursive", theme.accentSoft, { blur: 10 });
      ctx.font = `700 ${fromSize}px 'Rajdhani', 'Arial Black', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 24;
      ctx.fillStyle = theme.text;
      ctx.fillText(card.senderName || "Your Brother", 0, 0);
      ctx.restore();
    }
  }

  private widthOf(p: number, s: string): number {
    return p > 1 ? 0 : p < 0 ? 0 : (s?.length ?? 0) * 5;
  }

  protected drawPhotos(ctx: CanvasRenderingContext2D, t: number, info: Omit<RenderContext, "t"> & { t: number }): void {
    throw new Error("drawPhotos implemented in scenes.ts");
  }

  protected drawMessage(ctx: CanvasRenderingContext2D, t: number, info: Omit<RenderContext, "t"> & { t: number }): void {
    throw new Error("drawMessage implemented in scenes.ts");
  }

  protected drawFinale(ctx: CanvasRenderingContext2D, t: number): void {
    throw new Error("drawFinale implemented in scenes.ts");
  }
}
