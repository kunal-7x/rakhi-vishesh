import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = () => Boolean(url && anon);

export function supabaseClient(): SupabaseClient {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let server: SupabaseClient | null = null;
export function supabaseServer(): SupabaseClient {
  if (!svc) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  if (!server) {
    server = createClient(url, svc, { auth: { persistSession: false } });
  }
  return server;
}
