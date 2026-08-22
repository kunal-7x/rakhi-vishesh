import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const maxDuration = 30;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id || !/^[a-z0-9]{8,32}$/.test(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }
  const supabase = supabaseServer();
  const { data: row } = await supabase
    .from("cards")
    .select("id, views")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return Response.json({ error: "Card not found" }, { status: 404 });
  }
  await supabase.from("card_views").insert({ card_id: id });
  const { data: upd } = await supabase
    .from("cards")
    .update({ views: (row.views ?? 0) + 1 })
    .eq("id", id)
    .select("id, views")
    .maybeSingle();
  return Response.json({ id, views: upd?.views ?? (row.views ?? 0) + 1 });
}
