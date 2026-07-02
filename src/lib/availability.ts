"use client";

import { useEffect, useReducer } from "react";
import type { Book } from "@/data/books";
import type { Availability } from "@/app/api/availability/route";

const cache = new Map<string, Availability>();
const inFlight = new Set<string>();

function keyOf(book: Book): string {
  return book.isbn || `${book.titleEn}|${book.author}`;
}

function empty(): Availability {
  return { publicDomain: false, formats: [], free: [], audio: [], updatedAt: new Date().toISOString() };
}

/**
 * Récupère la disponibilité gratuite d'un livre.
 * L'état dérive du cache module — pas de setState synchrone dans l'effet :
 * l'effet lance seulement le fetch et force un re-rendu à la résolution.
 */
export function useAvailability(book: Book | null): { data: Availability | null; loading: boolean } {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const key = book ? keyOf(book) : "";

  useEffect(() => {
    if (!book || !key || cache.has(key) || inFlight.has(key)) return;
    inFlight.add(key);
    const ac = new AbortController();
    const params = new URLSearchParams({
      title: book.titleEn || book.titleFr,
      author: book.author,
      isbn: book.isbn,
      pd: book.publicDomain ? "1" : "0",
    });
    fetch(`/api/availability?${params}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Availability | null) => {
        // On mémorise toujours un résultat (réel ou vide) pour arrêter le chargement.
        cache.set(key, d ?? empty());
      })
      .catch(() => {
        if (!ac.signal.aborted) cache.set(key, empty());
      })
      .finally(() => {
        inFlight.delete(key);
        force();
      });
    return () => ac.abort();
  }, [book, key]);

  const data = key && cache.has(key) ? cache.get(key)! : null;
  const loading = !!key && !cache.has(key);
  return { data, loading };
}
