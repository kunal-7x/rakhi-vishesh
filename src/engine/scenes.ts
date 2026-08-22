import { Renderer, DESIGN_W, DESIGN_H } from "./renderer";
import type { CardData, RenderContext } from "./types";
import { clamp01, clampMinMax, easeOutCubic, smoothstep } from "./easing";
import { seededRng } from "./rand";

type Info = Omit<RenderContext, "t"> & { t: number };

export const imageCache = new Map<string, HTMLImageElement | null>();

export async function preloadImage(url: string): Promise<HTMLImageElement | null> {
  if (imageCache.has(url)) return imageCache.get(url) ?? null;
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.referrerPolicy = "no-referrer";
    img.crossOrigin = "anonymous";
    img.src = url;
  });
  imageCache.set(url, img.complete && img.naturalWidth > 0 ? img : null);
  return imageCache.get(url) ?? null;
}

export class RakhiRenderer extends Renderer {
  constructor(card: CardData) {
    super(card);
  }

  // ----- 2. PHOTOS -----
  protected drawPhotos(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    const theme = this.themeConfig; const card = this.cardData; const timelineInfo = this.timelineInfo;
    this.motifBg(ctx, t);
    const photos = card.photos ?? [];
    const scene = timelineInfo.scenes[2];
    const p = clamp01((t - scene.start) / scene.duration);
    if (photos.length === 0) {
      this.drawPhotoFallback(ctx, t, p);
      return;
    }

    const per = scene.duration / photos.length;
    const idx = Math.min(photos.length - 1, Math.floor(p * photos.length));
    const lp = clamp01((p * photos.length - idx) / 1);
    const photo = photos[idx];

    const zoom = 1.12 + Math.sin(lp * Math.PI) * 0.06;
    const rot = (lp - 0.5) * 0.04;
    const cx = DESIGN_W / 2;
    const cy = DESIGN_H * 0.42;
    const bw = DESIGN_W * 0.74;
    const bh = DESIGN_H * 0.46;
    const appear = smoothstep(0, 0.18, lp);
    const leave = smoothstep(0.86, 1.0, lp);
    const alpha = clamp01(appear * (1 - leave)) * 0.96;

    this.drawPhotoFrame(ctx, cx, cy, bw, bh, theme.accent, alpha, rot);
    this.drawPhotoImage(ctx, photo.url, cx, cy, bw - 14, bh - 14, zoom, rot, alpha, info);

    const capY = cy + bh / 2 + 96;
    if (photo.caption) {
      ctx.save();
      ctx.globalAlpha = alpha;
      this.glowText(ctx, photo.caption, cx, capY, 40, "'Dancing Script', cursive", theme.accentSoft, {
        blur: 16,
        weight: "700",
      });
      ctx.restore();
    }

    for (let i = 0; i < photos.length; i++) {
      const x = DESIGN_W / 2 - (photos.length - 1) * 9 + i * 18;
      ctx.beginPath();
      ctx.arc(x, DESIGN_H * 0.86, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === idx ? theme.gold : theme.accentSoft;
      ctx.globalAlpha = i === idx ? 1 : 0.4;
      ctx.fill();
    }

    this.drawSparkles(ctx, t, 26, seededRng(card.id + "|ph" + idx), { yy0: 160, yy1: DESIGN_H - 200, size: 9 });
  }

  private drawPhotoFallback(ctx: CanvasRenderingContext2D, t: number, p: number): void {
    const theme = this.themeConfig;
    const cx = DESIGN_W / 2;
    const cy = DESIGN_H * 0.44;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.2);
    const r = 190 + pulse * 14;
    const scale = easeOutCubic(clamp01(p * 1.4));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = smoothstep(0, 0.6, p);
    ctx.beginPath();
    ctx.arc(0, 0, r + pulse * 10, 0, Math.PI * 2);
    ctx.fillStyle = theme.accentSoft + "2e";
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    const ini = ((this.cardData.recipientName ?? "S").trim()[0] ?? "S").toUpperCase();
    ctx.font = `900 ${r * 0.7}px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 40;
    ctx.fillStyle = theme.text;
    ctx.fillText(ini, 0, 0);
    ctx.restore();
  }

  private roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private drawPhotoFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    alpha: number,
    rot: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha * 0.85;
    ctx.shadowColor = color;
    ctx.shadowBlur = 34;
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    this.roundRectPath(ctx, -w / 2, -h / 2, w, h, 26);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.6;
    this.roundRectPath(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 18);
    ctx.stroke();
    ctx.restore();
  }

  private drawPhotoImage(
    ctx: CanvasRenderingContext2D,
    url: string,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number,
    rot: number,
    alpha: number,
    info: Info,
  ): void {
    const img = !!info.images ? info.images.get(url) : imageCache.get(url);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    this.roundRectPath(ctx, -w / 2, -h / 2, w, h, 22);
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      const cw = img.naturalWidth;
      const ch = img.naturalHeight;
      const sc = Math.max((w - 8) / cw, (h - 8) / ch) / zoom;
      const dw = cw * sc;
      const dh = ch * sc;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, this.themeConfig.accent + "55");
      g.addColorStop(1, this.themeConfig.accentSoft + "33");
      ctx.fillStyle = g;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.font = `600 34px 'Jost', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = this.themeConfig.textSoft;
      ctx.fillText("âœ¿", 0, 0);
    }
    ctx.restore();
  }

  // ----- 3. MESSAGE -----
  protected drawMessage(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    const theme = this.themeConfig; const card = this.cardData; const timelineInfo = this.timelineInfo;
    this.motifBg(ctx, t);
    const scene = timelineInfo.scenes[3];
    const p = clamp01((t - scene.start) / scene.duration);
    const cx = DESIGN_W / 2;
    const text = (card.message ?? "").trim();
    const chars = [...text];

    ctx.save();
    ctx.translate(cx, DESIGN_H * 0.14);
    ctx.globalAlpha = smoothstep(0, 0.12, p);
    this.glowText(ctx, "A LITTLE NOTE", 0, 0, 38, "'Jost', sans-serif", theme.accentSoft, {
      blur: 14,
      letterSpacing: 10,
      weight: "700",
    });
    ctx.restore();

    if (!text) {
      ctx.save();
      ctx.translate(cx, DESIGN_H * 0.5);
      ctx.globalAlpha = smoothstep(0.2, 0.7, p);
      this.glowText(ctx, "â¤", 0, 0, 90, "sans-serif", theme.gold, { blur: 30 });
      ctx.restore();
      return;
    }

    const y0 = DESIGN_H * 0.24;
    const maxW = DESIGN_W * 0.8;
    const maxLines = 7;
    let fontSize = 52;
    const fit = (s: number) => {
      const lns = this.wrapText(ctx, text, maxW, s);
      if (lns.length > maxLines) return null;
      const wMax = Math.max(...lns.map((l) => ctx.measureText(l).width));
      const hAll = lns.length * s * 1.5;
      if (wMax > maxW || hAll > DESIGN_H * 0.42) return null;
      return { lns, s };
    };
    let fitted = fit(fontSize);
    while (!fitted && fontSize > 30) {
      fontSize -= 2;
      fitted = fit(fontSize);
    }
    const lines = fitted!.lns;
    const fs = fitted!.s;
    const lineH = fs * 1.5;

    const appear = smoothstep(0.12, 0.55, p);
    const totalChars = chars.length;
    const typed = Math.floor(clamp01((p - 0.14) * 2.4) * totalChars);

    ctx.save();
    ctx.globalAlpha = appear;
    ctx.font = `600 ${fs}px 'Jost', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = theme.textSoft;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 16;

    let remaining = typed;
    for (let li = 0; li < lines.length; li++) {
      const rev = remaining; // chars allowed on this line
      let visible = "";
      for (const ch of lines[li]) {
        if (remaining > 0) {
          visible += ch;
          remaining--;
        }
      }
      void rev;
      const ly = y0 + li * lineH;
      ctx.globalAlpha = appear;
      ctx.fillText(visible, cx - maxW / 2, ly);
      if (li === lines.length - 1 && typed < totalChars) {
        const cxm = ctx.measureText(visible).width;
        const blink = Math.sin(t * 4) > 0 ? 1 : 0.1;
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = appear * blink;
        ctx.fillText("â–", cx - maxW / 2 + cxm + 2, ly);
      }
    }
    ctx.restore();

    if (typed >= totalChars && totalChars > 0 && p > 0.8) {
      ctx.save();
      ctx.globalAlpha = smoothstep(0.8, 1.0, p) * 0.9;
      this.glowText(ctx, "â¦", cx, y0 + (lines.length - 1) * lineH + 56, 44, "sans-serif", theme.gold, { blur: 22 });
      ctx.restore();
    }

    this.drawSparkles(ctx, t, 12, seededRng(card.id + "|msg"), { yy0: 220, yy1: DESIGN_H - 240, size: 8 });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, fs: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const probe = cur ? cur + " " + w : w;
      if (ctx.measureText(probe).width <= maxW || !cur) {
        cur = probe;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ----- 4. FINALE -----
  protected drawFinale(ctx: CanvasRenderingContext2D, t: number): void {
    const theme = this.themeConfig; const card = this.cardData; const timelineInfo = this.timelineInfo;
    this.motifBg(ctx, t);
    const scene = timelineInfo.scenes[4];
    const p = clamp01((t - scene.start) / scene.duration);
    const cx = DESIGN_W / 2;
    const cy = DESIGN_H * 0.4;

    const ringR = 300 + Math.sin(t * 1.1) * 6;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.12);
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, ringR - i * 60 - 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate(Math.PI / 6);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const x = Math.cos(ang) * (ringR - 60);
      const y = Math.sin(ang) * (ringR - 60);
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.globalAlpha = 0.4 + tw * 0.6;
      this.drawDiya(ctx, 0, 0, 30 + tw * 5, theme.accent, theme.gold, t + i);
      ctx.restore();
    }
    ctx.restore();

    const bigIn = smoothstep(0.15, 0.4, p);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = bigIn;
    ctx.rotate((1 - bigIn) * 0.04);
    ctx.font = `900 72px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 44;
    ctx.fillStyle = theme.text;
    ctx.fillText("HAPPY RAKSHA", 0, -60);
    ctx.fillText("BANDHAN!", 0, 34);
    ctx.shadowBlur = 0;
    ctx.font = `700 52px 'Dancing Script', cursive`;
    ctx.fillStyle = theme.accentSoft;
    ctx.fillText((card.recipientName ?? "Sister") + " â™¥", 0, 138, 640);
    ctx.restore();

    if (p > 0.5) {
      this.drawFireworks(ctx, t, 2);
    }
    this.drawSparkles(ctx, t, 34, seededRng(card.id + "|fin"), { yy0: 140, yy1: DESIGN_H - 160, size: 10 });
  }

  private drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, body: string, flame: string, t: number): void {
    void flame;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 1.1, r * 0.48, 0, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.globalAlpha *= 0.9;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.12, r * 0.9, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill();
    const flick = 0.82 + 0.36 * Math.sin(t * 9.5) * Math.cos(t * 3.1);
    const flameH = r * (1.5 + flick * 0.5);
    ctx.globalAlpha *= 0.95;
    ctx.shadowColor = "rgba(255,170,60,0.9)";
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.15);
    ctx.bezierCurveTo(-r * 0.34, -r * 0.9 - flameH * 0.3, r * 0.34, -r * 0.9 - flameH * 0.3, 0, -r * 0.15);
    ctx.fillStyle = "rgba(255,214,110,0.95)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.12);
    ctx.bezierCurveTo(-r * 0.16, -r * 0.5 - flameH * 0.16, r * 0.16, -r * 0.5 - flameH * 0.16, 0, -r * 0.12);
    ctx.fillStyle = "rgba(255,244,190,0.98)";
    ctx.fill();
    ctx.restore();
  }

  private drawFireworks(ctx: CanvasRenderingContext2D, t: number, count: number): void {
    const rng = seededRng(this.cardData.id + "|fw");
    for (let i = 0; i < count; i++) {
      const fx = rng() * DESIGN_W;
      const fy = rng() * DESIGN_H * 0.5 + 80;
      const burstT = ((t * 0.55 + i * 0.31) % 1.4) / 1.4;
      const rad = burstT * 190;
      const alpha = burstT < 0.8 ? 1 - burstT * 0.9 : 0;
      const n = 14;
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2 + i;
        const px = fx + Math.cos(ang) * rad;
        const py = fy + Math.sin(ang) * rad;
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = k % 2 === 0 ? this.themeConfig.gold : this.themeConfig.accent;
        ctx.beginPath();
        ctx.arc(px, py, 5 * (1 - burstT * 0.55), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (burstT < 0.25) {
        ctx.save();
        ctx.globalAlpha = (1 - burstT * 4) * 0.5;
        ctx.strokeStyle = this.themeConfig.accentSoft;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx, fy, rad * (0.4 + burstT), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}



