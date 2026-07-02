import { NextResponse } from "next/server";

export const revalidate = 86400; // 24 h

export interface FreeSource {
  source: string;
  label: string;
  url: string;
  format: string; // EPUB, Kindle, TXT, HTML, PDF, Audio, Lecture en ligne, Emprunt
}
export interface Availability {
  publicDomain: boolean;
  formats: string[];
  free: FreeSource[];
  audio: FreeSource[];
  updatedAt: string;
}

async function jget(url: string, ms = 8000): Promise<unknown | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { "User-Agent": "ma-bibliotheque/1.0 (open-source book library)" },
      next: { revalidate: 86400 },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Projet Gutenberg via Gutendex — domaine public, formats téléchargeables. */
async function gutendex(title: string, author: string): Promise<FreeSource[]> {
  // Recherche par titre uniquement : les noms d'auteurs traduits (Homère vs
  // Homer) feraient échouer une recherche combinée titre+auteur côté Gutendex.
  void author;
  const q = encodeURIComponent(title.trim());
  const data = (await jget(`https://gutendex.com/books/?search=${q}`)) as
    | { results?: Array<{ title: string; formats: Record<string, string> }> }
    | null;
  if (!data?.results?.length) return [];
  const nt = norm(title);
  const match =
    data.results.find((b) => norm(b.title).includes(nt) || nt.includes(norm(b.title))) ??
    data.results[0];
  if (!match) return [];
  const out: FreeSource[] = [];
  const fmts = match.formats || {};
  const pick = (mime: string, format: string, label: string) => {
    const url = Object.entries(fmts).find(([k]) => k.startsWith(mime))?.[1];
    if (url && !url.endsWith(".zip")) out.push({ source: "Project Gutenberg", label, url, format });
  };
  pick("application/epub+zip", "EPUB", "EPUB (liseuse)");
  pick("application/x-mobipocket-ebook", "Kindle", "Kindle / MOBI");
  pick("text/html", "HTML", "Lire dans le navigateur");
  pick("text/plain", "TXT", "Texte brut");
  return out;
}

/** Open Library — lecture en ligne / emprunt. */
async function openlibrary(isbn: string): Promise<FreeSource[]> {
  if (!isbn) return [];
  const data = (await jget(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
  )) as Record<string, { ebooks?: Array<{ availability?: string; preview_url?: string }> }> | null;
  const entry = data?.[`ISBN:${isbn}`];
  const ebooks = entry?.ebooks || [];
  const out: FreeSource[] = [];
  for (const e of ebooks) {
    if (!e.preview_url) continue;
    if (e.availability === "full") {
      out.push({ source: "Internet Archive", label: "Lire en ligne (gratuit)", url: e.preview_url, format: "Lecture en ligne" });
    } else if (e.availability === "borrow") {
      out.push({ source: "Open Library", label: "Emprunter gratuitement", url: e.preview_url, format: "Emprunt" });
    }
  }
  return out;
}

/** Librivox — livres audio du domaine public. */
async function librivox(title: string): Promise<FreeSource[]> {
  const data = (await jget(
    `https://librivox.org/api/feed/audiobooks/?title=${encodeURIComponent(title)}&format=json&limit=1`
  )) as { books?: Array<{ title: string; url_librivox?: string; url_zip_file?: string }> } | null;
  const b = data?.books?.[0];
  if (!b) return [];
  const out: FreeSource[] = [];
  if (b.url_librivox) out.push({ source: "LibriVox", label: "Écouter (audio libre)", url: b.url_librivox, format: "Audio" });
  if (b.url_zip_file) out.push({ source: "LibriVox", label: "Télécharger le MP3 (zip)", url: b.url_zip_file, format: "Audio" });
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "";
  const author = searchParams.get("author") ?? "";
  const isbn = searchParams.get("isbn") ?? "";
  const pd = searchParams.get("pd") === "1";

  if (!title) return NextResponse.json({ error: "title requis" }, { status: 400 });

  const [gut, ol, lv] = await Promise.all([
    pd ? gutendex(title, author) : Promise.resolve([]),
    openlibrary(isbn),
    pd ? librivox(title) : Promise.resolve([]),
  ]);

  const free = [...gut, ...ol];
  const audio = lv;
  const formats = Array.from(new Set([...free, ...audio].map((f) => f.format)));
  const publicDomain = pd && (gut.length > 0 || lv.length > 0);

  const result: Availability = {
    publicDomain,
    formats,
    free,
    audio,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(result);
}
