"use client";

import { useState } from "react";
import type { Book } from "@/data/books";
import { coverUrl } from "@/lib/meta";

interface Props {
  book: Book;
  width: number;
  height: number;
  grayscale?: boolean;
  showCheck?: boolean;
  statusDot?: string;
}

/** Couverture : photo Open Library si dispo, sinon dos typographique coloré. */
export default function BookSpine({ book, width, height, grayscale, showCheck, statusDot }: Props) {
  const [failed, setFailed] = useState(false);
  const hasPhoto = !!book.isbn && !failed;
  const s = Math.min(width, height);
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: "2px 5px 5px 2px",
        boxShadow: "0 8px 18px rgba(50,30,15,.3)",
        background: book.color,
        color: book.text,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${s * 0.09}px ${s * 0.07}px ${s * 0.07}px ${s * 0.12}px`,
        filter: grayscale ? "grayscale(1)" : "none",
        opacity: grayscale ? 0.5 : 1,
        transition: "filter .16s ease, opacity .16s ease",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.max(4, s * 0.06), background: "rgba(0,0,0,.22)" }} />
      <div
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontWeight: 700,
          fontSize: Math.max(8, s * 0.11),
          lineHeight: 1.15,
          zIndex: 2,
        }}
      >
        {book.titleFr}
      </div>
      <div
        style={{
          fontSize: Math.max(6, s * 0.06),
          letterSpacing: ".3px",
          textTransform: "uppercase",
          opacity: 0.85,
          zIndex: 2,
        }}
      >
        {book.author}
      </div>
      {hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl(book.isbn)}
          alt={book.titleFr}
          onError={() => setFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
        />
      )}
      {statusDot && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
            width: Math.max(9, s * 0.09),
            height: Math.max(9, s * 0.09),
            borderRadius: "50%",
            background: statusDot,
            boxShadow: "0 0 0 2px rgba(255,255,255,.4)",
          }}
        />
      )}
      {showCheck && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#5a7052",
            color: "#fff",
            fontSize: 11,
            lineHeight: "16px",
            textAlign: "center",
            boxShadow: "0 0 0 2px rgba(255,255,255,.5)",
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}
