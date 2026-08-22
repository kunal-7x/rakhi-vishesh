import type { CardData, AspectId } from "@/lib/types";
import { THEMES } from "@/engine/themes";

export const BRAND = "RakhiVishesh";

export function cardUrl(id: string, suffix = ""): string {
  return `${window.location.origin}/r/${id}${suffix ? `?${suffix}` : ""}`;
}

export function shareLinkType(id: string, mode: "plain" | "clean" | "create"): string {
  return cardUrl(id, mode === "clean" ? "clean=1" : mode === "create" ? "create=1" : "");
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
    aspect: "9:16" as AspectId,
  };
}

export function themeList() {
  return Object.values(THEMES);
}
