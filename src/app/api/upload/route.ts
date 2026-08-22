import type { PhotoSpec } from "@/lib/types";
import { supabaseServer } from "@/lib/supabase";
import { randomBytes } from "crypto";

export const maxDuration = 30;

export async function POST(req: Request) {
  const file = (await req.formData()).get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Too large (max 10MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Not an image" }, { status: 400 });
  }

  const supabase = supabaseServer();
  const key = `cards/${randomBytes(8).toString("hex")}${extFor(file.type)}`;
  const { error, data } = await supabase.storage.from("photos").upload(key, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("photos").getPublicUrl(key);
  void data;
  return Response.json({ url: pub.publicUrl, path: key });
}

function extFor(type: string): string {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  return ".jpg";
}

export type UploadResponse = { url: string; path: string };
