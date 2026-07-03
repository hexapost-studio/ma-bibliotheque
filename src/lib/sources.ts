// Recherche de disponibilité gratuite, exécutée CÔTÉ NAVIGATEUR.
// Gutendex et Open Library autorisent le CORS et répondent depuis l'IP de
// l'utilisateur (les appels côté serveur Vercel étaient bloqués/lents).
// LibriVox n'a pas de CORS → petit proxy serveur `/api/librivox`.

export interface FreeSource {
  source: string;
  label: string;
  url: string;
  format: string;
}
export interface Availability {
  publicDomain: boolean;
  formats: string[];
  free: FreeSource[];
  audio: FreeSource[];
}
export interface LookupResult {
  titleFr: string;
  titleEn: string;
  author: string;
  isbn: string;
}

async function jget(url: string, ms = 12000): Promise<unknown | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal });
    return r.ok ? await r.json() : null;
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

/** Project Gutenberg via Gutendex — recherche par titre seul (auteurs traduits). */
async function gutendex(title: string): Promise<FreeSource[]> {
  const data = (await jget(`https://gutendex.com/books/?search=${encodeURIComponent(title.trim())}`)) as
    | { results?: Array<{ title: string; formats: Record<string, string> }> }
    | null;
  if (!data?.results?.length) return [];
  const nt = norm(title);
  const match = data.results.find((b) => norm(b.title).includes(nt) || nt.includes(norm(b.title))) ?? data.results[0];
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
  const ebooks = data?.[`ISBN:${isbn}`]?.ebooks ?? [];
  const out: FreeSource[] = [];
  for (const e of ebooks) {
    if (!e.preview_url) continue;
    if (e.availability === "full") out.push({ source: "Internet Archive", label: "Lire en ligne (gratuit)", url: e.preview_url, format: "Lecture en ligne" });
    else if (e.availability === "borrow") out.push({ source: "Open Library", label: "Emprunter gratuitement", url: e.preview_url, format: "Emprunt" });
  }
  return out;
}

/** LibriVox — via proxy serveur (pas de CORS). */
async function librivox(title: string): Promise<FreeSource[]> {
  const data = (await jget(`/api/librivox?title=${encodeURIComponent(title)}`)) as { audio?: FreeSource[] } | null;
  return data?.audio ?? [];
}

export interface BookLike {
  titleFr: string;
  titleEn: string;
  author: string;
  isbn: string;
  publicDomain: boolean;
}

/** Orchestration : agrège les sources gratuites d'un livre. */
export async function getAvailability(book: BookLike): Promise<Availability> {
  const title = book.titleEn || book.titleFr;
  const [gut, ol, lv] = await Promise.all([
    book.publicDomain ? gutendex(title) : Promise.resolve<FreeSource[]>([]),
    openlibrary(book.isbn),
    book.publicDomain ? librivox(title) : Promise.resolve<FreeSource[]>([]),
  ]);
  const free = [...gut, ...ol];
  const audio = lv;
  const formats = Array.from(new Set([...free, ...audio].map((f) => f.format)));
  const publicDomain = book.publicDomain && (gut.length > 0 || lv.length > 0);
  return { publicDomain, formats, free, audio };
}

/** Recherche de métadonnées par ISBN (import). */
export async function lookupBook(isbn: string): Promise<LookupResult | null> {
  const clean = isbn.replace(/[\s-]/g, "");
  if (!clean) return null;
  const data = (await jget(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&jscmd=data&format=json`
  )) as Record<string, { title?: string; authors?: Array<{ name?: string }> }> | null;
  const b = data?.[`ISBN:${clean}`];
  if (!b?.title) return null;
  return { titleFr: b.title, titleEn: b.title, author: b.authors?.[0]?.name ?? "", isbn: clean };
}
