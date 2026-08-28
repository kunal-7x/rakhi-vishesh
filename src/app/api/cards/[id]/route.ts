import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { THEMES } from "@/engine/themes";

export const maxDuration = 30;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id || !/^[a-z0-9][a-z0-9-]{5,63}$/.test(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return Response.json({ error: "Card not found" }, { status: 404 });
  }

  const templateId = THEMES[data.template_id as keyof typeof THEMES] ? data.template_id : "marigold";
  const aspect = ["9:16", "1:1", "16:9"].includes(data.aspect as string) ? data.aspect : "9:16";

  return Response.json({
    id: data.id,
    sender_name: data.sender_name,
    recipient_name: data.recipient_name,
    message: data.message,
    template_id: templateId,
    aspect,
    audio_enabled: data.audio_enabled,
    songStartTime: typeof data.song_start_time === 'number' ? data.song_start_time : 0,
    photos: Array.isArray(data.photos) ? data.photos : [],
    views: data.views ?? 0,
    created_at: data.created_at,
  });
}
