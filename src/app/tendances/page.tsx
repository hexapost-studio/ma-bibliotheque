"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/data/books";
import { DOMAINS } from "@/data/books";
import { useLibrary } from "@/lib/store";
import { eur, stars, ACCENT } from "@/lib/meta";
import BookSpine from "@/components/BookSpine";
import BookModal from "@/components/BookModal";

export default function TendancesPage() {
  const books = useLibrary();
  const [selected, setSelected] = useState<Book | null>(null);

  const byDomain = useMemo(() => {
    return DOMAINS.map((d) => ({
      domain: d,
      books: books.filter((b) => b.domain === d && b.reference),
    })).filter((g) => g.books.length > 0);
  }, [books]);

  // "Tendance" = références encore non lues, mises en avant.
  const trending = useMemo(
    () => books.filter((b) => b.reference && b.status !== "lu").slice(0, 8),
    [books]
  );

  const selectedLive = selected ? books.find((b) => b.id === selected.id) ?? selected : null;

  return (
    <main style={{ maxWidth: 1500, margin: "0 auto", padding: "26px 32px 60px" }}>
      <section style={{ marginBottom: 36 }}>
        <h2 style={h2}>Tendances du moment</h2>
        <p style={sub}>Des incontournables à découvrir en priorité dans ta bibliothèque.</p>
        <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 10 }}>
          {trending.map((b) => (
            <div key={b.id} onClick={() => setSelected(b)} style={{ cursor: "pointer", flex: "0 0 130px", width: 130 }}>
              <BookSpine book={b} width={130} height={188} />
              <div style={{ marginTop: 8, fontSize: 12, color: "#8a7a68", textAlign: "center" }}>{b.price ? eur(b.price) : "—"}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={h2}>À lire par domaine</h2>
        <p style={sub}>Les ouvrages de référence, classés par champ de connaissance.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18, marginTop: 16 }}>
          {byDomain.map((g) => (
            <div key={g.domain} style={{ background: "#f7f0e2", border: "1px solid #e3d6bf", borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 17, color: "#3b2b20", marginBottom: 12 }}>{g.domain}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.books.map((b) => (
                  <div key={b.id} onClick={() => setSelected(b)} style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "center" }}>
                    <div style={{ flex: "0 0 44px" }}>
                      <BookSpine book={b} width={44} height={64} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#2a2018", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.titleFr}</div>
                      <div style={{ fontSize: 12, color: "#8a7a68" }}>{b.author}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#c9a227" }}>{b.rating ? stars(b.rating) : ""}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{b.price ? eur(b.price) : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedLive && <BookModal book={selectedLive} onClose={() => setSelected(null)} />}
    </main>
  );
}

const h2: React.CSSProperties = { fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 22, color: "#3b2b20", margin: "0 0 4px" };
const sub: React.CSSProperties = { fontSize: 14, color: "#8a7a68", margin: "0 0 8px" };
