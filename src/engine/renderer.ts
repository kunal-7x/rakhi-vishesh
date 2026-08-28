import type { CardData, RenderContext, ThemeConfig, ThemeId, AspectId } from "./types";
import { THEMES } from "./themes";
import { clamp01, easeOutBack, lerp, smoothstep } from "./easing";
import { randRange, seededRng } from "./rand";

export const ASPECT_DIMS: Record<AspectId, { W: number; H: number }> = {
  "9:16": { W: 1080, H: 1920 },
  "1:1": { W: 1080, H: 1080 },
  "16:9": { W: 1920, H: 1080 },
};

export const CROSSFADE = 1.15;

export interface SceneTiming {
  name: string;
  start: number;
  duration: number;
}

export interface Timeline {
  scenes: SceneTiming[];
  total: number;
  withPhotosDuration: number;
  photoCount: number;
  messageDuration: number;
}

export function buildTimeline(card: CardData): Timeline {
  const intro = 7.5;
  const names = 4.5;
  const photoCount = Math.max(0, card.photos.length);
  const withPhotos = photoCount > 0 ? 2.2 + photoCount * 1.5 : 2.4;
  const message = Math.min(16, Math.max(5.0, 4.4 + card.message.length * 0.055));
  const finale = 9.0;

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
  return { scenes, total: cursor, withPhotosDuration: withPhotos, photoCount, messageDuration: message };
}

export function sceneAt(timeline: Timeline, t: number): SceneTiming {
  for (const s of timeline.scenes) {
    if (t >= s.start && t < s.start + s.duration) return s;
  }
  return timeline.scenes[timeline.scenes.length - 1];
}

type Info = Omit<RenderContext, "t"> & { t: number };

export class Renderer {
  protected theme: ThemeConfig;
  protected timeline: Timeline;
  protected W = ASPECT_DIMS["1:1"].W;
  protected H = ASPECT_DIMS["1:1"].H;
  protected base = 1080;
  protected cx = 540;
  protected cy = 540;
  protected aspect: AspectId = "1:1";
  public hoverIdx: number | null = null;
  public focusIdx: number | null = null;

  private lastW = 0;
  private lastH = 0;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private buf: HTMLCanvasElement | null = null;

  constructor(protected card: CardData) {
    this.theme = THEMES[card.templateId as ThemeId] ?? THEMES.marigold;
    this.timeline = buildTimeline(card);
    this.aspect = card.aspect ?? "9:16";
    const d = ASPECT_DIMS[this.aspect];
    this.W = d.W;
    this.H = d.H;
    this.base = Math.min(d.W, d.H);
    this.cx = d.W / 2;
    this.cy = d.H / 2;
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

  toDesign(px: number, py: number): { x: number; y: number } {
    return { x: (px - this.offsetX) / this.scale, y: (py - this.offsetY) / this.scale };
  }

  hitTest(x: number, y: number): number | null {
    return null;
  }

  bind(w: number, h: number): void {
    if (w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;
    const scale = Math.min(w / this.W, h / this.H);
    this.scale = scale;
    this.offsetX = (w - this.W * scale) / 2;
    this.offsetY = (h - this.H * scale) / 2;
  }

  // ==== render ====

  render(ctx: CanvasRenderingContext2D, info: Info): void {
    const t = info.t;
    this.bind(ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.offsetX || this.offsetY) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawBase(ctx, t);
    this.drawSceneBlend(ctx, t, info);
    ctx.restore();
  }

  private drawSceneBlend(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    const idx = this.sceneIdxAt(t);
    if (idx > 0) {
      const s = this.timeline.scenes[idx];
      const k = smoothstep(s.start - CROSSFADE / 2, s.start + CROSSFADE / 2, t);
      if (k < 1) {
        const buf = this.getBuffer();
        const bctx = buf.getContext("2d")!;
        bctx.clearRect(0, 0, this.W, this.H);
        this.drawSceneAt(idx - 1, bctx, t, info);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
        if (k > 0) {
          bctx.clearRect(0, 0, this.W, this.H);
          this.drawSceneAt(idx, bctx, t, info);
          ctx.save();
          ctx.globalAlpha = k;
          ctx.drawImage(buf, 0, 0);
          ctx.restore();
        }
        return;
      }
    }
    this.drawSceneAt(idx, ctx, t, info);
  }

  private getBuffer(): HTMLCanvasElement {
    if (!this.buf || this.buf.width !== this.W || this.buf.height !== this.H) {
      this.buf = document.createElement("canvas");
      this.buf.width = this.W;
      this.buf.height = this.H;
    }
    return this.buf;
  }

  private drawSceneAt(idx: number, ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    if (idx === 0) this.drawIntro(ctx, t);
    else if (idx === 1) this.drawNames(ctx, t);
    else if (idx === 2) this.drawPhotos(ctx, t, info);
    else if (idx === 3) this.drawMessage(ctx, t, info);
    else this.drawFinale(ctx, t);
  }

  private sceneIdxAt(t: number): number {
    for (let i = 0; i < this.timeline.scenes.length; i++) {
      const s = this.timeline.scenes[i];
      if (t < s.start + s.duration) return i;
    }
    return 4;
  }

  // ==== base background + motifs ====

  protected drawBase(ctx: CanvasRenderingContext2D, t: number): void {
    const { theme } = this;
    const g = ctx.createLinearGradient(0, 0, this.W, this.H);
    g.addColorStop(0, theme.bg[0]);
    g.addColorStop(0.55, theme.bg[1]);
    g.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);

    const rg = ctx.createRadialGradient(this.cx, this.H * 0.42, this.base * 0.12, this.cx, this.H * 0.42, this.base * 0.9);
    rg.addColorStop(0, theme.bgDeep + "00");
    rg.addColorStop(1, theme.bgDeep + "cc");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, this.W, this.H);

    const shimmer = 0.5 + 0.5 * Math.sin(t * 0.9);
    ctx.save();
    ctx.globalAlpha = 0.06 + shimmer * 0.04;
    for (let i = 0; i < 3; i++) {
      const x = this.base * 0.083 + i * this.W * 0.39;
      const y = this.H - this.base * 0.13 - (i % 2 === 0 ? 0 : this.base * 0.037);
      ctx.beginPath();
      ctx.arc(x, y, (190 + i * 26) * (this.base / 1080), 0, Math.PI * 2);
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
    opts: { blur: number; alpha?: number; rotate?: number; letterSpacing?: number; weight?: string; maxWidth?: number },
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
      ctx.fillText(text, 0, 0, opts.maxWidth);
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

  protected roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  protected drawSparkles(
    ctx: CanvasRenderingContext2D,
    t: number,
    count: number,
    rng: () => number,
    opts: { yy0: number; yy1: number; size: number; color?: string },
  ): void {
    const { theme } = this;
    const u = this.base / 1080;
    for (let i = 0; i < count; i++) {
      const sx = rng() * this.W;
      const sy = lerp(opts.yy0, opts.yy1, i / count) + Math.sin(t * 1.4 + i) * this.base * 0.013;
      const tw = 0.5 + 0.5 * Math.sin(t * (2.2 + (i % 5) * 0.4) + i * 1.7);
      const size = opts.size * (0.6 + tw * 0.7) * u;
      const alpha = 0.25 + tw * 0.7;
      ctx.save();
      ctx.translate(sx, (sy + t * 8) % this.H);
      ctx.rotate(t * 0.6 + i);
      ctx.globalAlpha = alpha * 0.9;
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

  private drawSwirls(ctx: CanvasRenderingContext2D, t: number, color: string, alpha: number, size: number, salt: string): void {
    const rng = seededRng(this.card.id + "|" + salt + "|swirls");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.4 * (this.base / 1080);
    const u = this.base / 1080;
    for (let i = 0; i < 9; i++) {
      const cx = rng() * this.W;
      const cy = rng() * this.H;
      const r = randRange(rng, 26, 68) * size * u;
      const rot = t * randRange(rng, 0.3, 0.9) + i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, rot, rot + Math.PI * randRange(rng, 1.1, 1.7));
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRibbons(ctx: CanvasRenderingContext2D, t: number, color: string, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    const span = this.H / 4;
    const u = this.base / 1080;
    for (let i = 0; i < 3; i++) {
      const yBase = this.base * 0.055 + i * span;
      ctx.beginPath();
      for (let x = 0; x <= this.W + this.base; x += 26) {
        const y = yBase + Math.sin(x * 0.012 / u + t * (0.7 + i * 0.2) + i * 2) * 46 * u;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawDots(ctx: CanvasRenderingContext2D, t: number, color: string, alpha: number): void {
    const rng = seededRng(this.card.id + "|dots");
    ctx.save();
    const u = this.base / 1080;
    for (let i = 0; i < 26; i++) {
      const x = rng() * this.W;
      const y = rng() * this.H;
      const r = randRange(rng, 2.2, 6.5) * u;
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
        this.drawSparkles(ctx, t, 46, seededRng(card.id + "|cos"), { yy0: this.base * 0.083, yy1: this.H - this.base * 0.037, size: 9 });
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
        this.drawSparkles(ctx, t, 26, seededRng(card.id + "|cf"), { yy0: this.base * 0.093, yy1: this.H - this.base * 0.056, size: 12 });
    }
  }

  // ==== hooks for scenes.ts ====

  protected drawIntro(ctx: CanvasRenderingContext2D, t: number): void {
    throw new Error("scenes.ts");
  }

  protected drawNames(ctx: CanvasRenderingContext2D, t: number): void {
    throw new Error("scenes.ts");
  }

  protected drawPhotos(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    throw new Error("scenes.ts");
  }

  protected drawMessage(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    throw new Error("scenes.ts");
  }

  protected drawFinale(ctx: CanvasRenderingContext2D, t: number): void {
    throw new Error("scenes.ts");
  }
}

