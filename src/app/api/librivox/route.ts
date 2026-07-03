import { NextResponse } from "next/server";
import type { FreeSource } from "@/lib/sources";

export const revalidate = 86400;
export const maxDuration = 15;

/** Proxy LibriVox (l'API n'expose pas de CORS pour un appel navigateur direct). */
export async function GET(req: Request) {
  const title = new URL(req.url).searchParams.get("title") ?? "";
  if (!title) return NextResponse.json({ audio: [] });

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12000);
  try {
    const r = await fetch(
      `https://librivox.org/api/feed/audiobooks/?title=${encodeURIComponent(title)}&format=json&limit=1`,
      { signal: ac.signal, headers: { "User-Agent": "ma-bibliotheque/1.0 (open-source book library)" } }
    );
    if (!r.ok) return NextResponse.json({ audio: [] });
    const data = (await r.json()) as { books?: Array<{ url_librivox?: string; url_zip_file?: string }> };
    const b = data.books?.[0];
    const audio: FreeSource[] = [];
    if (b?.url_librivox) audio.push({ source: "LibriVox", label: "Écouter (audio libre)", url: b.url_librivox, format: "Audio" });
    if (b?.url_zip_file) audio.push({ source: "LibriVox", label: "Télécharger le MP3 (zip)", url: b.url_zip_file, format: "Audio" });
    return NextResponse.json({ audio });
  } catch {
    return NextResponse.json({ audio: [] });
  } finally {
    clearTimeout(t);
  }
}
