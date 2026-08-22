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
  // ---- realistic rakhi helper ----
  private drawRealisticRakhi(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number): void {
    const u = this.base / 1080;
    const theme = this.themeConfig;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // shadow under rakhi
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(0, 18*u, 140*u, 28*u, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    // silk threads draping down
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 3.2*u; ctx.lineCap = "round";
    for (let i=-1;i<=1;i+=2){
      ctx.beginPath(); ctx.moveTo(i*10*u, 14*u);
      ctx.bezierCurveTo(i*22*u, 62*u, i*16*u, 118*u, i*8*u, 170*u); ctx.stroke();
      // tassel pompom
      ctx.fillStyle = i<0 ? theme.gold : theme.accentSoft; ctx.beginPath(); ctx.arc(i*8*u, 182*u, 10*u,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = theme.text; ctx.globalAlpha=0.9; ctx.beginPath(); ctx.arc(i*8*u, 182*u, 3.2*u,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      // beads along thread
      for(let b=0;b<3;b++){ const by=38*u + b*36*u; ctx.fillStyle= theme.gold; ctx.beginPath(); ctx.arc(i*(10+ b*1.2)*u, by, 4.2*u,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#fff6"; ctx.lineWidth=1.2*u; ctx.stroke(); }
    }
    // outer gold ring with foil highlight
    const grad = ctx.createRadialGradient(-18*u, -18*u, 10*u, 0,0, 56*u);
    grad.addColorStop(0, "#fff8d6"); grad.addColorStop(0.3, theme.gold); grad.addColorStop(0.7, "#b45309"); grad.addColorStop(1, theme.gold);
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0,0,56*u,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#7a4a08"; ctx.lineWidth=2*u; ctx.stroke();
    // inner kundan jewel - faceted red
    const jg = ctx.createRadialGradient(-12*u,-14*u,4*u,0,0,38*u);
    jg.addColorStop(0, "#ff9aa2"); jg.addColorStop(0.4, "#dc2626"); jg.addColorStop(1, "#7f1d1d");
    ctx.fillStyle=jg; ctx.beginPath(); ctx.arc(0,0,36*u,0,Math.PI*2); ctx.fill();
    // highlight sparkle on jewel
    ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.ellipse(-12*u,-12*u,9*u,5*u, -0.6,0,Math.PI*2); ctx.fill();
    // pearl ring around jewel
    for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; const px=Math.cos(a)*46*u, py=Math.sin(a)*46*u; ctx.fillStyle="#fffef8"; ctx.shadowColor="#ffd97a"; ctx.shadowBlur=8*u; ctx.beginPath(); ctx.arc(px,py,5.2*u,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle="#e8cfa0"; ctx.lineWidth=1*u; ctx.stroke(); }
    // small sparkle
    const tw=0.5+0.5*Math.sin(t*3.2); ctx.globalAlpha=0.7+tw*0.3; ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(18*u,-22*u,1.8*u,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  private drawLuxuryDoors(ctx: CanvasRenderingContext2D, t: number, p: number, u: number): void {
    const theme=this.themeConfig;
    const doorOpen = smoothstep(0.18,0.62, p);
    const leftX = -this.W*0.52 * easeOutCubic(doorOpen);
    const rightX = this.W*0.52 * easeOutCubic(doorOpen);
    const glow = 1 - doorOpen;
    // doors cover full canvas
    for(let side=-1; side<=1; side+=2){
      const off = side<0? leftX: rightX;
      ctx.save(); ctx.translate(this.W/2 + off, this.H/2);
      // door panel wood gradient
      const dg = ctx.createLinearGradient(-this.W/2,0,this.W/2,0);
      dg.addColorStop(0, side<0? "#2a0a05":"#4a1408"); dg.addColorStop(0.5, "#5c1a0a"); dg.addColorStop(1, side<0? "#4a1408":"#2a0a05");
      ctx.fillStyle=dg; ctx.fillRect(-this.W/2-2, -this.H/2-2, this.W/2+4, this.H+4);
      // gold ornate border
      ctx.strokeStyle=theme.gold; ctx.lineWidth=10*u; ctx.strokeRect(-this.W/2+14*u, -this.H/2+18*u, this.W/2-28*u, this.H-36*u);
      ctx.strokeStyle="#fff8d6"; ctx.lineWidth=2.2*u; ctx.strokeRect(-this.W/2+22*u, -this.H/2+26*u, this.W/2-44*u, this.H-52*u);
      // carved mandala centre
      ctx.save(); ctx.translate(side<0? this.W/4: -this.W/4, 0);
      ctx.strokeStyle=theme.gold+"66"; ctx.lineWidth=1.6*u;
      for(let r=1;r<=3;r++){ ctx.beginPath(); ctx.arc(0,0, (48+r*38)*u,0,Math.PI*2); ctx.stroke(); }
      for(let a=0;a<8;a++){ const ang=a/8*Math.PI*2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ang)*86*u, Math.sin(ang)*86*u); ctx.stroke(); }
      // handle
      const hx = side<0? 86*u: -86*u; ctx.fillStyle=theme.gold; ctx.shadowColor="#0008"; ctx.shadowBlur=14*u;
      ctx.beginPath(); ctx.arc(hx,0,16*u,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle="#fff6d6"; ctx.beginPath(); ctx.arc(hx-4*u,-3*u,4*u,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // inner bevel highlight
      ctx.fillStyle="rgba(255,255,255,0.07)"; ctx.fillRect(-this.W/2+14*u, -this.H/2+18*u, this.W/2-28*u, 22*u);
      ctx.restore();
    }
    // centre light burst as doors part
    if(doorOpen>0.12){
      const a = smoothstep(0.12,0.55,doorOpen)*(1-doorOpen*0.3);
      ctx.save(); ctx.globalAlpha=a*0.9; const g=ctx.createRadialGradient(this.cx,this.H*0.46,0,this.cx,this.H*0.46, this.W*0.5);
      g.addColorStop(0,"rgba(255,248,214,0.95)"); g.addColorStop(0.35, theme.gold+"88"); g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g; ctx.fillRect(0,0,this.W,this.H); ctx.restore();
    }
  }

  protected drawIntro(ctx: CanvasRenderingContext2D, t: number): void {
    const theme = this.themeConfig;
    const p = clamp01(t / this.timelineInfo.scenes[0].duration);
    this.motifBg(ctx, t);

    const u = this.base / 1080;
    const cx = this.cx;
    const cy = this.H * 0.42;

    // subtle gold dust behind
    this.drawSparkles(ctx, t, 14, seededRng(this.cardData.id + "|intro-dust"), { yy0: this.base * 0.12, yy1: this.H - this.base * 0.18, size: 6 * u });

    // realistic rakhi behind title, grows as doors open
    const rakhiReveal = smoothstep(0.42,0.78,p);
    if(rakhiReveal>0.01){
      ctx.save(); ctx.globalAlpha=rakhiReveal;
      const s = (0.9 + rakhiReveal*0.22 + Math.sin(t*0.7)*0.02)* (this.base/1080*1.08);
      this.drawRealisticRakhi(ctx, cx, cy - 74*u, s, t);
      ctx.restore();
    }

    // title: premium luxury gold-foil Anton staggered bloom, much bigger
    const title = "HAPPY RAKSHA BANDHAN";
    const ts = 118 * u;
    ctx.save();
    ctx.translate(cx, cy + 56*u);
    ctx.font = `400 ${ts}px 'Anton', 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // gold foil gradient for luxury
    const tg = ctx.createLinearGradient(-this.W*0.45,0,this.W*0.45,0);
    tg.addColorStop(0,"#7a4a08"); tg.addColorStop(0.22, theme.gold); tg.addColorStop(0.5,"#fff8d6"); tg.addColorStop(0.78, theme.gold); tg.addColorStop(1,"#7a4a08");
    const words = title.split(" ");
    const spaceW = ctx.measureText(" ").width;
    const allW = words.map((w) => ctx.measureText(w).width).reduce((a, b, i) => a + b + (i === 0 ? 0 : spaceW), 0);
    let wx = -allW / 2;
    const totalLetters = title.replace(/ /g,"").length;
    let li=0;
    for (const word of words) {
      const letters = [...word];
      const lw = ctx.measureText(word).width;
      let lx = wx;
      for (const ch of letters) {
        const stagger = (li / totalLetters) * 0.42;
        const a = smoothstep(0.48 + stagger, 0.78 + stagger, p);
        const dy = (1 - easeOutBack(a)) * 74 * u;
        const sc = a <= 0 ? 0.001 : easeOutBack(a);
        ctx.save();
        ctx.translate(lx, dy);
        ctx.scale(sc, sc);
        ctx.globalAlpha = a;
        ctx.shadowColor = "#000"; ctx.shadowBlur = 22 * u; ctx.shadowOffsetY=6*u;
        // stroke for luxury depth
        ctx.strokeStyle="#3a1f06"; ctx.lineWidth=8*u; ctx.strokeText(ch, 0, 0);
        ctx.fillStyle = tg; ctx.fillText(ch, 0, 0);
        // inner highlight
        ctx.shadowBlur=0; ctx.globalAlpha=a*0.55; ctx.fillStyle="rgba(255,255,255,0.85)"; ctx.font=`400 ${ts*0.42}px 'Anton', sans-serif`;
        // tiny top highlight not needed
        ctx.restore();
        lx += ctx.measureText(ch).width; li++;
      }
      wx += lw + spaceW;
    }
    ctx.restore();

    // script tagline - Billion Dreams much bigger now
    const phase2 = smoothstep(0.58, 0.92, p);
    ctx.save();
    ctx.globalAlpha = phase2 * 0.98;
    this.glowText(ctx, "· the thread that binds us ·", cx, cy + 172 * u, 46 * u, "'Billion Dreams', 'Dancing Script', cursive", theme.text, {
      blur: 26 * u,
      weight: "400",
    });
    ctx.restore();

    // palace doors sliding open on top (premium entrance)
    this.drawLuxuryDoors(ctx, t, p, u);

    // extra sparkle burst as doors open
    if(p>0.45 && p<0.78){
      const b = smoothstep(0.45,0.58,p)*(1-smoothstep(0.68,0.78,p));
      ctx.save(); ctx.globalAlpha=b; this.drawSparkles(ctx, t, 18, seededRng(this.cardData.id + "|door-burst"), { yy0: this.H*0.32, yy1: this.H*0.58, size: 12 * u }); ctx.restore();
    }
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
    const baseT = t; void baseT;

    // luxurious swirl mandala behind
    ctx.save();
    ctx.translate(cx, this.H * 0.44);
    ctx.globalAlpha = 0.22 + 0.12*Math.sin(t*1.1);
    ctx.strokeStyle = theme.gold;
    ctx.lineWidth = 1.8*u;
    for(let i=0;i<2;i++){ const r=(220+i*96)*u; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); }
    // rotating jewels
    for(let i=0;i<10;i++){ const ang=i/10*Math.PI*2 + t*0.5; const r=220*u + (i%2?96*u:0); const x=Math.cos(ang)*r, y=Math.sin(ang)*r; ctx.fillStyle=i%3?theme.gold:theme.accent; ctx.shadowColor=theme.gold; ctx.shadowBlur=12*u; ctx.beginPath(); ctx.arc(x,y,5.5*u,0,Math.PI*2); ctx.fill(); }
    ctx.restore();

    // --- FOR label + RECIPIENT typewriter (Billion Dreams script for label, Anton huge for name) ---
    const labelToA = smoothstep(0.02,0.18,p);
    if(labelToA>0){
      ctx.save(); ctx.translate(cx, this.H*0.30); ctx.globalAlpha=labelToA;
      this.glowText(ctx, "FOR MY BELOVED", 0, 0, 42*u, "'Billion Dreams','Dancing Script',cursive", theme.text, {blur:18*u, weight:"400"});
      ctx.restore();
    }
    // recipient typewriter - premium luxury Anton gold foil, much bigger
    {
      const name = card.recipientName || "Sister";
      const start=0.12, dur=0.28;
      const prog = clamp01((p - start)/dur);
      const chars = [...name];
      const typed = Math.floor(prog * chars.length);
      const ts = clampMinMax(168*u - Math.min(64*u, name.length*3.2*u), 88*u, 168*u);
      // gold foil gradient
      const grad = ctx.createLinearGradient(cx-320*u,0,cx+320*u,0);
      grad.addColorStop(0, theme.gold); grad.addColorStop(0.5, "#fff7cc"); grad.addColorStop(1, theme.gold);
      ctx.save(); ctx.translate(cx, this.H*0.42);
      // underline luxury rule appears with name
      const ruleA = smoothstep(0.42,0.62,p);
      if(ruleA>0){ ctx.save(); ctx.globalAlpha=ruleA*0.9; ctx.strokeStyle=theme.gold; ctx.lineWidth=2.2*u; ctx.beginPath(); ctx.moveTo(-260*u, 62*u); ctx.lineTo(260*u,62*u); ctx.stroke(); ctx.restore(); }
      ctx.font = `400 ${ts}px 'Anton','Arial Black',sans-serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      let accW=0; const widths=chars.map(c=>ctx.measureText(c).width);
      const totalW=widths.reduce((a,b)=>a+b,0)+(chars.length-1)*4*u;
      let curX = -totalW/2;
      for(let i=0;i<chars.length;i++){
        const a = i < typed ? 1 : (i===typed ? (Math.sin(t*8)>0?1:0.25) : 0);
        if(a<=0){ curX+=widths[i]+4*u; continue; }
        ctx.save(); ctx.translate(curX+widths[i]/2, 0);
        ctx.globalAlpha=a;
        ctx.shadowColor="#000"; ctx.shadowBlur=18*u; ctx.shadowOffsetY=5*u;
        ctx.strokeStyle="#3a1f06"; ctx.lineWidth=7*u; ctx.strokeText(chars[i],0,0);
        ctx.fillStyle=grad; ctx.fillText(chars[i],0,0);
        ctx.restore();
        curX+=widths[i]+4*u;
      }
      // cursor
      if(prog<1 && prog>0.06){
        const cx2 = (()=>{ let x=-totalW/2; for(let k=0;k<typed;k++) x+=widths[k]+4*u; return x; })();
        const blink = Math.sin(t*6)>0?1:0.12; ctx.save(); ctx.translate(curX - (typed<chars.length? widths[typed]||0:0)/2 - 2*u, 0); ctx.globalAlpha=blink; ctx.fillStyle=theme.accent; ctx.fillRect(cx2, -ts*0.42, 3.5*u, ts*0.84); ctx.restore();
        void cx2;
      }
      ctx.restore();
    }

    this.drawSparkles(ctx, t, 22, seededRng(card.id + "|names"), { yy0: this.base * 0.24, yy1: this.H - this.base * 0.2, size: 9 * u });

    // --- FROM + SENDER typewriter second half ---
    const fromProg = clamp01((p - 0.56)/0.30);
    if(fromProg>0.01){
      const fcA = smoothstep(0.54,0.66,p);
      ctx.save(); ctx.translate(cx, this.H*0.62); ctx.globalAlpha=fcA;
      this.glowText(ctx, "from", 0, -62*u, 44*u, "'Billion Dreams','Dancing Script',cursive", theme.accentSoft, { blur: 16*u, weight:"400" });
      ctx.restore();
      const sName = card.senderName || "Your Brother";
      const sChars=[...sName]; const sTyped=Math.floor(fromProg * sChars.length);
      const sTs = clampMinMax(92*u - Math.min(28*u, sName.length*1.8*u), 62*u, 92*u);
      const sGrad = ctx.createLinearGradient(cx-220*u,0,cx+220*u,0);
      sGrad.addColorStop(0,"#ffedd5"); sGrad.addColorStop(0.5, theme.text); sGrad.addColorStop(1,"#ffedd5");
      ctx.save(); ctx.translate(cx, this.H*0.70);
      ctx.font=`400 ${sTs}px 'Billion Dreams','Dancing Script',cursive`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      let acc=0; const sw = sChars.map(c=>ctx.measureText(c).width); const sTotal=sw.reduce((a,b)=>a+b,0)+(sChars.length-1)*2*u;
      let sx=-sTotal/2;
      for(let i=0;i<sChars.length;i++){
        const a=i < sTyped ? 1 : (i===sTyped? (Math.sin(t*7)>0?1:0.3):0);
        if(a<=0){ sx+=sw[i]+2*u; continue; }
        ctx.save(); ctx.translate(sx+sw[i]/2, (1-easeOutBack(a))*18*u);
        ctx.globalAlpha=a; ctx.shadowColor=theme.accent; ctx.shadowBlur=14*u;
        ctx.fillStyle=sGrad; ctx.fillText(sChars[i],0,0);
        ctx.restore(); sx+=sw[i]+2*u;
      }
      ctx.restore();
      // tiny sparkle under sender
      if(fromProg>0.72){ ctx.save(); ctx.globalAlpha=smoothstep(0.72,0.92,fromProg); this.glowText(ctx,"❦", cx, this.H*0.80, 36*u, "sans-serif", theme.gold,{blur:16*u}); ctx.restore(); }
    }
    this.drawSparkles(ctx, t, 10, seededRng(card.id + "|ns2"), { yy0: this.base * 0.1, yy1: this.H - this.base * 0.1, size: 6 * u });
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
    // decide which photo to show: manual index wins (preview Next), else time-based for export/auto preview
    let idx: number;
    if (typeof info.photoIndex === "number" && info.photoIndex !== null) {
      idx = Math.max(0, Math.min(n - 1, info.photoIndex));
    } else if (info.phase === "export") {
      // export: slide one by one, 1.5s each
      const per = Math.max(1.2, scene.duration / Math.max(1, n));
      idx = Math.min(n - 1, Math.floor(((t - scene.start) / per)));
    } else {
      // auto preview: cycle slowly for wizard small preview (still single centred, no wall)
      const per = scene.duration / Math.max(1, n);
      idx = Math.min(n - 1, Math.floor(((t - scene.start) / per)));
    }
    const photo = photos[idx];

    // perfectly centred big polaroid
    const isExport = info.phase === "export";
    const cx = this.cx;
    const cy = this.cy; // true centre both axes
    const w = Math.min(this.W*0.74, this.base*0.62);
    const h = w * 1.28;
    const ropeY = cy - h/2 - 22*u;

    // rope sagging across - centred, with subtle sway
    const sway = Math.sin(t*0.55)* this.base*0.018;
    ctx.save();
    ctx.strokeStyle = theme.textSoft+"AA";
    ctx.lineWidth = 3.2*u;
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(this.W*0.09, ropeY + sway*0.4);
    ctx.quadraticCurveTo(cx, ropeY + this.base*0.055 + sway, this.W*0.91, ropeY + sway*0.4);
    ctx.stroke();
    // knot highlights
    ctx.fillStyle=theme.gold; ctx.beginPath(); ctx.arc(this.W*0.09, ropeY, 4.2*u,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.W*0.91, ropeY, 4.2*u,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // slide animation for export: photo slides from right to centre (0.35), stays, then next will slide
    let slideX = 0;
    let alpha = 1;
    if (isExport && n>1) {
      const per = Math.max(1.2, scene.duration / Math.max(1, n));
      const local = ((t - scene.start) % per) / per; // 0..1 within current photo slot
      const enter = smoothstep(0,0.32, local);
      const exit = smoothstep(0.72,1, local);
      const inX = (1 - easeOutCubic(enter)) * (this.W*0.85);
      const outX = easeOutCubic(exit) * (-this.W*0.90);
      slideX = inX + outX;
      alpha = clamp01(enter*1.2) * clamp01(1 - exit*1.1);
    } else {
      // preview manual: subtle appear scale
      const appear = easeOutBack(smoothstep(0.04,0.42, p));
      // handled via scale below; keep alpha 1
      alpha = 0.98;
      void appear;
    }

    const isHover = this.hoverIdx === idx && !isExport;
    const isFocus = this.focusIdx === idx && !isExport;
    const wob = Math.sin(t * 1.9 + idx*1.1)*0.04;
    const rot = (isHover? wob*1.6 : wob*0.9);
    const hoverLift = isHover? -10*u : 0;

    // record layout for hitTest (single rect at centre)
    this.layoutCache = { layout: [{ rect: { x: cx, y: cy, w, h }, rot }], padW: w*0.12, padH: h*0.12, ts: performance.now() };
    // but store single item at idx for hitTest - need map idx->rect ; for single, hitTest checks idx===0 only? we override hitTest to use first item regardless
    // store idx mapping: simplest - keep layoutCache with one entry at centre, hitTest returns idx if inside
    this.layoutCache = { layout: Array.from({length:n}, (_,i)=> ({ rect: i===idx ? {x:cx,y:cy,w,h} : {x:-9999,y:-9999,w:1,h:1}, rot:0 })), padW: w*0.08, padH: h*0.08, ts: performance.now() };

    ctx.save();
    ctx.translate(cx + slideX, cy + hoverLift);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    // subtle shadow behind polaroid
    ctx.shadowColor="rgba(0,0,0,0.45)"; ctx.shadowBlur=28*u; ctx.shadowOffsetY=10*u;
    this.drawPolaroid(ctx, photo, 0, 0, w, h, u, idx, theme, info);
    ctx.restore();

    if (isFocus) {
      this.drawFocusOverlay(ctx, photo, info.images);
    }

    // progress dots bottom (true centre, below photo)
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = cx - (n - 1) * 10 * u + i * 20 * u;
      ctx.beginPath();
      ctx.arc(x, this.H*0.92, 5*u, 0, Math.PI*2);
      ctx.fillStyle = i===idx ? theme.gold : theme.textSoft+"55";
      ctx.globalAlpha = i===idx? 1:0.55;
      ctx.fill();
    }
    ctx.restore();

    this.drawSparkles(ctx, t, 14, seededRng(card.id + "|ph-single"), { yy0: this.base * 0.12, yy1: this.H - this.base*0.12, size: 8 * u });
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
    // faint huge quote in background for luxury
    ctx.save(); ctx.globalAlpha = smoothstep(0.08,0.32,p)*0.07; ctx.font=`400 ${420*u}px 'Billion Dreams','Dancing Script',cursive`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle=theme.gold; ctx.fillText("“", cx, this.H*0.46); ctx.restore();
    ctx.save();
    ctx.translate(cx, this.H * 0.18);
    ctx.globalAlpha = smoothstep(0, 0.16, p) * 0.98;
    this.glowText(ctx, "MY HEART SAYS", 0, 0, 42 * u, "'Billion Dreams','Dancing Script',cursive", theme.gold, {
      blur: 18 * u,
      weight: "400",
    });
    // thin gold rule under header
    ctx.save(); ctx.globalAlpha=smoothstep(0.12,0.28,p)*0.8; ctx.fillStyle=theme.gold; ctx.fillRect(-86*u, 22*u, 172*u, 1.8*u); ctx.restore();
    ctx.restore();

    const text = (card.message ?? "").trim();
    if (!text) {
      ctx.save();
      ctx.translate(cx, this.H * 0.5);
      ctx.globalAlpha = smoothstep(0.15, 0.6, p);
      this.glowText(ctx, "❤", 0, 0, 96 * u, "sans-serif", theme.gold, { blur: 30 * u });
      ctx.restore();
      return;
    }
    // big luxury message — Billion Dreams script huge, centred both axes
    const maxW = Math.min(this.W * 0.86, this.base*0.92);
    // auto-fit starting much bigger (72u) down to 38u
    let fs = Math.min(74*u, this.base*0.068);
    const fit = (s: number) => {
      ctx.font = `400 ${s}px 'Billion Dreams','Dancing Script',cursive`;
      const lns = this.wrapText(ctx, text, maxW, s, "'Billion Dreams','Dancing Script',cursive", "400");
      const hAll = lns.length * s * 1.32;
      const wMax = Math.max(...lns.map((l) => ctx.measureText(l).width));
      if (lns.length > 7 || hAll > this.H * 0.48 || wMax > maxW) return null;
      return { lns, s };
    };
    let fitted = fit(fs);
    while (!fitted && fs > 38*u) {
      fs -= 2.2*u;
      fitted = fit(fs);
    }
    const lines = fitted!.lns;
    const fsz = fitted!.s;
    const lineH = fsz * 1.32;
    const totalH = lines.length*lineH;
    const y0 = this.H*0.50 - totalH/2; // vertically centred!

    const typedP = clamp01((p - 0.14) * 1.9);
    const typed = Math.floor(typedP * [...text].length);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let remaining = typed;
    for (let li = 0; li < lines.length; li++) {
      const visible = lines[li].split("").reduce((acc, ch) => (remaining > 0 ? (remaining--, acc + ch) : acc), "");
      const lineIn = smoothstep(0.12 + li * 0.05, 0.38 + li * 0.05, p);
      const ly = y0 + li*lineH + lineH/2;
      // gold foil highlight behind each line when typing
      ctx.save();
      ctx.translate(cx, ly);
      ctx.globalAlpha = lineIn;
      // subtle offset shadow for depth
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur=22*u; ctx.shadowOffsetY=6*u;
      // gradient gold for luxury
      const g = ctx.createLinearGradient(-maxW/2,0,maxW/2,0);
      g.addColorStop(0, theme.textSoft); g.addColorStop(0.5, "#fff7cc"); g.addColorStop(1, theme.textSoft);
      ctx.fillStyle = g;
      ctx.font = `400 ${fsz}px 'Billion Dreams','Dancing Script',cursive`;
      ctx.fillText(visible, 0, 0);
      ctx.restore();
      if (li === lines.length - 1 && typed < [...text].length) {
        const cxm = ctx.measureText(visible).width;
        const blink = Math.sin(t * 5) > 0 ? 1 : 0.16;
        ctx.save(); ctx.translate(cx - maxW/2 + ctx.measureText(visible).width - maxW/2 + maxW/2, ly);
        // actually simpler cursor at end of visible
        ctx.font = `400 ${fsz}px 'Billion Dreams',cursive`;
        const curX = ctx.measureText(visible).width/2; // approx
        void curX; void cxm;
        ctx.fillStyle = theme.gold; ctx.globalAlpha = lineIn * blink * 0.95;
        // use line centre
        ctx.textAlign="center"; ctx.fillText("▍", 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    if (typed >= [...text].length && p > 0.78) {
      ctx.save();
      ctx.globalAlpha = smoothstep(0.78, 0.96, p) * 0.92;
      this.glowText(ctx, "— " + (card.senderName||"Your Brother") + "  ♥", cx, y0 + totalH + 46*u, 28*u, "'Jost',sans-serif", theme.accentSoft, { blur: 14*u, weight:"600" });
      ctx.restore();
    }

    this.drawSparkles(ctx, t, 12, seededRng(card.id + "|msg"), { yy0: this.base * 0.18, yy1: this.H - this.base * 0.18, size: 8 * u });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, fs: number, family: string = "'Jost',sans-serif", weight: string = "600"): string[] {
    ctx.font = `${weight} ${fs}px ${family}`;
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
