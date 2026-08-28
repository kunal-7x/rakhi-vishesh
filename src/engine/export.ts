import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { CardData, AspectId } from "./types";
import { RakhiRenderer, imageCache, preloadImage } from "./scenes";

export type ExportRes = "720" | "1080";

export interface ExportOptions {
  aspect: AspectId;
  fps: number;
  quality: ExportRes;
  onProgress: (pct: number) => void;
  /** File to use for audio. undefined = default Phoolon Ka Taron Ka, null = no music */
  audioFile?: File | null;
  /** seconds into the audio to start playback from (0 = beginning) */
  songStartTime?: number;
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

async function loadAudioBuffer(source: File | string): Promise<AudioBuffer | null> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (source instanceof File) {
      arrayBuffer = await source.arrayBuffer();
    } else {
      const res = await fetch(source);
      if (!res.ok) return null;
      arrayBuffer = await res.arrayBuffer();
    }
    const AudioCtx = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    // close to free
    try { await ctx.close(); } catch {}
    return decoded;
  } catch (e) {
    console.warn("audio decode failed", e);
    return null;
  }
}

function interleaveAudio(audioBuffer: AudioBuffer, offset: number, length: number): Float32Array {
  const channels = audioBuffer.numberOfChannels;
  const out = new Float32Array(length * channels);
  for (let ch = 0; ch < channels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const srcIdx = (offset + i) % audioBuffer.length;
      out[i * channels + ch] = data[srcIdx];
    }
  }
  return out;
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
  // decide audio source
  let audioBuffer: AudioBuffer | null = null;
  if (opts.audioFile !== null) {
    const src: File | string = opts.audioFile ?? "/default-music.mp3";
    audioBuffer = await loadAudioBuffer(src);
  }
  const hasAudio = !!audioBuffer && typeof AudioEncoder !== "undefined" && typeof AudioData !== "undefined";

  await document.fonts?.ready?.catch?.(() => undefined);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: w, height: h },
    ...(hasAudio && audioBuffer
      ? { audio: { codec: "aac", sampleRate: audioBuffer.sampleRate, numberOfChannels: audioBuffer.numberOfChannels } }
      : {}),
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

  // set up audio encoder if we have audio
  let audioEncoder: AudioEncoder | null = null;
  if (hasAudio && audioBuffer) {
    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => {
          muxer.addAudioChunk(chunk, meta);
        },
        error: (e) => console.error("audio encoder error", e),
      });
      audioEncoder.configure({
        codec: "mp4a.40.2",
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        bitrate: 128000,
      });
    } catch (e) {
      console.warn("audio encoder configure failed", e);
      audioEncoder = null;
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
    // report 0..90 for video, reserve 90..100 for audio mux
    const prog = hasAudio ? Math.round(((f + 1) / totalFrames) * 90) : Math.round(((f + 1) / totalFrames) * 100);
    opts.onProgress(prog);
  }

  await encoder.flush();

  // encode audio track (if any)
  if (audioEncoder && audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const neededSamples = Math.ceil(totalSec * sampleRate);
    const frameSize = 1024;
    // offset into the audio buffer by songStartTime seconds
    const startSampleOffset = Math.round((opts.songStartTime ?? 0) * sampleRate);
    for (let offset = 0; offset < neededSamples; offset += frameSize) {
      const frames = Math.min(frameSize, neededSamples - offset);
      const timestamp = (offset * 1_000_000) / sampleRate;
      const interleaved = interleaveAudio(audioBuffer, startSampleOffset + offset, frames);
      const audioData = new AudioData({
        format: "f32",
        sampleRate,
        numberOfFrames: frames,
        numberOfChannels: channels,
        timestamp,
        data: interleaved as unknown as BufferSource,
      });
      audioEncoder.encode(audioData);
      audioData.close();
      while (audioEncoder.encodeQueueSize > 4) {
        await new Promise((r) => setTimeout(r, 2));
      }
      // audio progress 90..100
      const aProg = 90 + Math.round(((offset + frames) / neededSamples) * 10);
      opts.onProgress(Math.min(100, aProg));
    }
    await audioEncoder.flush();
    audioEncoder.close?.();
  } else if (hasAudio === false && opts.audioFile !== null) {
    // tried but failed — still finalize video
    console.warn("audio not muxed — producing video-only");
  }

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
