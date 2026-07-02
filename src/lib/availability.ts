"use client";

import { useEffect, useState } from "react";
import type { Book } from "@/data/books";
import type { Availability } from "@/app/api/availability/route";

const cache = new Map<string, Availability>();

export function useAvailability(book: Book | null): { data: Availability | null; loading: boolean } {
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!book) {
      setData(null);
      return;
    }
    const key = book.isbn || `${book.titleEn}|${book.author}`;
    if (cache.has(key)) {
      setData(cache.get(key)!);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      title: book.titleEn || book.titleFr,
      author: book.author,
      isbn: book.isbn,
      pd: book.publicDomain ? "1" : "0",
    });
    fetch(`/api/availability?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Availability | null) => {
        if (cancelled || !d) return;
        cache.set(key, d);
        setData(d);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [book]);

  return { data, loading };
}
