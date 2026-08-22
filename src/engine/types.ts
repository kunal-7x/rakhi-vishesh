import type { PhotoSpec } from "@/lib/types";

export type ThemeId =
  | "marigold"
  | "peacock"
  | "diya"
  | "rose"
  | "cosmic"
  | "jewel"
  | "mehndi"
  | "confetti";

export interface CardData {
  id: string;
  senderName: string;
  recipientName: string;
  message: string;
  templateId: ThemeId;
  photos: PhotoSpec[];
  accent?: "warm" | "cool" | "gold";
}

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

export interface RenderContext {
  phase?: "preview" | "export";
  t: number;
  images: Map<string, HTMLImageElement | null>;
  fontReady: boolean;
}
