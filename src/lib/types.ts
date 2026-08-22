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
}

export interface CardRecord {
  id: string;
  sender_name: string;
  recipient_name: string;
  message: string;
  template_id: ThemeId;
  aspect?: AspectId;
  audio_enabled: boolean;
  photos: PhotoSpec[];
  views: number;
  created_at: string;
}

export interface CreateCardInput {
  id: string;
  senderName: string;
  recipientName: string;
  message: string;
  templateId: ThemeId;
  aspect: AspectId;
  photos: PhotoSpec[];
}
