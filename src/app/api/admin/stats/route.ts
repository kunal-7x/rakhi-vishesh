import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const maxDuration = 30;

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASS ?? "";
  if (!pass) return false;
  const given = req.headers.get("x-admin-pass") ?? "";
  return given === pass;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = supabaseServer();
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, sender_name, recipient_name, template_id, views, created_at, photos")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { count: viewsTotal } = await supabase
    .from("card_views")
    .select("id", { count: "exact", head: true });

  return Response.json({
    cards: (cards ?? []).map((c) => ({
      id: c.id,
      sender_name: c.sender_name,
      recipient_name: c.recipient_name,
      template_id: c.template_id,
      views: c.views ?? 0,
      photoCount: Array.isArray(c.photos) ? c.photos.length : 0,
      created_at: c.created_at,
    })),
    stats: {
      totalCards: (cards ?? []).length,
      totalViews: viewsTotal ?? 0,
    },
  });
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[a-z0-9][a-z0-9-]{5,63}$/.test(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }
  const supabase = supabaseServer();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}

