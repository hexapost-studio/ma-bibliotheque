"use client";

import { useEffect, useReducer } from "react";
import type { Book } from "@/data/books";
import { getAvailability, type Availability } from "@/lib/sources";

const cache = new Map<string, Availability>();
const inFlight = new Set<string>();

function keyOf(book: Book): string {
  return book.isbn || `${book.titleEn}|${book.author}`;
}

function empty(): Availability {
  return { publicDomain: false, formats: [], free: [], audio: [] };
}

/**
 * Récupère la disponibilité gratuite d'un livre (Gutendex + Open Library depuis
 * le navigateur, LibriVox via proxy). État dérivé du cache — pas de setState
 * synchrone dans l'effet.
 */
export function useAvailability(book: Book | null): { data: Availability | null; loading: boolean } {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const key = book ? keyOf(book) : "";

  useEffect(() => {
    if (!book || !key || cache.has(key) || inFlight.has(key)) return;
    inFlight.add(key);
    let cancelled = false;
    getAvailability(book)
      .then((d) => cache.set(key, d))
      .catch(() => cache.set(key, empty()))
      .finally(() => {
        inFlight.delete(key);
        if (!cancelled) force();
      });
    return () => {
      cancelled = true;
    };
  }, [book, key]);

  const data = key && cache.has(key) ? cache.get(key)! : null;
  const loading = !!key && !cache.has(key);
  return { data, loading };
}
