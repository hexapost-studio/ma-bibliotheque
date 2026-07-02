import type { Status } from "@/data/books";

export const STATUS_META: Record<Status, { label: string; color: string; short: string }> = {
  souhait: { label: "À acheter", color: "#a08d74", short: "Souhait" },
  possede: { label: "Possédé", color: "#5a7052", short: "Possédé" },
  en_cours: { label: "En cours", color: "#b5623c", short: "En cours" },
  lu: { label: "Lu", color: "#4a6ba0", short: "Lu" },
};

export const STATUS_ORDER: Status[] = ["souhait", "en_cours", "lu", "possede"];

export const ACCENT = "#b5623c";

export function eur(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

export function stars(n: number): string {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export function coverUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

export function slug(s: string): string {
  return encodeURIComponent(s);
}

/** Liens d'achat / recherche externes construits à partir du titre + auteur. */
export function externalLinks(titleFr: string, titleEn: string, author: string) {
  const q = slug(`${titleFr} ${author}`);
  const qEn = slug(`${titleEn} ${author}`);
  return {
    amazon: `https://www.amazon.fr/s?k=${q}&i=stripbooks`,
    fnac: `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${q}`,
    audible: `https://www.audible.fr/search?keywords=${q}`,
    youtube: `https://www.youtube.com/results?search_query=${slug(titleFr + " résumé livre")}`,
    googleBooks: `https://www.google.com/search?tbm=bks&q=${qEn}`,
  };
}
