# AGENTS.md — RakhiVishesh
Rakhi card web app: create → share → animated card plays on `/r/[id]`, export video.

## Stack
- Next.js 16.3.2 APP ROUTER (src/), React 19, TS strict, Tailwind v4 (CSS-first, globals.css)
- Motion: `framer-motion`; authz: none public.

## ENV
`.env.local` exists. Do not commit. Never echo secrets.

## API (only routes below; do not add others)
- `GET/POST /api/cards` — list/create. POST body: `{ id, senderName, recipientName, message, templateId, photos:[{url,caption}]}`. photos urls are upload response URLs from `/api/upload`.
- `POST /api/upload` — multipart FormData field `file`, returns `{ url, path }`.
- `GET /api/cards/[id]` — card JSON.
- `GET/POST /api/cards/[id]/view` — increments view count (call once on player mount).
- `GET /api/admin/stats` — requires `x-admin-pass` header (ADMIN_PASS), returns stats + cards.

## Shared libs (DO NOT EDIT)
- `src/engine/*` — canvas animation renderer. `Renderer` class with `render(ctx,{t})`, `timelineInfo.total`. `RakhiRenderer` in `scenes.ts` supports photos via `images: Map<url,HTMLImageElement|null>`.
- `src/lib/types.ts` — `CardRecord`, `CreateCardInput`, `PhotoSpec`.
- `src/lib/utils.ts` — `cardUrl`, `shareText`, `demoCard`, `themeList`.
- `src/lib/supabase.ts` — client/server.
- `src/components/CardPlayer.tsx` — `<CardPlayer card={...} themeId autoplay loop className />`, live canvas animation component.

## Themes
`src/engine/themes.ts`: marigold, peacock, diya, rose, cosmic, jewel, mehndi, confetti. Each has `name/emoji/tagline`. `themeList()` returns all.

## Conventions
- `"use client"` where hooks used; server comps keep DB calls in route handlers.
- Styling: Tailwind classes only; css vars in globals.css.
- Photos array max 12; message max 600 chars; recipient required; others optional.
