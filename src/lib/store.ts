"use client";

import { useSyncExternalStore } from "react";
import { BOOKS, type Book, type Status } from "@/data/books";

const KEY = "ma-biblio.v1";

export interface Override {
  status?: Status;
  rating?: number;
}
export interface CustomBook extends Book {
  custom: true;
}
interface Persisted {
  overrides: Record<string, Override>; // clé = isbn ou custom id
  custom: CustomBook[];
  priceAlerts: Record<string, number>; // isbn -> prix cible
}

const EMPTY: Persisted = { overrides: {}, custom: [], priceAlerts: {} };

let state: Persisted = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): Persisted {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw) as Partial<Persisted>;
    return { overrides: p.overrides ?? {}, custom: p.custom ?? [], priceAlerts: p.priceAlerts ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = load();
    loaded = true;
  }
}

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): Persisted {
  ensureLoaded();
  return state;
}

const SERVER_SNAP = EMPTY;

/** Catalogue = seed + livres personnalisés, avec les overrides appliqués. */
export function useLibrary(): Book[] {
  const s = useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAP);
  const all: Book[] = [...BOOKS, ...s.custom];
  return all.map((b) => {
    const o = s.overrides[b.isbn] ?? s.overrides[String(b.id)];
    if (!o) return b;
    return { ...b, status: o.status ?? b.status, rating: o.rating ?? b.rating };
  });
}

export function usePriceAlerts(): Record<string, number> {
  const s = useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAP);
  return s.priceAlerts;
}

function keyOf(b: Book): string {
  return (b as CustomBook).custom ? String(b.id) : b.isbn;
}

export function setStatus(b: Book, status: Status) {
  ensureLoaded();
  const k = keyOf(b);
  state = { ...state, overrides: { ...state.overrides, [k]: { ...state.overrides[k], status } } };
  persist();
}

export function setRating(b: Book, rating: number) {
  ensureLoaded();
  const k = keyOf(b);
  state = { ...state, overrides: { ...state.overrides, [k]: { ...state.overrides[k], rating } } };
  persist();
}

export function setPriceAlert(isbn: string, target: number | null) {
  ensureLoaded();
  const next = { ...state.priceAlerts };
  if (target == null) delete next[isbn];
  else next[isbn] = target;
  state = { ...state, priceAlerts: next };
  persist();
}

const PALETTE = ["#c96b3f", "#3f5b52", "#2f4a6b", "#d8a13a", "#7a2f2f", "#4a4740", "#6b5a3f", "#8a5a6b", "#b5623c", "#2f5b4a", "#3a3550", "#9a6b2f"];
const TEXTS = ["#fff5ea", "#eef5f0", "#eaf1f8", "#3a2c10", "#f8eaea", "#f2efe8", "#f7f0e2", "#f9edf1", "#fdf1e6", "#eaf5ef", "#eeecf6", "#fbf1df"];

export interface NewBook {
  titleFr: string;
  titleEn?: string;
  author: string;
  isbn?: string;
  domain?: string;
  price?: number;
}

function buildCustom(input: NewBook, id: number): CustomBook {
  const price = input.price ?? 0;
  const i = id % PALETTE.length;
  return {
    id,
    titleFr: input.titleFr,
    titleEn: input.titleEn || input.titleFr,
    author: input.author,
    isbn: input.isbn || "",
    domain: input.domain?.trim() || "Mes ajouts",
    price,
    priceHistory: price ? [price] : [],
    reference: false,
    publicDomain: false,
    status: "souhait",
    rating: 0,
    color: PALETTE[i],
    text: TEXTS[i],
    custom: true,
  };
}

export function addCustomBook(input: NewBook) {
  addBooksBatch([input]);
}

/** Ajoute plusieurs livres d'un coup (import). Retourne le nombre ajouté. */
export function addBooksBatch(inputs: NewBook[]): number {
  ensureLoaded();
  let nextId = 100000 + state.custom.length;
  const additions = inputs
    .filter((b) => b.titleFr.trim())
    .map((b) => buildCustom(b, ++nextId));
  if (additions.length === 0) return 0;
  state = { ...state, custom: [...state.custom, ...additions] };
  persist();
  return additions.length;
}

export function removeCustomBook(id: number) {
  ensureLoaded();
  state = { ...state, custom: state.custom.filter((c) => c.id !== id) };
  persist();
}
