# STATE — RakhiVishesh Build (2026-08-22)

## ✅ COMPLETE — LAUNCHED 2026-08-22
1. GitHub `kunal-7x/rakhi-vishesh` (public) — main branch, auto-deploy to Vercel.
2. Supabase `rakhi-vishesh` (ref `eandahfxrasfcyxvllkq`, ap-south-1): tables cards/admins/card_views + RLS + bucket `photos` (public 10MB, insert policy `cards` folder).
3. Next.js 16.3.2 App Router. Engine: 8 themes (marigold/peacock/diya/rose/cosmic/jewel/mehndi/confetti), 5-scene timeline (intro/names/photos/message/finale), deterministic seeded particles, RakhiRenderer + fallback monogram.
4. Video export: WebCodecs H.264 → MP4 via mp4-muxer (Chrome/Edge); MediaRecorder webm/mp4 fallback; 720p/1080p; progress bar.
5. Pages: `/` (Hero+TemplateGallery w/ live loop previews+HowItWorks+Pricing+Footer), `/create` (5-step wizard, photo upload via /api/upload → data URLs, live preview), `/r/[id]` (fullscreen player, replay, quality select, download video, copy link, WhatsApp share, view tracking, created toast), `/admin` (passphrase, stats, table, copy link, delete).
6. Deploy: Vercel project `rakhi-vishesh` → https://rakhi-vishesh.vercel.app — all env vars set, GitHub auto-deploy connected.
7. LIVE VERIFIED: home/create/admin/r-pages 200; create-card API roundtrip works; views increment; admin auth (401 no-pass / 200 with-pass); duplicate safeguard id regex; test cards cleaned (demoheart2026 + deleted livesmoke00001).

## NOTE (founder action needed)
- Video-export UX + animation quality must be eyeballed in Chrome/Edge on real device (I verified logic/APIs, not pixels/sound).
- Pricing is display-only: CONFIRM when real UPI/payment is set up (currently mailto CTA).
- ADMIN_PASS = kunal@rakhi2026 (change in Vercel env when you want).
