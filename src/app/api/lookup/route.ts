import { NextResponse } from "next/server";

export const revalidate = 86400;

export interface LookupResult {
  titleFr: string;
  titleEn: string;
  author: string;
  isbn: string;
}

async function jget(url: string, ms = 7000): Promise<unknown | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    // Voir note dans availability/route.ts : pas d'option `next` avec `signal`.
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { "User-Agent": "ma-bibliotheque/1.0 (open-source book library)" },
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

interface OLBook {
  title?: string;
  authors?: Array<{ name?: string }>;
  identifiers?: { isbn_13?: string[]; isbn_10?: string[] };
}

/** GET ?isbn=... ou ?q=titre auteur → métadonnées Open Library. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isbn = (searchParams.get("isbn") ?? "").replace(/[\s-]/g, "");
  const q = searchParams.get("q") ?? "";

  if (isbn) {
    const data = (await jget(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
    )) as Record<string, OLBook> | null;
    const b = data?.[`ISBN:${isbn}`];
    if (b?.title) {
      const res: LookupResult = {
        titleFr: b.title,
        titleEn: b.title,
        author: b.authors?.[0]?.name ?? "",
        isbn,
      };
      return NextResponse.json(res);
    }
    return NextResponse.json({ titleFr: "", titleEn: "", author: "", isbn }, { status: 200 });
  }

  if (q) {
    const data = (await jget(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1&fields=title,author_name,isbn`
    )) as { docs?: Array<{ title?: string; author_name?: string[]; isbn?: string[] }> } | null;
    const d = data?.docs?.[0];
    if (d?.title) {
      const res: LookupResult = {
        titleFr: d.title,
        titleEn: d.title,
        author: d.author_name?.[0] ?? "",
        isbn: d.isbn?.find((x) => x.length === 13) ?? d.isbn?.[0] ?? "",
      };
      return NextResponse.json(res);
    }
  }

  return NextResponse.json({ error: "isbn ou q requis" }, { status: 400 });
}
