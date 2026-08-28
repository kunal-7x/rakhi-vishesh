# RakhiVishesh — Full Product Description
### *Rakhi ka ek hi vishesh ehsaas — Ab ek link mein poori kahani*

**Live Product:** https://rakhi-vishesh.vercel.app  
**GitHub:** `kunal-7x/rakhi-vishesh` (public, auto-deploy to Vercel)  
**Backend:** Supabase `rakhi-vishesh` (Mumbai `ap-south-1`)  
**Stack:** Next.js 16.3.2 (App Router) • React 19 • Tailwind v4 • Framer Motion • Canvas Engine • WebCodecs + mp4-muxer  
**Version:** v3 Luxury (Aug 2026) — Shipped & Live Verified

---

## 1) What is RakhiVishesh?

RakhiVishesh is a **luxury animated Rakhi card creator** that turns a brother’s love into a **cinematic, shareable link + downloadable video**. No app, no login, no design skill.

A brother opens the site → picks a luxury theme → types `From: Kunal` `To: Himanshi` → writes a heartfelt message → adds 1-12 photos of his sister (drag-drop) → picks `9:16 Reel / 1:1 Square / 16:9 Wide` → hits **Create**. In one click he gets a **personalized URL** like `/r/kunal-from-himanshi` — a full-screen palace of animation that his sister opens on any phone and *feels*.

The same animation can be **downloaded as a full HD video (MP4/WebM, 720p/1080p)** with the classic Kishore Kumar `Phoolon Ka Taron Ka` song (or his own uploaded song) perfectly synced — so it can be sent on WhatsApp, Instagram, or kept forever.

> **Core Promise:** The 10% you type (names, message, photos) becomes 90% magic we craft for you — doors, threads, ropes, diyas, fireworks, gold foil, sway, sparkles, music — all deterministic, all beautiful, on every screen.

---

## 2) Who is it for?

- **Brothers** who live far from their sisters and want to send something *more* than a couriered Rakhi.
- **Sisters** who want to re-live the moment (the link never expires, the video lives in their gallery).
- **Families** who want a premium digital keepsake without learning Canva/After Effects.
- **Gifting/monetization angle:** Free tier for everyone, Pro `₹99` for creators who want all 8 luxury themes, 1080p export, and 12 photos — ready to pay via UPI/Razorpay when you plug keys.

---

## 3) The Complete Feature Map (Everything Shipped)

### 3.1 Landing Page (`/`) — The Storefront
- **Hero with LIVE demo:** A looping `CardPlayer` canvas (demo card `bhaiya-from-shivangi`) playing the *actual* engine inside a phone frame with glow and floating chips. Headline in **Anton** gold-foil (`HAPPY RAKSHA BANDHAN` 118-132px), tagline in **Billion Dreams** (`· the thread that binds us ·` 46-52px).
- **Template Gallery (8 Luxury Themes):** Each card shows emoji + name + tagline + a tiny looping canvas preview (`CardPlayer themeId`). Click → `/create?template=marigold`. Selection is synced from `?template=` via `useSearchParams` inside `Suspense`.
  - **Themes (all shipped in `src/engine/themes.ts`):**
    1. **Royal Marigold** 🏵️ — Saffron/gold/maroon, marigold petals, `bg: #3b1507→#7c2506→#c4510f`
    2. **Peacock Paisley** 🦚 — Teal/indigo/gold feathers, `bg: #031b1f→#063f47→#0d6b70`
    3. **Diya Twilight** 🪔 — Deep purple dusk + warm flames, `bg: #16091f→#3b1049→#6b1f5e`
    4. **Rose Garden** 🌹 — Soft pink/rose petals, `bg: #2b0a12→#5c1128→#8f2340`
    5. **Cosmic Stars** ✨ — Midnight navy + gold stars, `bg: #050514→#101040→#26307a`
    6. **Royal Jewel** 💎 — Emerald/gold, `bg: #04130d→#0a3a24→#11573a`
    7. **Mehndi Dawn** 🌿 — Henna cream/amber, `bg: #241505→#4d2a08→#8a4b0e`
    8. **Festival Confetti** 🎊 — Vibrant fuchsia/purple, `bg: #170a2b→#4a1e6b→#8f3f8f`
  Each has `accent/accentSoft/text/textSoft/gold/ui` tokens used everywhere.
- **How It Works:** 3-step cards `Pick theme → Add names/message/photos → Share link + Download video` with emoji `01/02/03` and `whileInView` staggers.
- **Pricing:** `Free vs Pro ₹99 Lifetime` — Pro: all themes, 1080p, 12 photos, no watermark, priority. CTA is `mailto:` placeholder (no payment wired yet — honest).
- **Footer:** Brand + `/create` + `/admin` + copyright.

### 3.2 Create Wizard (`/create`) — 5 Steps, One Flow

Located in `src/components/create/CreateWizard.tsx` (5-step) + `src/app/create/page.tsx` (server wrapper).

| Step | Name | What Happens | Craft Details |
|---|---|---|---|
| 1 | **Theme** | Grid of 8 themes, each mini `CardPlayer themeId` live. Read `?template=` to pre-select. | Staggered entry, selected ring `border-[#ffd97a] shadow-[0_0_24px_rgba(...)]`, aspect `9/16` card. |
| 2 | **Names** | `Recipient name*` (required, 40ch) + `Your name (sender)` (40ch, hint: defaults to “Your Brother”). | `TextField` reusable, live validation, `recipientOk` gates Next. |
| 3 | **Message** | `textarea` 600ch, live counter. | `TextAreaField`, hint: “Optional — beautiful on its own”. |
| 4 | **Photos** | Drag-drop or tap to pick, `MAX 12`, 10MB each, `image/*` only. `PhotoUploader` reads files as `data:URL` then uploads via `POST /api/upload` (multipart `file`) to Supabase `photos` bucket → returns `https://...` public URL. Grid `cols-3 sm:cols-4`, each with `✕` remove + `#N` badge. | Progress `Optimizing…`, error `Maximum 12`. Upload path `cards/{randomHex}.jpg`. |
| 5 | **Preview** | Large `CardPlayer card={previewCard} aspect={aspect}` (340px card). Shows live single polaroid centre, rope, sparkles. | Aspect picker `Reel 9:16 / Square 1:1 / Wide 16:9` (default 9:16). Checkbox `Clean link` (default checked → `?clean=1` after create). Slug hint `kunal-from-himanshi`. Info: `Tap a photo to zoom`. Typewriter preview updates as you type (debounce not needed — `CardPlayer` remounts on `card` prop at effect start). |

**Slug & Aspect Logic:**
- `slugify(name)` → `lowercase, [^a-z0-9]+ → -, trim -, slice 32` → `sender-from-recipient` (e.g., `kunal-from-himanshi` sliced to 48). On `409 id_taken`, auto-retry `${slug}-2` … `-5`.
- `aspect` stored on card (`9:16` default — perfect for Reel/WhatsApp Status). Affects *everything*: canvas design size (`1080×1920` vs `1080×1080` vs `1920×1080`), font scale `u=base/1080`, photo size `min(W*0.74, base*0.62)`.
- **Create button** → `POST /api/cards {id, senderName, recipientName, message, templateId, aspect, photos:[{url}]}`
  - Validates: `id` regex `^[a-z0-9][a-z0-9-]{5,63}$`, `recipientName` required, `templateId` in `THEMES`, `aspect` in enum, photos `https://` only (data URLs must go via `/api/upload` first — that’s the intentional guard). On success → `router.push(/r/${id}?clean=1&created=1)` or `?created=1`.

### 3.3 The Animation Engine (The 90% Magic)

**Location:** `src/engine/renderer.ts` (base + crossfade + motifs) + `src/engine/scenes.ts` (`RakhiRenderer` — 5 scenes) + `src/engine/rand.ts`/`easing.ts`/`fonts.ts`/`themes.ts` + `src/engine/export.ts`.

**Core Contract:**
- `Renderer.render(ctx, {t, images: Map<url,HTMLImageElement|null>, fontReady, phase, photoIndex?})` — pure, deterministic from `t`. `timelineInfo.total` + `SceneTiming[]`. Letterbox via `scale = min(w/W, h/H)`, `offsetX/Y`.
- `RakhiRenderer` extends `Renderer`, adds `imageCache` (global `Map`), `preloadImage(url)` (crossOrigin anonymous), `hitTest(x,y)` for polaroid, `hoverIdx/focusIdx` for wiggle/zoom.
- **Design Space:** `ASPECT_DIMS` — `9:16 1080×1920`, `1:1 1080×1080`, `16:9 1920×1080`. `W/H/base/min→u`, `cx=W/2, cy=H/2`. All coords use `W/H` fractions, fonts scale with `u`, so one code path renders all ratios identically for preview *and* export.
- **Fonts:** Premium combo **Anton** (bold condensed display, `400`) for headings + **Billion Dreams** (brush script, `400` via `cdnfonts`) for personal lines, fallbacks `Rajdhani/Jost/Dancing Script`. `ensureFonts()` loads `400 52px 'Anton'`, `'Billion Dreams'`, etc., waits `document.fonts.ready`. Sizes are *bigger* as you asked (title `132u`, names `168u`, message `74u→38u` auto-fit).
- **Smoothness:** `CROSSFADE 1.15s` via offscreen buffer — at each scene boundary `k = smoothstep(start-C/2, start+C/2, t)`, previous scene drawn to `buf` at `1-k`, current at `k` via `drawImage`. No instant cuts. Typography uses `smoothstep/easeOutBack/easeOutCubic`.

#### The 5 Scenes (Timeline: intro 5.2s + names 6.0s + photos `2.2 + n*1.5` + message `5-16s` by length + finale 9.0s = ~30-45s for 3 photos)

**Scene 0 — INTRO: Palace Doors + Realistic Rakhi (The Hook)**
- `drawBase`: Linear gradient `bg[0]→bg[1]→bg[2]` + radial vignette `bgDeep` + 3 shimmer rings (`gold`, `0.06+shimmer*0.04`).
- `drawLuxuryDoors`: Two panels, centres `W*0.25` / `W*0.75`, each `W/2 × H`, wood gradient `#1e0804→#5e1a0e→#2a0a05`, double gold border (`9u` + `1.8u #fff6d6`), wood grain lines, central mandala (3 rings + 8 spokes rotating `t*0.08`), brass knob (`14u #ffd97a` + highlight). Doors slide `off = W*0.58*slide`, `slide = easeOutCubic(smoothstep 0.14→0.58 p)` — they start closed covering, then swing/slide apart. Centre burst radial `255,250,220→gold` as they part, top vignette when closed.
- `drawRealisticRakhi`: At `cx, H*0.42 -74u`, scale `base/1080*1.08`. Shadow ellipse, two silk threads `bezier` down with beads (`3×4.2u gold`) and pompom tassels (`10u gold/accentSoft`), outer gold foil ring (`radial #fff8d6→gold→#b45309`), inner kundan red jewel (`radial #ff9aa2→#dc2626→#7f1d1d`) + highlight, `12` pearl ring (`#fffef8` + gold glow), sparkle `sin(t*3.2)`. Reveal `smoothstep 0.42→0.78 p` after doors start opening.
- **Title:** `HAPPY RAKSHA BANDHAN` in **132u Anton** gold-foil linear gradient (`#7a4a08→gold→#fff8d6`), **typewriter** `titleProg=(p-0.62)/0.32`, `typedLen = floor(prog*len)`, blinking cursor `4.5u` gold, faint ghost for remaining letters. Previously *direct appear* — now *typewriter after doors*. Script tagline `· the thread that binds us ·` `52u Billion Dreams` also typewrites `tagProg=(p-0.78)/0.20`.
- Sparkles `26` + door-burst `18` during `p 0.45→0.78`.

**Scene 1 — NAMES: For / From Typewriter (Luxury)**
- Mandala behind: 2 gold rings `(220+i*96)u` + 10 orbiting jewels.
- **FOR MY BELOVED** `42u Billion Dreams` fades `0.02→0.18`.
- **Recipient name** `168u→88u Anton` (shrinks with length `clamp 168-64` etc.), gold foil gradient (`gold→#fff7cc→gold`), **per-letter typewriter** `prog=(p-0.12)/0.28`, stroke `#3a1f06 7u` depth + shadow, underline rule fades `0.42→0.62`, cursor blinks `t*8`. Centre `H*0.42`.
- **FROM + Sender** (`92u→62u Billion Dreams` `Billiard` actually `Billion Dreams/Dancing Script` `400`) typewrites second half `fromProg=(p-0.56)/0.30`, with `✿` sparkle at `H*0.80` when done. Sparkles `20+10`.

**Scene 2 — PHOTOS: One Big Polaroid on a Swaying Rope (The Star)**
- **Layout:** *One* big polaroid perfectly centred both axes (`cx, cy=H/2`), `w = min(W*0.74, base*0.62)`, `h=w*1.28` — not a wall. Rope is a sagging quadratic `W*0.09 → W*0.91` at `ropeY = cy - h/2 -22u`, sag `base*0.055`, sways `sin(t*0.55)*base*0.018`. Gold knots at ends.
- **Photos:** Up to 12. **Preview manual mode:** `photoIndex` prop overrides time — `idx = photoIndex` (so `Next` shows instantly). **Export/auto:** `idx = floor((t-start)/per)` with `per = duration/n` (`1.5s` each), slide `inX = (1-easeOutCubic(enter))*W*0.85` (right→centre in `0→0.32` of slot).
- **Polaroid:** `src/engine/scenes.ts:drawPolaroid` — white `≈ #fdf7ee` with `26u` shadow, clothespin bar `12%` top (`#caa15e/#a8843f`), inner photo area clipped `4u` radius, `cover` draw via `max(tw/cw, th/ch)`, fallback `accentSoft33 + "✿"`, bottom caption strip `w*0.20` with `Billion Dreams` (or `#N ♥`).
- **Interaction:** `hoverIdx` → wiggle `sin(t*1.9)*0.04*1.6`, lift `-10u`; `focusIdx` → `drawFocusOverlay` dim `0.72` + lightbox polaroid `W*0.82` at `H*0.44` + `tap anywhere to close`. `hitTest` uses `layoutCache` single rect.
- **Progress dots** at `H*0.92`, gold active.
- No more upper-side misalignment — true centre `cy`.

**Scene 3 — MESSAGE: Huge Centred Typography**
- Faint giant `“` watermark `420u Billion Dreams` at `0.07` alpha.
- Header `MY HEART SAYS` `42u Billion Dreams` gold at `H*0.18` with gold rule.
- **Body:** `Billion Dreams 74u→38u` auto-fit `maxW=W*0.86`, `y0 = H/2 - totalH/2` — **vertically centred**, `lineH=1.32*fs`, max 7 lines. **Typewriter per char** `typedP=(p-0.14)*1.9`, `typed=floor(p*len)`, each line fades `smoothstep 0.12+li*0.05 → 0.38+li*0.05`, gold foil gradient `textSoft→#fff7cc→textSoft`, shadow. Cursor `▍` blinks until done, then `— sender ♥` at `28u Jost`. Sparkles.

**Scene 4 — FINALE: Diya Ring + Fireworks**
- Ring `300u` + `sin(t*1.1)*6u`, two circles, `8` diyas orbiting `sin(t*3)` flicker, each `drawDiya` ellipse + flame `bezier` with `flick=0.82+0.36*sin(t*9.5)*cos(t*3.1)`.
- Big wish `HAPPY RAKSHA` / `BANDHAN!` `68u Anton` + `recipient ♥` `50u Billion Dreams`, 8-fireworks `burstT=(t*0.55+i*0.31)%1.4/1.4`, `rad=190u`, gold/accent particles.

### 3.4 Photo Handling — Like Real Captures
- **Upload:** `PhotoUploader` (`src/components/PhotoUploader.tsx`) — drag-drop or tap, `image/*`, reads as `data:URL` then uploads to `POST /api/upload` (multipart `file`, `10MB`, `photos` bucket public) → returns `{url, path}` (Supabase public URL).
- **Storage:** Supabase bucket `photos` (public, 10MB, `image/*`), RLS `anon INSERT only into folder cards/` + `service_role` full. Files at `cards/{nanoid}.jpg`.
- **Display:** Polaroid white frame `8u` radius, `26u` blur shadow, top clip, inner `4u` clip, `caption` strip. Real margins (`w*0.055` sides, `clipH+ bw` top, `capH=w*0.20` bottom). Caption `Billion Dreams` uppercase or `#N ♥`.
- **Limits:** Max 12, min 0 (shows monogram fallback `drawPhotoFallback` — initial letter in `190u` circle with pulse `sin(t*1.2)`).

### 3.5 Music — Hear It, Choose It, Keep It
- **Default Song:** `public/default-music.mp3` — `Kishore Kumar — Phoolon Ka Taron Ka` (5.7MB, 356s) copied from `C:\Users\kunal\Desktop\mcpae\...mp3`. Trimmed/looped to video length.
- **Preview Playback:** `src/app/r/[id]/Player.tsx` — `<audio loop playsInline>` with `src=/default-music.mp3` (or `URL.createObjectURL(customFile)`), `volume 0.72`. Tries autoplay after `900ms`; on failure waits for first `click/touchstart`. Toggle `🔊/🔇` at top-right (clean) + in control bar (plain). `Mute` sets `musicFile=null` (no audio), `Default` restores `undefined`.
- **Custom Upload:** File input `accept=audio/*` in download bar (`🎵 ${name}…`). Selecting a file creates `customAudioUrl` and switches `musicFile` to `File`, preview src swaps immediately.
- **Video Export Audio:** `src/engine/export.ts` — `loadAudioBuffer(File|string)` via `AudioContext.decodeAudioData`, `hasAudio = !!buffer && AudioEncoder && AudioData`. `Muxer` created with `audio:{codec:aac, sampleRate, numberOfChannels}` if hasAudio. `AudioEncoder mp4a.40.2 128k` encodes `1024`-frame chunks of interleaved `f32` (looped if audio shorter than `totalSec`). Progress `0→90 video, 90→100 audio`.

### 3.6 Video Export — The Exact Full Animation

- **Trigger:** `🎬 Download Video` in player (plain mode). Checks `canWebCodecs() (VideoEncoder)` else `mediaRecorderMime()`, else error “Use Chrome/Edge”.
- **Options:** `aspect` (from card, switchable `Reel/Square/Wide`), `fps 30`, `quality 720p (0.666) /1080p (1.0)` (`dimsFor`), `audioFile` (default/custom/none), `onProgress`.
- **Pipeline (WebCodecs, primary):**
  ```
  makeCanvas(w,h) → RakhiRenderer(card) → totalSec → totalFrames
  preloadImage(all) → document.fonts.ready
  loadAudioBuffer(default or custom) → Muxer({video:avc w h, audio?:aac ..., fastStart:in-memory})
  VideoEncoder(try codecs avc1.640028 → 42E01E → 42003f → 4D401E, bitrate 8M/4.5M)
  [AudioEncoder if hasAudio]
  for f in 0..totalFrames: render(ctx,{t:f/fps, images:imageCache, phase:"export"}) → VideoFrame(canvas, timestamp) → encode(keyFrame every 60) → backpressure queue>4
  audio: for offset 0..neededSamples step 1024: interleaveAudio(buffer, offset, frames) → AudioData(f32) → encode
  flush both → muxer.finalize() → Blob video/mp4 → download rakhi-{id}.mp4 (revoke after 30s)
  ```
- **Fallback (MediaRecorder):** `canvas.captureStream(fps)` → `MediaRecorder(mime, 8M/4.5M)` → `requestAnimationFrame` loop renders same `renderer.render` until `totalSec` → `Blob webm/mp4`.

### 3.7 Sharing — Two Links, Zero Confusion

- **Slug URLs:** `POST /api/cards` generates `sender-from-recipient` via `slugify([a-z0-9]+→-, trim -, slice 32)` → `kunal-from-himanshi` (48ch cap). Regex `^[a-z0-9][a-z0-9-]{5,63}$`. On `409 id_taken`, client retries `${slug}-2` … `-5`.
- **View Count:** `GET /api/cards/[id]/view` (separate route `src/app/api/cards/[id]/view/route.ts`) → insert `card_views` + `update cards.views`.
- **Link Variants** (`src/app/r/[id]/page.tsx` reads `searchParams` server-side → `variant` prop):
  - `?clean=1` — **Clean** (what you share with your sister): *pure fullscreen animation, no buttons, no wall* — server-rendered, so no flash (`hasControls=False` verified). Only a subtle `← Prev/Next →/Continue →` pill at bottom when photos exist.
  - Default (`plain`) — **Creator view:** replay/aspect/quality/download/copy plain/clean links + music upload + mute/default + WhatsApp share + `← Home`.
  - `?create=1` — **Plus** (only `Create one for someone you love ✨` button) — for viral growth.
- **Actions:**
  - `Copy Plain Link` / `Copy Clean Link` → `navigator.clipboard.writeText(cardUrl(id, suffix))`
  - `WhatsApp Share` → `https://wa.me/?text=shareText(card)` (`Happy Raksha Bandhan! 💝 ${sender} sent...`)
  - `Download Video` → as above, file `rakhi-{id}.mp4/.webm`
  - `Replay (R)` → `playerRef.seek(t)` or `setPlayerKey(k+1)` (remount)
- **Player Interactivity:** `CardPlayer` (`src/components/CardPlayer.tsx`) `forwardRef` with `seek(t)` + `photoIndex` prop, `hoverIdx/focusIdx`, `toDesign()` for hitTest, `ResizeObserver` + `devicePixelRatio` capped 2. Photos `1 / N` dots at bottom.

### 3.8 Admin (`/admin`) — Your Backstage
- Route `src/app/admin/page.tsx` (client) — passphrase gate (`x-admin-pass` vs `ADMIN_PASS=kunal@rakhi2026`). On submit `GET /api/admin/stats` with header.
- `GET /api/admin/stats` (`src/app/api/admin/stats/route.ts`) returns `{cards:[{id, sender_name, recipient_name, template_id, views, photoCount, created_at}], stats:{totalCards, totalViews}}` (limit 200, `order created_at desc`, `count exact` from `card_views`).
- Table: id (link to `/r/id`), recipient/sender, template, views, photos, created, actions: `Copy` (`cardUrl`) + `Delete` (`DELETE /api/admin/stats?id=...` → `supabase.from(cards).delete()`). Refetch + logout.

### 3.9 API Surface (Only Routes Below — Do Not Add Others)

- `GET/POST /api/cards` — list/create. `POST body {id, senderName, recipientName, message, templateId, aspect, photos:[{url,caption}]}`. Photos must be `https://` (data URLs go via `/api/upload` first).
- `POST /api/upload` — `FormData file` → `{url, path}` (Supabase `photos`).
- `GET /api/cards/[id]` — card JSON `{id, sender_name, recipient_name, message, template_id, aspect, audio_enabled, photos, views, created_at}`.
- `GET /api/cards/[id]/view` — increment view.
- `GET/DELETE /api/admin/stats` — `x-admin-pass` required.

All routes use `supabaseServer()` (service_role) for writes, anon for reads (RLS `cards_select_all`, `storage photos_insert_cards` only into `cards/` folder).

### 3.10 Data Model

**Supabase project `rakhi-vishesh` (`eandahfxrasfcyxvllkq`, `ap-south-1`):**
- `cards(id text PK, sender_name text, recipient_name text, message text, template_id text, aspect text default '9:16', photos jsonb, views int default 0, created_at timestamptz, expires_at timestamptz, audio_enabled bool)`
- `card_views(id bigserial PK, card_id text FK, viewed_at timestamptz)`
- `admins(...)` (reserved)
- Storage bucket `photos` (public, 10MB, `image/*`, policy `anon INSERT into cards/`).

---

## 4) User Journeys

**Creator (Brother):** Lands on `/` → scrolls 8 live previews → clicks `Peacock Paisley` → wizard step 1 highlights → step 2 types `Himanshi` + `Kunal` → step 3 writes `You are my sunshine...` (counter) → step 4 drops 3 photos (sees grid) → step 5 picks `9:16` + checks `Clean link` → sees live big polaroid preview → **Create** → uploads photos → slug `kunal-from-himanshi` → redirect `/r/kunal-from-himanshi?clean=1&created=1` → toast `live!` → bottom pill `1/3 Next →` to browse, `Continue →` to message → control bar `720p/1080p`, `🎵 Phoolon Ka Taron` + upload, `Download Video` → progress `0→100` → `rakhi-kunal-from-himanshi.mp4` saved (with song) → copies `Clean Link` → pastes to WhatsApp.

**Recipient (Sister):** Opens `rakhi-vishesh.vercel.app/r/kunal-from-himanshi?clean=1` on phone → fullscreen doors open (hook) → `HAPPY RAKSHA BANDHAN` types in Anton gold foil → `FOR Himanshi` / `FROM Kunal` typewrites → rope with one big polaroid centred, she taps photo (zooms), taps `Next` → `2/3` → `Continue` → huge `Billion Dreams` message types centred → diyas + fireworks finale → `🔊` to hear the song (tap to play if browser blocked). No wall, no ads.

**Admin (You):** `/admin` → enter `kunal@rakhi2026` → see `Total cards: 42, Total views: 318` → table → copy link for customer → delete spam.

---

## 5) Premium Craft — Why It Doesn’t Look Cheap

- **Doors:** Hinged at `W*0.25/0.75`, wood gradient `#1e0804→#5e1a0e`, double gold frame (`9u` + `1.8u #fff6d6`), wood grain, mandala + brass knob, slide `W*0.58` with `easeOutCubic`, centre glow burst. Fixed from broken overlapping version.
- **Rakhi:** Hand-drawn in canvas (`drawRealisticRakhi`) — shadow, silk threads, 3 beads per thread, tassels, gold foil outer ring (`radial #fff8d6→gold→#b45309`), kundan red jewel, 12 pearls.
- **Gold Foil Everywhere:** `createLinearGradient` + `shadowBlur` for Anton headings, not flat colour.
- **Typography:** Anton `132u` for `HAPPY...`, `168u` for names, Billion Dreams `52u` for taglines, `74u→38u` auto-fit for message — all with `letterSpacing`, `easeOutBack` bloom, typewriter cursors.
- **Motion:** `framer-motion` for UI (`AnimatePresence` slide/fade between wizard steps, `whileInView` staggers), canvas `requestAnimationFrame` at `devicePixelRatio` capped 2, `ResizeObserver` letterbox, `CROSSFADE 1.15s` between scenes via offscreen buffer.
- **Rope Physics:** Sway `sin(t*0.55)*base*0.018`, photo swing `sin(t*1.9+i)*0.04`, rope knots, clothespin bar `12%` top.

---

## 6) Monetization & Next

- **Shipped:** Free tier (all themes visible, 720p preview, 12 photos) + `Pro ₹99` card (display-only, `mailto:` CTA). No watermark yet — Pro would unlock `1080p` + remove watermark (ready to gate).
- **Ready to wire:** Add `RAZORPAY_KEY_ID/SECRET` + `UPI_ID` env, `POST /api/pay/verify` + `cards.tier` column, gate `quality` and `maxPhotos` in `POST /api/cards`, show `Pro` badge.
- **Custom Domain:** Code ready for `opengiftversal.com` (you mentioned `open giftversal com`). Domain not found in Cloudflare zone for the `CLOUDFLARE_ACCESS_TOKEN` — buy it at Namecheap/GoDaddy, add to Cloudflare, tell me and I’ll `vercel domains add rakhi.opengiftversal.com` + CNAME `cname.vercel-dns.com` + env update in one command.

---

## 7) How to Run / Verify (For You)

- **Local:** `npm run dev` (port 3000), `npm run build` clean, `npx tsc --noEmit` clean.
- **Live smoke:** `GET /api/cards/demoheart2026` → `aspect 9:16`, `POST /api/cards` with `test-photo-` + `picsum` → `409` on dup, `GET /r/test?clean=1` → `hasControls=False`, `hasNext True`, `/default-music.mp3` 200.
- **Manual check (needs your eyes):** Create a card with 2 photos on your phone Chrome, hit `Next` → photo switches centred, `Continue` → big message, `🔊` → song plays, `Download Video` → MP4 plays start→end with song (try `720p` first — faster).

---

**Built with love for that first door opening — the hook that makes a sister smile before a single word is read. Happy Raksha Bandhan, Raja. 🪔**
