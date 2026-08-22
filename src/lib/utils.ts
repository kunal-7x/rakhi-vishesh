import type { CardData } from "@/lib/types";
import { THEMES } from "@/engine/themes";

export const BRAND = "RakhiVishesh";

export function cardUrl(id: string): string {
  return `${window.location.origin}/r/${id}`;
}

export function shareText(card: CardData): string {
  return `Happy Raksha Bandhan! 💝 ${card.senderName || "Bhai"} sent a special rakhi card for ${card.recipientName}. Watch it here: ${cardUrl(card.id)}`;
}

export function demoCard(): CardData {
  return {
    id: "demoheart2026",
    senderName: "Bhaiya",
    recipientName: "Shivangi",
    message:
      "Every thread of this rakhi carries my love... may you always shine brighter than every diya in the world. Happy Raksha Bandhan!",
    templateId: "marigold",
    photos: [],
  };
}

export function themeList() {
  return Object.values(THEMES);
}
