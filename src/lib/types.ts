export type ThemeId =
  | "marigold"
  | "peacock"
  | "diya"
  | "rose"
  | "cosmic"
  | "jewel"
  | "mehndi"
  | "confetti";

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
  accent?: "warm" | "cool" | "gold";
}

export interface CardRecord {
  id: string;
  sender_name: string;
  recipient_name: string;
  message: string;
  template_id: ThemeId;
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
  photos: PhotoSpec[];
}
