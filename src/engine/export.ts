import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { CardData, AspectId } from "./types";
import { RakhiRenderer, imageCache, preloadImage } from "./scenes";

export type ExportRes = "720" | "1080";

export interface ExportOptions {
  aspect: AspectId;
  fps: number;
  quality: ExportRes;
  onProgress: (pct: number) => void;
}

export interface ExportResult {
  blob: Blob;
  ext: "mp4" | "webm";
}

const DIMS: Record<AspectId, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
  "16:9": { w: 1920, h: 1080 },
};

export function dimsFor(aspect: AspectId, quality: ExportRes): { w: number; h: number } {
  const base = DIMS[aspect];
  const q = quality === "1080" ? 1 : 0.666;
  return { w: Math.round(base.w * q), h: Math.round(base.h * q) };
}

export function canWebCodecs(): boolean {
  return typeof window !== "undefined" && typeof globalThis.VideoEncoder === "function";
}

export function mediaRecorderMime(): string | null {
  if (typeof window === "undefined") return null;
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

async function loadImages(card: CardData): Promise<void> {
  for (const p of card.photos ?? []) {
    await preloadImage(p.url);
  }
}

export async function exportVideo(card: CardData, opts: ExportOptions): Promise<ExportResult> {
  if (canWebCodecs()) {
    return exportMp4WebCodecs(card, opts);
  }
  const mime = mediaRecorderMime();
  if (mime) {
    return exportMediaRecorder(card, opts, mime);
  }
  throw new Error("Video export is not supported in this browser. Try Chrome or Edge.");
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function exportMp4WebCodecs(card: CardData, opts: ExportOptions): Promise<ExportResult> {
  const { w, h } = dimsFor(opts.aspect, opts.quality);
  const { fps } = opts;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const renderer = new RakhiRenderer(card);
  const totalSec = renderer.timelineInfo.total;
  const totalFrames = Math.ceil(totalSec * fps);

  await loadImages(card);
  await document.fonts?.ready?.catch?.(() => undefined);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: w, height: h },
    fastStart: "in-memory",
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => {
      console.error("encoder error", e);
    },
  });

  const bitrate = opts.quality === "1080" ? 8_000_000 : 4_500_000;
  const tryCodecs = ["avc1.640028", "avc1.42E01E", "avc1.42003f", "avc1.4D401E"];
  for (const codec of tryCodecs) {
    try {
      encoder.configure({ codec, width: w, height: h, bitrate, framerate: fps });
      break;
    } catch {
      // try next codec
    }
  }

  const renderFrame = (sec: number) => {
    renderer.render(ctx, { t: sec, images: imageCache, fontReady: true, phase: "export" });
  };

  for (let f = 0; f < totalFrames; f++) {
    renderFrame(f / fps);
    const vf = new VideoFrame(canvas, { timestamp: (f * 1_000_000) / fps, alpha: "discard" });
    encoder.encode(vf, { keyFrame: f % (fps * 2) === 0 });
    vf.close();
    while (encoder.encodeQueueSize > 4) {
      await new Promise((r) => setTimeout(r, 2));
    }
    opts.onProgress(Math.round(((f + 1) / totalFrames) * 100));
  }

  await encoder.flush();
  muxer.finalize();
  const { buffer } = muxer.target;
  return {
    blob: new Blob([buffer as ArrayBuffer], { type: "video/mp4" }),
    ext: "mp4",
  };
}

async function exportMediaRecorder(card: CardData, opts: ExportOptions, mime: string): Promise<ExportResult> {
  const { w, h } = dimsFor(opts.aspect, opts.quality);
  const { fps } = opts;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const renderer = new RakhiRenderer(card);
  const totalSec = renderer.timelineInfo.total;

  await loadImages(card);
  await document.fonts?.ready?.catch?.(() => undefined);

  const stream = canvas.captureStream(fps);
  const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: opts.quality === "1080" ? 8_000_000 : 4_500_000 });
  const chunks: Blob[] = [];
  mr.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const done = new Promise<void>((resolve) => {
    mr.onstop = () => resolve();
  });
  mr.start(500);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const loop = () => {
      const sec = (performance.now() - start) / 1000;
      if (sec >= totalSec) {
        resolve();
        return;
      }
      renderer.render(ctx, { t: sec, images: imageCache, fontReady: true, phase: "export" });
      opts.onProgress(Math.round((sec / totalSec) * 100));
      requestAnimationFrame(loop);
    };
    loop();
  });
  await new Promise((r) => setTimeout(r, 300));
  mr.stop();
  await done;

  const isMp4 = mime.startsWith("video/mp4");
  return {
    blob: new Blob(chunks, { type: mime }),
    ext: isMp4 ? "mp4" : "webm",
  };
}
