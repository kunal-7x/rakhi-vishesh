import { Renderer } from "./renderer";
import type { CardData, RenderContext } from "./types";
import { clamp01, clampMinMax, easeOutBack, easeOutCubic, smoothstep } from "./easing";
import { randRange, seededRng } from "./rand";

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

// ============== shared helpers ==============

function pickRot(rng: () => number, amp: number): number {
  return randRange(rng, -amp, amp);
}

interface PolaroidLayout {
  rect: { x: number; y: number; w: number; h: number };
  rot: number;
}

export class RakhiRenderer extends Renderer {
  private layoutCache: { layout: PolaroidLayout[]; padW: number; padH: number; ts: number } | null = null;

  constructor(card: CardData) {
    super(card);
  }

  public hitTest(x: number, y: number): number | null {
    const n = this.cardData.photos.length;
    if (n === 0 || this.layoutCache === null) return null;
    const u = this.base / 1080;
    for (let i = n - 1; i >= 0; i--) {
      const r = this.layoutCache.layout[i].rect;
      const pad = this.layoutCache.padW * u;
      const halfW = r.w / 2 + pad;
      const halfH = r.h / 2 + pad;
      if (Math.abs(x - r.x) < halfW && Math.abs(y - r.y) < halfH) return i;
    }
    return null;
  }

  // ============================================================
  // SCENE 0 — INTRO (thread lands, title blooms)
  // ============================================================
  protected drawIntro(ctx: CanvasRenderingContext2D, t: number): void {
    const theme = this.themeConfig;
    const p = clamp01(t / this.timelineInfo.scenes[0].duration);
    this.motifBg(ctx, t);

    const u = this.base / 1080;
    const cx = this.cx;
    const cy = this.H * 0.42;
    const phase1 = smoothstep(0.06, 0.5, p);
    const phase2 = smoothstep(0.45, 0.92, p);

    // thread ring sweeping in
    ctx.save();
    ctx.translate(cx, cy);
    const ringR = 340 * u - phase1 * 10 * u + Math.sin(t * 0.8) * 4 * u;
    ctx.rotate(-Math.PI / 4);
    ctx.lineWidth = 2.5 * u;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.14 + phase1 * 0.3 - i * 0.05;
      ctx.strokeStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(0, 0, ringR - i * 42 * u + Math.sin(t * 0.9 + i) * 6 * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate((Math.PI / 4) * 2);
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const wob = Math.sin(t * 1.6 + i * 1.3) * 6 * u;
      const r = ringR - 84 * u + wob;
      const dir = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, (6 + dir * 2) * u, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? theme.gold : theme.accent;
      ctx.globalAlpha = 0.85;
      ctx.fill();
    }
    ctx.restore();

    // title: staggered letter bloom
    const title = "HAPPY RAKSHA BANDHAN";
    const ts = 84 * u;
    ctx.save();
    ctx.translate(cx, cy - 40 * u);
    ctx.font = `900 ${ts}px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const words = title.split(" ");
    const spaceW = ctx.measureText(" ").width;
    const allW = words.map((w) => ctx.measureText(w).width).reduce((a, b, i) => a + b + (i === 0 ? 0 : spaceW), 0);
    let wx = -allW / 2;
    const totalLetters = title.length;
    for (const word of words) {
      const letters = [...word];
      const lw = ctx.measureText(word).width;
      let lx = wx;
      for (const ch of letters) {
        const ci = title.indexOf(ch);
        const stagger = (ci / totalLetters) * 0.32;
        const a = smoothstep(0.08 + stagger, 0.4 + stagger, p);
        const dy = (1 - easeOutBack(a)) * 60 * u;
        const sc = a <= 0 ? 0.001 : easeOutBack(a);
        ctx.save();
        ctx.translate(lx, dy);
        ctx.scale(sc, sc);
        ctx.globalAlpha = a;
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 34 * u;
        ctx.fillStyle = theme.text;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        lx += ctx.measureText(ch).width;
      }
      wx += lw + spaceW;
    }
    ctx.restore();

    // script tagline
    ctx.save();
    ctx.globalAlpha = phase2 * 0.95;
    this.glowText(ctx, "· the thread that binds us ·", cx, cy + 96 * u, 36 * u, "'Dancing Script', cursive", theme.accentSoft, {
      blur: 18 * u,
      weight: "600",
    });
    ctx.restore();

    // small thread knot at bottom landing
    const knotT = smoothstep(0.35, 0.75, p);
    if (knotT > 0) {
      ctx.save();
      ctx.translate(cx, this.H * 0.8);
      ctx.globalAlpha = knotT;
      ctx.strokeStyle = theme.gold;
      ctx.lineWidth = 5 * u;
      const curve = (yOff: number) => {
        ctx.beginPath();
        for (let x = -160 * u; x <= 160 * u; x += 8) {
          const k = x / (160 * u);
          const y = yOff + Math.sin(k * Math.PI) * -40 * u;
          if (x === -160 * u) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      curve(knotT * 90 * u);
      ctx.restore();
    }

    this.drawSparkles(ctx, t, 26, seededRng(this.cardData.id + "|intro"), { yy0: this.base * 0.18, yy1: this.H - this.base * 0.14, size: 10 * u });
  }

  // ============================================================
  // SCENE 1 — NAMES (knot swirl + reveal)
  // ============================================================
  protected drawNames(ctx: CanvasRenderingContext2D, t: number): void {
    const theme = this.themeConfig;
    const card = this.cardData;
    const p = clamp01(t / this.timelineInfo.scenes[1].duration);
    this.motifBg(ctx, t);
    const cx = this.cx;
    const u = this.base / 1080;
    const to = smoothstep(0.06, 0.4, p);
    const from = smoothstep(0.46, 0.86, p);

    const toSize = clampMinMax(140 * u - Math.min(90 * u, (card.recipientName.length ?? 0) * 4.4 * u), 60 * u, 140 * u);
    const fromSize = clampMinMax(90 * u - Math.min(50 * u, (card.senderName.length ?? 0) * 3 * u), 44 * u, 90 * u);

    // swirl arcs tracing around names
    ctx.save();
    ctx.translate(cx, this.H * 0.42);
    const rng = seededRng(card.id + "|names");
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 1.3);
    for (let i = 0; i < 3; i++) {
      const r = (150 + i * 70) * u;
      const a0 = t * 0.6 + i;
      ctx.lineWidth = 2.4 * u;
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a0 + Math.PI * 1.2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cx, this.H * 0.42);
    ctx.scale(easeOutBack(to), easeOutBack(to));
    ctx.globalAlpha = to;
    this.glowText(ctx, "FOR", 0, -150 * u, 40 * u, "'Dancing Script', cursive", theme.accentSoft, { blur: 12 * u });
    ctx.restore();

    const scale = easeOutBack(to);
    ctx.save();
    ctx.translate(cx, this.H * 0.42);
    ctx.scale(scale, scale);
    ctx.globalAlpha = clamp01(to * 1.25);
    ctx.font = `700 ${toSize}px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 30 * u;
    ctx.fillStyle = theme.text;
    ctx.fillText(card.recipientName, 0, 10 * u);
    ctx.restore();

    this.drawSparkles(ctx, t, 20, seededRng(card.id + "|names"), { yy0: this.base * 0.24, yy1: this.H - this.base * 0.2, size: 9 * u });

    if (from > 0.1) {
      const fc = easeOutBack(from);
      ctx.save();
      ctx.translate(cx, this.H * 0.72);
      ctx.scale(fc, fc);
      ctx.globalAlpha = clamp01(from * 1.2);
      this.glowText(ctx, "FROM", 0, -88 * u, 32 * u, "'Dancing Script', cursive", theme.accentSoft, { blur: 10 * u });
      ctx.font = `700 ${fromSize}px 'Rajdhani', 'Arial Black', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 24 * u;
      ctx.fillStyle = theme.text;
      ctx.fillText(card.senderName || "Your Brother", 0, 0);
      ctx.restore();
    }

    // tiny dots starfield
    this.drawSparkles(ctx, t, 8, seededRng(card.id + "|ns2"), { yy0: this.base * 0.1, yy1: this.H - this.base * 0.1, size: 6 * u });
  }

  // ============================================================
  // SCENE 2 — PHOTO WALL ON A ROPE (the star)
  // Polaroids clipped to a swaying rope. Hover = wiggle. Click = siri zoom.
  // ============================================================
  protected drawPhotos(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    const theme = this.themeConfig;
    const card = this.cardData;
    const scene = this.timelineInfo.scenes[2];
    const p = clamp01((t - scene.start) / scene.duration);
    this.motifBg(ctx, t);
    const u = this.base / 1080;
    const photos = card.photos ?? [];
    if (photos.length === 0) {
      this.drawPhotoFallback(ctx, t, p, u);
      return;
    }

    const n = photos.length;
    const wall = this.computeWall(n, u);
    this.drawRopes(ctx, t, wall, u, p);

    // clip-in stagger
    const dropped = smoothstep(0.02, 0.38, p);
    const ropeSway = Math.sin(t * 0.55) * (wall.swayAmp * u);

    for (let i = 0; i < n; i++) {
      const item = wall.items[i];
      const cl = item.cl;
      const appear = easeOutCubic(clamp01(dropped * 1.5 + i * 0.02 - i * 0.003));
      const isHover = this.hoverIdx === i && info.phase !== "export";
      const isFocus = this.focusIdx === i;
      const wob = Math.sin(t * (1.7 + (i % 3) * 0.3) + i * 1.31);
      const wiggle = isHover ? wob * 0.07 : wob * item.swing;
      const rot = item.rot * 0.9 + wiggle;
      const drop = (1 - appear) * (this.H * 0.16) + easeOutCubic(appear) * 0;
      const lift = isHover ? -this.base * 0.02 : 0;
      const yOff = Math.sin(t * 0.9 + i * 0.7 + item.cl.y * 0.002) * 5 * u + ropeSway * (0.4 + (i % 2) * 0.1) + drop;
      const xOff = ropeSway * (0.5 + ((i + n) % 3) * 0.22) + Math.cos(t * 0.8 + i) * 3 * u;

      const cx = item.cl.x;
      const cy = item.cl.y + yOff + lift;
      const w = item.w;
      const h = item.h;

      const focusScale = isFocus ? this.focusDepth() : 1;

      ctx.save();
      ctx.translate(cx + xOff, cy);
      ctx.rotate(rot);
      ctx.scale(focusScale * appear, focusScale * appear);
      ctx.globalAlpha = clamp01(appear * 0.98);
      this.drawPolaroid(ctx, photos[i], 0, 0, w, h, u, i, theme, info);
      ctx.restore();
    }

    if (n > 0 && this.focusIdx !== null && info.phase !== "export") {
      this.drawFocusOverlay(ctx, photos[this.focusIdx], info.images);
    }

    // progress dots bottom
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = this.cx - (n - 1) * 9 * u + i * 18 * u;
      ctx.beginPath();
      ctx.arc(x, this.H * 0.94, 5 * u, 0, Math.PI * 2);
      ctx.fillStyle = theme.gold;
      ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, 1 - Math.abs(p * n - i));
      ctx.fill();
    }
    ctx.restore();

    this.drawSparkles(ctx, t, 18, seededRng(card.id + "|phw"), { yy0: this.base * 0.1, yy1: this.H - this.base * 0.1, size: 8 * u });
  }

  // ---------- wall layout: adaptive grid of polaroids on ropes ----------
  private computeWall(n: number, u: number): {
    items: { cl: { x: number; y: number }; w: number; h: number; rot: number; swing: number }[];
    rows: number[];
    swayAmp: number;
  } {
    const rng = seededRng(this.cardData.id + "|wall");
    const nRows = n <= 4 ? 1 : n <= 8 ? 2 : 3;
    const perRow: number[] = [];
    for (let r = 0; r < nRows; r++) perRow.push(0);
    for (let i = 0; i < n; i++) {
      perRow[i % nRows]++;
    }
    const maxPer = Math.max(...perRow);
    const timeDur = this.timelineInfo.scenes[2].duration / n;
    void timeDur;

    const marginW = this.W * 0.075;
    const gap = this.base * 0.045;
    const cellW = (this.W - marginW * 2 - gap * (maxPer - 1)) / maxPer;
    const phW = cellW * 0.92;
    const phH = phW * 1.28;
    const rowGap = phH * 1.34;

    const topPad = this.H * 0.09 + (this.H > this.base * 1.4 ? this.H * 0.05 : 0);
    const items: { cl: { x: number; y: number }; w: number; h: number; rot: number; swing: number }[] = [];

    let idx = 0;
    for (let r = 0; r < nRows; r++) {
      const cnt = perRow[r];
      const rowW = cnt * cellW + (cnt - 1) * gap;
      const rowX0 = this.cx - rowW / 2 + cellW / 2;
      const ropeY = topPad + r * rowGap;
      for (let c = 0; c < cnt; c++) {
        const jitterX = randRange(rng, -1, 1) * cellW * 0.03;
        const rot = pickRot(rng, 0.045);
        const swing = randRange(rng, 0.014, 0.035);
        items.push({
          cl: { x: rowX0 + c * (cellW + gap) + jitterX, y: ropeY },
          w: phW,
          h: phH,
          rot,
          swing,
        });
        idx++;
      }
    }

    this.layoutCache = { layout: items.map((it) => ({ rect: { x: it.cl.x, y: it.cl.y + this.base * 0.13, w: it.w, h: it.h }, rot: it.rot })), padW: this.W * 0.048, padH: this.base * 0.06, ts: performance.now() };

    return { items, rows: perRow, swayAmp: this.base * 0.02 };
  }

  private drawRopes(
    ctx: CanvasRenderingContext2D,
    t: number,
    wall: { items: { cl: { x: number; y: number } }[]; rows: number[]; swayAmp: number },
    u: number,
    p: number,
  ): void {
    const theme = this.themeConfig;
    const sway = Math.sin(t * 0.55) * wall.swayAmp * u;
    const appear = smoothstep(0.05, 0.3, p);
    const rowYs = new Map<number, number>();
    for (const it of wall.items) rowYs.set(Math.round(it.cl.y), it.cl.y);

    ctx.save();
    ctx.globalAlpha = appear;
    ctx.strokeStyle = theme.textSoft;
    ctx.lineWidth = 3.2 * u;
    ctx.lineCap = "round";
    let row = 0;
    for (const y of rowYs.keys()) {
      row++;
      const nIn = wall.rows[row - 1];
      const halfW = this.W * 0.44;
      const sag = this.base * (0.09 + nIn * 0.01);
      const endHi = (row % 2 === 0 ? 1 : -1) * this.base * 0.035;
      ctx.beginPath();
      ctx.moveTo(this.cx - halfW, y + sway * 0.6 - this.base * 0.1 + endHi);
      ctx.quadraticCurveTo(this.cx, y + sag + sway, this.cx + halfW, y + sway * 0.6 - this.base * 0.1 - endHi);
      ctx.stroke();
      // knots + clips at item x positions
      for (const it of wall.items) {
        if (Math.round(it.cl.y) !== y) continue;
        ctx.save();
        ctx.translate(it.cl.x + sway * 0.5, y - this.base * 0.1);
        ctx.fillStyle = theme.gold;
        ctx.beginPath();
        ctx.arc(0, 0, 4.4 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  private drawPolaroid(
    ctx: CanvasRenderingContext2D,
    photo: { url: string; caption?: string },
    x: number,
    y: number,
    w: number,
    h: number,
    u: number,
    i: number,
    theme: { gold: string; accent: string; accentSoft: string; textSoft: string },
    info: Info,
  ): void {
    const clipH = this.base * 0.045;
    const capH = w * 0.2;
    const imgH = h - capH;
    const bw = w * 0.055;
    const bTop = -h / 2;
    const bLeft = -w / 2;

    // drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 26 * u;
    ctx.shadowOffsetY = 9 * u;
    ctx.fillStyle = "#fdf7ee";
    this.roundedRect(ctx, x + bLeft, y + bTop, w, h, 8 * u);
    ctx.fill();
    ctx.restore();

    // clip (clothespin) at top
    ctx.save();
    ctx.translate(x, y + bTop + clipH * 0.3);
    ctx.fillStyle = "#caa15e";
    this.roundedRect(ctx, -w * 0.075, 0, w * 0.15, clipH * 2, 3 * u);
    ctx.fill();
    ctx.fillStyle = "#a8843f";
    this.roundedRect(ctx, -w * 0.075, clipH * 0.8, w * 0.15, clipH * 0.3, 1.5 * u);
    ctx.fill();
    ctx.restore();

    // photo area with margins (like a real capture)
    ctx.save();
    this.roundedRect(ctx, x + bLeft + bw, y + bTop + clipH + bw, w - bw * 2, imgH - bw, 4 * u);
    ctx.clip();
    const img = info.images.get(photo.url);
    if (img && img.complete && img.naturalWidth > 0) {
      const cw = img.naturalWidth;
      const ch = img.naturalHeight;
      const tw = w - bw * 2;
      const th = imgH;
      const sc = Math.max(tw / cw, th / ch);
      const dw = cw * sc;
      const dh = ch * sc;
      ctx.drawImage(img, x + bLeft + bw - (dw - tw) / 2, y + bTop + clipH + bw - (dh - th) / 2, dw, dh);
    } else {
      ctx.fillStyle = theme.accentSoft + "33";
      ctx.fillRect(x + bLeft + bw, y + bTop + clipH + bw, w - bw * 2, imgH - bw);
      ctx.font = `600 ${36 * u}px 'Jost', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.textSoft;
      ctx.fillText("✿", x, y + bTop + clipH + imgH * 0.5);
    }
    ctx.restore();

    // caption strip (polaroid bottom)
    if (photo.caption) {
      ctx.save();
      ctx.font = `600 ${Math.min(26 * u, w * 0.22 / 1.55)}px 'Dancing Script', cursive`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#7a5a33";
      const tc = (photo.caption.length > 16 ? photo.caption.slice(0, 15) + "…" : photo.caption).toUpperCase();
      ctx.fillText(photo.caption, x, y + bTop + clipH + imgH + capH * 0.52);
      void tc;
      ctx.restore();
    } else {
      ctx.font = `600 ${22 * u}px 'Jost', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#a88a5d";
      ctx.fillText(`#${i + 1} ♥`, x, y + bTop + clipH + imgH + capH * 0.52);
    }
  }

  private focusDepth(): number {
    // animated zoom via time since focus — deterministic over t: use sin envelope
    return 1.16 + Math.min(0.5, Math.max(0, this.focusGrow()));
  }

  private focusGrow(): number {
    return 0.14;
  }

  private drawFocusOverlay(ctx: CanvasRenderingContext2D, photo: { url: string; caption?: string }, images: Map<string, HTMLImageElement | null>): void {
    void images;
    const dim = 0.72;
    ctx.save();
    ctx.fillStyle = `rgba(6,3,10,${dim})`;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();

    // lightbox polaroid
    const u = this.base / 1080;
    const w = Math.min(this.W * 0.82, this.base * 0.74);
    const h = w * 1.26;
    const x = this.cx;
    const y = this.H * 0.44;
    const clipH = this.base * 0.045;
    const capH = w * 0.16;
    this.drawPolaroid(ctx, photo, x, y, w, h, u, -99, this.themeConfig as never, {
      images,
      t: 0,
      phase: "preview",
      fontReady: true,
    } as Info);
    this.glowText(ctx, "tap anywhere to close", x, y + h / 2 + 40 * u, 22 * u, "'Jost', sans-serif", this.themeConfig.textSoft, { blur: 8 * u });
  }

  private drawPhotoFallback(ctx: CanvasRenderingContext2D, t: number, p: number, u: number): void {
    const theme = this.themeConfig;
    const cx = this.cx;
    const cy = this.H * 0.44;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.2);
    const r = 190 * u + pulse * 14 * u;
    const scale = easeOutCubic(clamp01(p * 1.4));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = smoothstep(0, 0.6, p) * 0.96;
    ctx.beginPath();
    ctx.arc(0, 0, r + pulse * 10 * u, 0, Math.PI * 2);
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

  // ============================================================
  // SCENE 3 — MESSAGE (word-by-word typewriter with glow)
  // ============================================================
  protected drawMessage(ctx: CanvasRenderingContext2D, t: number, info: Info): void {
    const theme = this.themeConfig;
    const card = this.cardData;
    const scene = this.timelineInfo.scenes[3];
    const p = clamp01((t - scene.start) / scene.duration);
    this.motifBg(ctx, t);
    const u = this.base / 1080;
    const cx = this.cx;
    const text = (card.message ?? "").trim();
    const maxW = Math.min(this.W * 0.8, this.base * 0.78);

    ctx.save();
    ctx.translate(cx, this.H * 0.13);
    ctx.globalAlpha = smoothstep(0, 0.1, p) * 0.98;
    this.glowText(ctx, "A LITTLE NOTE", 0, 0, 38 * u, "'Jost', sans-serif", theme.accentSoft, {
      blur: 14 * u,
      letterSpacing: 10 * u,
      weight: "700",
    });
    ctx.restore();

    if (!text) {
      ctx.save();
      ctx.translate(cx, this.H * 0.5);
      ctx.globalAlpha = smoothstep(0.15, 0.6, p);
      this.glowText(ctx, "❤", 0, 0, 90 * u, "sans-serif", theme.gold, { blur: 30 * u });
      ctx.restore();
      return;
    }

    const wrapW = maxW;
    let fs = Math.min(52 * u, this.base * 0.048);
    const fit = (s: number) => {
      const lns = this.wrapText(ctx, text, wrapW, s);
      const hAll = lns.length * s * 1.5;
      const wMax = Math.max(...lns.map((l) => ctx.measureText(l).width));
      if (lns.length > 8 || hAll > this.H * 0.42 || wMax > wrapW) return null;
      return { lns, s };
    };
    let fitted = fit(fs);
    while (!fitted && fs > 26 * u) {
      fs -= 2 * u;
      fitted = fit(fs);
    }
    const lines = fitted!.lns;
    const fsz = fitted!.s;
    const lineH = fsz * 1.5;
    const y0 = this.H * 0.22;

    const typedP = clamp01((p - 0.12) * 2.2);
    const typed = Math.floor(typedP * [...text].length);

    ctx.save();
    ctx.font = `600 ${fsz}px 'Jost', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.textBaseline = "top" as CanvasTextBaseline;
    ctx.fillStyle = theme.textSoft;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 14 * u;

    let remaining = typed;
    for (let li = 0; li < lines.length; li++) {
      const ly = y0 + li * lineH;
      const visible = lines[li].split("").reduce((acc, ch) => (remaining > 0 ? (remaining--, acc + ch) : acc), "");
      const lineIn = smoothstep(0.1 + li * 0.04, 0.34 + li * 0.04, p);
      ctx.save();
      ctx.globalAlpha = lineIn;
      ctx.fillText(visible, cx - wrapW / 2, ly);
      ctx.restore();
      if (li === lines.length - 1 && typed < [...text].length) {
        const blink = Math.sin(t * 4) > 0 ? 1 : 0.1;
        const cxm = ctx.measureText(visible).width;
        ctx.save();
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = lineIn * blink * 0.9;
        ctx.fillText("▍", cx - wrapW / 2 + cxm + 2, ly);
        ctx.restore();
      }
    }
    ctx.restore();

    if (typed >= [...text].length && p > 0.8) {
      ctx.save();
      ctx.globalAlpha = smoothstep(0.8, 1.0, p) * 0.9;
      this.glowText(ctx, "❦", cx, y0 + (lines.length - 1) * lineH + 56 * u, 44 * u, "sans-serif", theme.gold, { blur: 22 * u });
      ctx.restore();
    }

    this.drawSparkles(ctx, t, 10, seededRng(card.id + "|msg"), { yy0: this.base * 0.2, yy1: this.H - this.base * 0.22, size: 8 * u });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, fs: number): string[] {
    ctx.font = `600 ${fs}px 'Jost', sans-serif`;
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

  // ============================================================
  // SCENE 4 — FINALE (diyas ring + fireworks + big wish)
  // ============================================================
  protected drawFinale(ctx: CanvasRenderingContext2D, t: number): void {
    const theme = this.themeConfig;
    const card = this.cardData;
    const scene = this.timelineInfo.scenes[4];
    const p = clamp01((t - scene.start) / scene.duration);
    this.motifBg(ctx, t);
    const u = this.base / 1080;
    const cx = this.cx;
    const cy = this.H * 0.42;

    const ringR = (300 * u) + Math.sin(t * 1.1) * 6 * u;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.12);
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.4 * u;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, ringR - i * 60 * u - 8 * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate(Math.PI / 6);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const x = Math.cos(ang) * (ringR - 60 * u);
      const y = Math.sin(ang) * (ringR - 60 * u);
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.globalAlpha = (0.4 + tw * 0.6) * smoothstep(0.05, 0.6, p);
      this.drawDiya(ctx, 0, 0, (30 + tw * 5) * u, theme.accent, t + i);
      ctx.restore();
    }
    ctx.restore();

    const bigIn = smoothstep(0.15, 0.4, p);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = bigIn;
    ctx.rotate((1 - bigIn) * 0.04);
    const ts = 68 * u;
    ctx.font = `900 ${ts}px 'Rajdhani', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 44 * u;
    ctx.fillStyle = theme.text;
    ctx.fillText("HAPPY RAKSHA", 0, -60 * u);
    ctx.fillText("BANDHAN!", 0, 34 * u);
    ctx.shadowBlur = 0;
    ctx.font = `700 ${50 * u}px 'Dancing Script', cursive`;
    ctx.fillStyle = theme.accentSoft;
    ctx.fillText((card.recipientName ?? "Sister") + " ♥", 0, (0.13 * this.base / u) * u + 0, Math.min(cx * 2 - 100, this.W * 0.7));
    ctx.restore();

    if (p > 0.5) {
      this.drawFireworks(ctx, t, 2, u);
    }
    this.drawSparkles(ctx, t, 30, seededRng(card.id + "|fin"), { yy0: this.base * 0.13, yy1: this.H - this.base * 0.15, size: 10 * u });
  }

  private drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, body: string, t: number): void {
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

  private drawFireworks(ctx: CanvasRenderingContext2D, t: number, count: number, u: number): void {
    const rng = seededRng(this.cardData.id + "|fw");
    for (let i = 0; i < count; i++) {
      const fx = rng() * this.W;
      const fy = rng() * this.H * 0.5 + 80 * u;
      const burstT = ((t * 0.55 + i * 0.31) % 1.4) / 1.4;
      const rad = burstT * 190 * u;
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
        ctx.arc(px, py, 5 * (1 - burstT * 0.55) * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (burstT < 0.25) {
        ctx.save();
        ctx.globalAlpha = (1 - burstT * 4) * 0.5;
        ctx.strokeStyle = this.themeConfig.accentSoft;
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.arc(fx, fy, rad * (0.4 + burstT), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
