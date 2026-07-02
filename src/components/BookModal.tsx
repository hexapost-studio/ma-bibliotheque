"use client";

import { useEffect } from "react";
import type { Book, Status } from "@/data/books";
import { STATUS_META, STATUS_ORDER, ACCENT, eur, externalLinks } from "@/lib/meta";
import { setRating, setStatus } from "@/lib/store";
import { useAvailability } from "@/lib/availability";
import BookSpine from "./BookSpine";
import Sparkline from "./Sparkline";

export default function BookModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const { data, loading } = useAvailability(book);
  const links = externalLinks(book.titleFr, book.titleEn, book.author);
  const meta = STATUS_META[book.status];
  const lowest = Math.min(...(book.priceHistory.length ? book.priceHistory : [book.price]));
  const drop = book.priceHistory.length ? book.priceHistory[0] - book.price : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,18,10,.62)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: "100%",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#f7f0e2",
          borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0,0,0,.5)",
          padding: 30,
        }}
      >
        <div style={{ display: "flex", gap: 22 }}>
          <div style={{ flex: "0 0 150px" }}>
            <BookSpine book={book} width={150} height={216} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{ float: "right", border: "none", background: "#e7dcc9", color: "#6b5844", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".6px", color: "#a4917a", marginBottom: 4 }}>{book.domain}</div>
            <h2 style={{ fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 24, color: "#2a2018", margin: "0 6px 2px 0", lineHeight: 1.2 }}>{book.titleFr}</h2>
            <div style={{ fontFamily: "var(--font-serif), serif", fontStyle: "italic", fontSize: 15, color: "#8a7a68" }}>{book.titleEn}</div>
            <div style={{ fontSize: 14, color: "#7a6a58", marginTop: 6 }}>{book.author}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 22, color: ACCENT }}>{book.price ? eur(book.price) : "—"}</span>
              {drop > 0.01 && <span style={{ fontSize: 12, color: "#5a7052", fontWeight: 600 }}>▼ {eur(drop)} depuis le suivi</span>}
            </div>
          </div>
        </div>

        {/* Suivi de prix */}
        {book.priceHistory.length > 1 && (
          <section style={box}>
            <div style={legend}>Suivi de prix</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Sparkline data={book.priceHistory} width={160} height={40} />
              <div style={{ fontSize: 13, color: "#6b5844" }}>
                <div>Actuel : <b style={{ color: ACCENT }}>{eur(book.price)}</b></div>
                <div>Plus bas observé : <b>{eur(lowest)}</b></div>
              </div>
            </div>
          </section>
        )}

        {/* Note */}
        <section style={box}>
          <div style={legend}>Ma note</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setRating(book, v === book.rating ? 0 : v)}
                aria-label={`${v} étoiles`}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: 28, lineHeight: 1, padding: 0, color: v <= book.rating ? "#c9a227" : "#d8ccb6" }}
              >
                ★
              </button>
            ))}
          </div>
        </section>

        {/* Statut */}
        <section style={box}>
          <div style={legend}>Statut</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_ORDER.map((v: Status) => {
              const m = STATUS_META[v];
              const active = book.status === v;
              return (
                <button
                  key={v}
                  onClick={() => setStatus(book, v)}
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    padding: "9px 15px",
                    borderRadius: 9,
                    cursor: "pointer",
                    border: `1px solid ${m.color}`,
                    background: active ? m.color : "transparent",
                    color: active ? "#fff" : m.color,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Disponibilité gratuite */}
        <section style={box}>
          <div style={legend}>Consultation gratuite &amp; formats</div>
          {loading && <div style={{ fontSize: 13, color: "#a4917a", fontStyle: "italic" }}>Recherche des versions libres…</div>}
          {!loading && data && (data.free.length > 0 || data.audio.length > 0) ? (
            <>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {data.publicDomain && <span style={badge("#5a7052")}>Domaine public</span>}
                {data.formats.map((f) => (
                  <span key={f} style={badge("#8a7a68")}>{f}</span>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[...data.free, ...data.audio].map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={freeRow}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#4a3527" }}>{s.format}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#6b5844" }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: "#a4917a" }}>{s.source} →</span>
                  </a>
                ))}
              </div>
            </>
          ) : (
            !loading && (
              <div style={{ fontSize: 13, color: "#8a7a68" }}>
                Aucune version gratuite trouvée — probablement sous droits.{" "}
                <a href={links.googleBooks} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>Vérifier un aperçu</a>
              </div>
            )
          )}
        </section>

        {/* Acheter / écouter */}
        <section style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={links.amazon} target="_blank" rel="noopener noreferrer" style={btn(ACCENT, 2)}>🛒 Amazon</a>
            <a href={links.fnac} target="_blank" rel="noopener noreferrer" style={btn("#7a5c3a", 1)}>📚 Fnac</a>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={links.audible} target="_blank" rel="noopener noreferrer" style={btn("#5a7052", 1)}>🎧 Audible</a>
            <a href={links.youtube} target="_blank" rel="noopener noreferrer" style={btn("#8a3b34", 1)}>▶ Résumé YouTube</a>
          </div>
        </section>
      </div>
    </div>
  );
}

const box: React.CSSProperties = { marginTop: 22, paddingTop: 18, borderTop: "1px solid #e3d6bf" };
const legend: React.CSSProperties = { fontSize: 12, letterSpacing: ".6px", textTransform: "uppercase", color: "#a4917a", marginBottom: 10 };
const freeRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
  background: "#fff",
  border: "1px solid #e3d6bf",
  borderRadius: 9,
  padding: "9px 12px",
};
function badge(color: string): React.CSSProperties {
  return { fontSize: 11, fontWeight: 700, color: "#fff", background: color, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".3px" };
}
function btn(bg: string, flex: number): React.CSSProperties {
  return { flex, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", background: bg, color: "#fff", padding: "12px 16px", borderRadius: 10, fontWeight: 700, fontSize: 14 };
}
