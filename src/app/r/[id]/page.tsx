import Link from "next/link";
import type { CardData, PhotoSpec, ThemeId } from "@/lib/types";
import PlayerClient from "./Player";

export const dynamic = "force-dynamic";

interface CardResponse {
  id: string;
  sender_name: string;
  recipient_name: string;
  message: string;
  template_id: string;
  photos?: Array<{ url?: string; caption?: string }>;
}

function mapCard(data: CardResponse): CardData {
  const photos: PhotoSpec[] = (Array.isArray(data.photos) ? data.photos : []).filter(
    (p): p is PhotoSpec => typeof p?.url === "string",
  );
  return {
    id: data.id,
    senderName: data.sender_name,
    recipientName: data.recipient_name,
    message: data.message,
    templateId: data.template_id as ThemeId,
    photos,
  };
}

function NotFoundHero({ status, message }: { status: number; message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-zinc-950 px-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-5xl">
        🏵️
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">{status === 404 ? "Card not found" : "Something went wrong"}</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{status === 404 ? "This rakhi card doesn't exist" : "We couldn't load this card"}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
          {status === 404
            ? "It may have been removed, or the link was typed wrong."
            : message || "Please try again in a moment."}
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 transition hover:brightness-110"
      >
        ← Back home
      </Link>
    </div>
  );
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let res: Response;
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const url = base ? `${base}/api/cards/${id}` : `/api/cards/${id}`;
    res = await fetch(url, { cache: "no-store" });
  } catch (err) {
    return <NotFoundHero status={500} message={err instanceof Error ? err.message : "Network error while loading the card."} />;
  }

  if (res.status === 404) {
    return <NotFoundHero status={404} message="" />;
  }
  if (!res.ok) {
    return <NotFoundHero status={res.status} message={`Server error (${res.status}) while loading the card.`} />;
  }

  const data = (await res.json()) as CardResponse;
  if (!data?.id || typeof data.sender_name !== "string" || typeof data.recipient_name !== "string") {
    return <NotFoundHero status={404} message="" />;
  }

  return <PlayerClient card={mapCard(data)} />;
}
