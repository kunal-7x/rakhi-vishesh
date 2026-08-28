export type ThemeId =
  | "marigold"
  | "peacock"
  | "diya"
  | "rose"
  | "cosmic"
  | "jewel"
  | "mehndi"
  | "confetti";

export type AspectId = "9:16" | "1:1" | "16:9";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  bg: [string, string, string];
  bgDeep: string;
  accent: string;
  accentSoft: string;
  text: string;
  textSoft: string;
  gold: string;
  ui: {
    btn: string;
    btnText: string;
    card: string;
  };
}

export interface PhotoSpec {
  url: string;
  caption?: string;
}

export interface CardData {
  id: string;
  senderName: string;
  recipientName: string;
  message: string;
  templateId: ThemeId;
  photos: PhotoSpec[];
  aspect?: AspectId;
  accent?: "warm" | "cool" | "gold";
  /** seconds into the song to start playback (preview + export) */
  songStartTime?: number;
}

export interface RenderContext {
  phase?: "preview" | "export";
  t: number;
  images: Map<string, HTMLImageElement | null>;
  fontReady: boolean;
  pointer?: { x: number; y: number } | null;
  focus?: number | null;
  /** when set, overrides time-based photo index (preview manual carousel) */
  photoIndex?: number | null;
}
