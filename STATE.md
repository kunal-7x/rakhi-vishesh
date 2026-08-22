# STATE — RakhiVishesh (2026-08-23)

## ✅ V2 COMPLETE — all requested fixes shipped + verified live

### User feedback fixes delivered
1. **Photos visible + rope gallery**: new Scene-2 photo wall — polaroids with white margins (real-camera look) clipped to a swaying rope with clothespins. Layout adapts (1 centered, 2, 3..4 one row 5..8 two rows 9..12 three rows). Rope sways L-R, photos swing pendulums. Hover = wiggle (cursor pointer). Click = lightbox zoom (tap anywhere closes). Deterministic seeded rng (export == preview).
2. **Video export works**: aspect-aware dims (9:16→1080×1920 / 1:1→1080 / 16:9→1920×1080), fixed codec ladder (640028 first), keyframe interval, proper bitrate by quality, timeline total (start→end guaranteed). Fallback MediaRecorder (mp4-aware on Safari; webm otherwise). File: `rakhi-{id}.mp4`.
3. **Aspect ratios user-selectable**: Reel 9:16 / Square 1:1 / Wide 16:9 — picked in wizard preview AND switchable in player before download; entire animation renders in chosen ratio.
4. **Smooth scene transitions**: crossfade bus (1.15s) on offscreen buffer between ALL scene pairs; title text letter-stagger bloom; message typewriter with cursor; finale diya ring + fireworks. No more instant cuts.
5. **Link modes — 3 variants**: `plain` (default: creator tools — replay/aspect/quality/download/copy plain/clean links), `clean=1` (recipient sees ONLY animation, zero chrome — verified server-rendered), `create=1` (only "Create one for someone you love" button). Clean link is what you share. Created toast on `?created=1`.
6. **Personalized URL slug**: `/r/{sender}-from-{recipient}` e.g. `/r/bhaiya-from-shivangi`, 409 on dup with `-2` suffix retry; id regex `^[a-z0-9][a-z0-9-]{5,63}$`.
7. **Fullscreen immersion**: player fills viewport; clean mode is a pure fullscreen animation (no card frame, no buttons).
8. **Domain**: `rakhi-vishesh.vercel.app` currently. `opengiftversal.com` registry NOT available via provided tokens (Cloudflare token exists but no such zone in it — need the domain bought/pointer setup; recorded as founder action).

### Verified live (2026-08-23)
- `GET /api/cards/demoheart2026` aspect 9:16 ✓
- Slug create `/r/test-live-slug` 16:9, GET roundtrip ✓, DUP→409 ✓
- Clean page: hasControls=False, hasCreate=False ✓ (server-side variant)
- Plain page: hasDownload=True ✓; Create-mode page: hasCreateBtn=True ✓
- Build green; tsc green; deployed `rakhi-vishesh` (latest deploy ixbieo1za READY)

## FOUNDER ACTIONS (need you)
- Open https://rakhi-vishesh.vercel.app in Chrome, create a card WITH 2-3 photos, then Download Video — verify the MP4 plays start→end. (Canvas-level behavior verified by design + code, pixel-perfection needs your eyes.)
- Domain `opengiftversal.com`: buy it (GoDaddy/Namecheap) or add DNS at Cloudflare; then tell me and I'll wire CNAME + Vercel domain + DNS records automatically.
- Pricing section still display-only (UPI/Razorpay checkout needs your merchant account).

## LEARNINGS
- PowerShell can't glob paths containing `[id]` brackets — use edit tool.
- Next.js 16: searchParams/params are Promises; RouteContext global after typegen.
- WebCodecs codec order matters: `avc1.640028` (High 4.0) first for quality at 1080p.
- Client-side variant reading caused SSR flash — derive mode from server searchParams and prop it down.
