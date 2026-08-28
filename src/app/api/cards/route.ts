import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import type { CreateCardInput, PhotoSpec, AspectId } from "@/lib/types";
import { THEMES } from "@/engine/themes";

export const maxDuration = 30;

const ID_RE = /^[a-z0-9][a-z0-9-]{5,63}$/;
const ASPECTS: AspectId[] = ["9:16", "1:1", "16:9"];

export async function POST(req: NextRequest) {
  let body: Partial<CreateCardInput>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const errors: string[] = [];
  const id = String(body.id ?? "").toLowerCase();
  if (!ID_RE.test(id)) errors.push("Invalid id");
  const senderName = String(body.senderName ?? "").trim().slice(0, 40);
  const recipientName = String(body.recipientName ?? "").trim().slice(0, 40);
  if (!recipientName) errors.push("recipientName is required");
  const message = String(body.message ?? "").trim().slice(0, 600);
  const templateId = String(body.templateId ?? "");
  if (!THEMES[templateId as keyof typeof THEMES]) errors.push("Invalid templateId");
  const aspect: AspectId = ASPECTS.includes(body.aspect as AspectId) ? (body.aspect as AspectId) : "9:16";
  const songStartTime = Math.max(0, Math.min(300, Number(body.songStartTime) || 0));

  const photos: PhotoSpec[] = (Array.isArray(body.photos) ? body.photos : [])
    .slice(0, 12)
    .map((p) => ({
      url: String(p.url ?? "").slice(0, 1000),
      caption: p.caption ? String(p.caption).slice(0, 80) : undefined,
    }))
    .filter((p) => p.url.startsWith("https://"));

  if (errors.length) {
    return Response.json({ error: errors.join("; ") }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: existing } = await supabase.from("cards").select("id").eq("id", id).maybeSingle();
  if (existing) {
    return Response.json({ error: "id_taken" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("cards")
    .insert({
      id,
      sender_name: senderName || "Your Brother",
      recipient_name: recipientName,
      message,
      template_id: templateId,
      aspect,
      photos,
      audio_enabled: false,
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    return Response.json({ error: "Failed to save card" }, { status: 500 });
  }

  return Response.json({ id: data.id, created_at: data.created_at });
}
