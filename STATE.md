# STATE — RakhiVishesh Build (2026-08-22)

## DONE (verified)
1. Environment tokens read (no echo), GitHub repo `kunal-7x/rakhi-vishesh` created (public). `supabase` active.
2. Next.js 16.3.2 scaffolded (TS, Tailwind v4, App Router, src dir). Deps: `@supabase/supabase-js`, `mp4-muxer`, `framer-motion`, `qrcode`, `@types/qrcode`.
3. Supabase project `rakhi-vishesh` created: ref `eandahfxrasfcyxvllkq` (org idhpnnfupehewrcxntnm, ap-south-1). Tables: `cards`, `admins`, `card_views` + RLS + indexes created via pg (setup-schema). Storage bucket `photos` created public 10MB; policies: anon insert into `cards` folder, svc full.
4. Env: `.env.local` written (supabase URL/anon/svc, dbpass, ADMIN_PASS). Keys cached in `C:\Users\kunal\Desktop\env2supakeys.json` (DO NOT COMMIT).
5. Engine core: `src/engine/rand.ts`, `easing.ts`, `types.ts`, `themes.ts` (8 themes), `renderer.ts` (intro/names + helpers), `scenes.ts` (photos/message/finale + fallback initial + fireworks), `fonts.ts`, `export.ts` (WebCodecs MP4 + MediaRecorder fallback). `npx tsc --noEmit` = CLEAN.

## IN PROGRESS
- Engine correctness: tsc clean, but need unit-test picture output? Optional — skip in favor of real browser smoke.
- Write engine index, lib/supabase, API routes, agent page work.

## NEXT (resume order)
1. `src/engine/index.ts` barrel.
2. `src/lib/supabase.ts` client/server, `src/lib/types.ts` shared types, `src/lib/storage.ts` upload helper.
3. API: `POST /api/cards` (create w/ storage refs), `GET /api/cards/[id]`, `POST /api/cards/[id]/view`, `GET /api/admin/stats` (+Auth via ADMIN_PASS), `DELETE /api/cards/[id]`.
4. Agents (3 in parallel): A) landing page `src/app/page.tsx` (+components/landing), B) create wizard `src/app/create/page.tsx` (+components/create), C) player `src/app/r/[id]/page.tsx` (+components/player) + admin `src/app/admin/page.tsx`. Each adds READMEs with how to verify. FINAL integrate + build.
5. Deploy Vercel + push GitHub; live smoke.

## LEARNINGS
- This Next.js version (16.3.x) has React 19.2, params as Promises (`await ctx.params`), Tailwind v4 CSS-first.
- `write` tool cap: large files must be split across chunks (use edit-append marker trick).
