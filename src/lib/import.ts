// Parseur universel de listes de souhaits / bibliothèques.
// Fonctions pures (sans I/O) pour rester testables.

export interface ImportItem {
  titleFr: string;
  author: string;
  isbn: string;
  domain?: string;
  raw: string;
}

const ISBN_RE = /(?:97[89][\s-]?)?(?:\d[\s-]?){9}[\dxX]/;

/** Extrait un ISBN-10/13 d'une chaîne, sans séparateurs, ou "" sinon. */
export function extractIsbn(s: string): string {
  const m = s.match(ISBN_RE);
  if (!m) return "";
  const digits = m[0].replace(/[\s-]/g, "").toUpperCase();
  return digits.length === 10 || digits.length === 13 ? digits : "";
}

/** Nettoie une ligne : puces, numérotation, guillemets, dates/éditions en suffixe. */
function clean(line: string): string {
  return line
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/\s*\((?:19|20)\d{2}(?:-\d{2}-\d{2})?\)\s*$/, "")
    .replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "")
    .trim();
}

/** Sépare "Titre <sep> Auteur" selon les séparateurs usuels. */
function splitTitleAuthor(line: string): { title: string; author: string } {
  const byMatch = line.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) return { title: byMatch[1].trim(), author: byMatch[2].trim() };
  for (const sep of [" — ", " – ", " - "]) {
    const idx = line.indexOf(sep);
    if (idx > 0) return { title: line.slice(0, idx).trim(), author: line.slice(idx + sep.length).trim() };
  }
  return { title: line, author: "" };
}

/** Découpe une ligne CSV en respectant les guillemets. */
function splitCsvRow(row: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') {
      if (inQ && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function findCol(headers: string[], names: string[]): number {
  return headers.findIndex((h) => names.some((n) => h.toLowerCase().includes(n)));
}

/** Parse un export CSV (Goodreads, Amazon, tableur générique). */
function parseCsv(lines: string[]): ImportItem[] {
  const headers = splitCsvRow(lines[0]);
  const ti = findCol(headers, ["titre", "title"]);
  const ai = findCol(headers, ["auteur", "author"]);
  const ii = findCol(headers, ["isbn"]);
  const di = findCol(headers, ["domaine", "domain", "genre", "shelf", "catégorie", "category"]);
  const items: ImportItem[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvRow(lines[r]);
    const title = clean(cols[ti] ?? "");
    if (!title) continue;
    items.push({
      titleFr: title,
      author: clean(cols[ai] ?? ""),
      isbn: extractIsbn(cols[ii] ?? "") || extractIsbn(lines[r]),
      domain: di >= 0 ? clean(cols[di] ?? "") || undefined : undefined,
      raw: lines[r],
    });
  }
  return items;
}

/**
 * Parse un texte collé depuis n'importe quelle source (Amazon, Google, Goodreads,
 * liste manuelle) et retourne des livres normalisés et dédupliqués.
 */
export function parseWishlist(text: string): ImportItem[] {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return [];

  // Détection CSV : en-tête contenant une colonne titre.
  const first = rawLines[0].toLowerCase();
  const looksCsv = first.includes(",") && (first.includes("title") || first.includes("titre"));
  const items = looksCsv
    ? parseCsv(rawLines)
    : rawLines.map((raw) => {
        const line = clean(raw);
        const isbn = extractIsbn(line);
        // Ligne = uniquement un ISBN : on laisse l'enrichissement remplir le titre.
        if (isbn && line.replace(ISBN_RE, "").replace(/isbn/i, "").trim().length === 0) {
          return { titleFr: "", author: "", isbn, raw };
        }
        const { title, author } = splitTitleAuthor(line);
        return { titleFr: title, author, isbn, raw };
      });

  // Déduplication (ISBN prioritaire, sinon titre+auteur normalisés).
  const seen = new Set<string>();
  const out: ImportItem[] = [];
  for (const it of items) {
    if (!it.titleFr && !it.isbn) continue;
    const key = it.isbn || `${it.titleFr}|${it.author}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}
