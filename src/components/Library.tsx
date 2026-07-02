"use client";

import { useMemo, useState } from "react";
import type { Book, Status } from "@/data/books";
import { DOMAINS } from "@/data/books";
import { useLibrary } from "@/lib/store";
import { STATUS_META, ACCENT, eur, stars } from "@/lib/meta";
import BookSpine from "./BookSpine";
import BookModal from "./BookModal";

type View = "wall" | "shelf" | "list";
type Filter = "all" | "souhait" | "possede" | "en_cours" | "lu" | "reference";

const VIEWS: { id: View; label: string }[] = [
  { id: "wall", label: "▦ Mur" },
  { id: "shelf", label: "▬ Étagères" },
  { id: "list", label: "☰ Liste" },
];
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "souhait", label: "Souhaités" },
  { id: "possede", label: "Possédés" },
  { id: "en_cours", label: "En cours" },
  { id: "lu", label: "Lus" },
  { id: "reference", label: "Références" },
];

export default function Library() {
  const books = useLibrary();
  const [view, setView] = useState<View>("shelf");
  const [filter, setFilter] = useState<Filter>("all");
  const [domain, setDomain] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Book | null>(null);

  const owned = (b: Book) => b.status !== "souhait";

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return books.filter((b) => {
      const passStatus =
        filter === "all" ? true :
        filter === "reference" ? b.reference :
        filter === "possede" ? owned(b) :
        b.status === (filter as Status);
      const passDomain = domain === "all" || b.domain === domain;
      const passSearch = !ql || b.titleFr.toLowerCase().includes(ql) || b.titleEn.toLowerCase().includes(ql) || b.author.toLowerCase().includes(ql);
      return passStatus && passDomain && passSearch;
    });
  }, [books, filter, domain, q]);

  const ownedCount = books.filter(owned).length;
  const wishCount = books.filter((b) => b.status === "souhait").length;

  // regroupement par domaine pour la vue étagères
  const rows = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const b of visible) {
      if (!map.has(b.domain)) map.set(b.domain, []);
      map.get(b.domain)!.push(b);
    }
    return [...map.entries()];
  }, [visible]);

  const selectedLive = selected ? books.find((b) => b.id === selected.id) ?? selected : null;

  return (
    <>
      {/* En-tête */}
      <div style={{ padding: "16px 32px 0", maxWidth: 1500, margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#c6b49b" }}>
          {books.length} livres · <b style={{ color: "#8fae83" }}>{ownedCount}</b> possédés · <b style={{ color: "#e0a06f" }}>{wishCount}</b> souhaités · <span style={{ color: "#a08d74" }}>{visible.length} affichés</span>
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", paddingBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,.07)", padding: 5, borderRadius: 11, border: "1px solid rgba(255,255,255,.1)" }}>
            {VIEWS.map((v) => (
              <button key={v.id} onClick={() => setView(v.id)} style={tab(view === v.id)}>{v.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "9px 14px" }}>
            <span style={{ color: "#b39d84" }} aria-hidden>⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un titre ou un auteur" placeholder="Rechercher un titre, un auteur…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#f3ead9", width: "100%" }} />
          </div>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={select}>
            <option value="all">Tous les domaines</option>
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 16 }}>
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={chip(filter === f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <main style={{ maxWidth: 1500, margin: "0 auto", padding: "10px 32px 60px" }}>
        {visible.length === 0 && (
          <p style={{ textAlign: "center", color: "#a4917a", fontStyle: "italic", padding: "80px 0", fontFamily: "var(--font-serif), serif", fontSize: 18 }}>Aucun livre ne correspond.</p>
        )}

        {view === "wall" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 13 }}>
            {visible.map((b) => (
              <div key={b.id} onClick={() => setSelected(b)} title={b.titleFr} style={{ cursor: "pointer" }}>
                <BookSpine book={b} width={74} height={106} grayscale={b.status === "souhait"} showCheck={b.status !== "souhait"} />
              </div>
            ))}
          </div>
        )}

        {view === "shelf" &&
          rows.map(([dom, cells]) => (
            <div key={dom} style={{ marginBottom: 26 }}>
              <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 15, color: "#5a4636", marginBottom: 10, fontWeight: 700 }}>{dom}</div>
              <div style={{ display: "flex", gap: 28, padding: "0 4px 16px", alignItems: "flex-end", minHeight: 230, overflowX: "auto" }}>
                {cells.map((b) => (
                  <div key={b.id} onClick={() => setSelected(b)} style={{ cursor: "pointer", flex: "0 0 150px", width: 150 }}>
                    <BookSpine book={b} width={150} height={216} statusDot={STATUS_META[b.status].color} grayscale={b.status === "souhait"} />
                    <div style={{ marginTop: 8, textAlign: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#c9a227" }}>{b.rating ? stars(b.rating) : ""}</div>
                      <div style={{ fontSize: 12, color: "#8a7a68" }}>{b.price ? eur(b.price) : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ height: 18, borderRadius: 3, background: "linear-gradient(180deg,#7d5940,#5a3f2c)", boxShadow: "0 10px 16px rgba(50,30,15,.35), inset 0 2px 0 rgba(255,255,255,.12)" }} />
            </div>
          ))}

        {view === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map((b) => {
              const m = STATUS_META[b.status];
              return (
                <div key={b.id} onClick={() => setSelected(b)} style={{ display: "flex", gap: 16, background: "#f7f0e2", border: "1px solid #e3d6bf", borderRadius: 12, padding: "14px 16px", cursor: "pointer", boxShadow: "0 3px 10px rgba(60,40,25,.08)" }}>
                  <div style={{ flex: "0 0 70px" }}>
                    <BookSpine book={b} width={70} height={100} grayscale={b.status === "souhait"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 17, color: "#2a2018", lineHeight: 1.2 }}>{b.titleFr}</div>
                        <div style={{ fontSize: 13, color: "#7a6a58", marginTop: 3 }}>{b.author} · <span style={{ color: "#a4917a" }}>{b.domain}</span></div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "#fff", background: m.color, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{m.short}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: ACCENT }}>{b.price ? eur(b.price) : "—"}</span>
                      <span style={{ fontSize: 14, color: "#c9a227" }}>{b.rating ? stars(b.rating) : ""}</span>
                      {b.publicDomain && <span style={{ fontSize: 11, fontWeight: 700, color: "#5a7052" }}>DOMAINE PUBLIC</span>}
                      <span style={{ marginLeft: "auto", fontSize: 13, color: "#a4917a" }}>Détails →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedLive && <BookModal book={selectedLive} onClose={() => setSelected(null)} />}
    </>
  );
}

function tab(active: boolean): React.CSSProperties {
  return { fontWeight: 600, fontSize: 13, padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "none", background: active ? ACCENT : "transparent", color: active ? "#fff" : "#c6b49b" };
}
function chip(active: boolean): React.CSSProperties {
  return { fontWeight: 600, fontSize: 13, padding: "9px 15px", borderRadius: 20, cursor: "pointer", border: "1px solid", borderColor: active ? ACCENT : "#ddceb6", background: active ? ACCENT : "#fff", color: active ? "#fff" : "#6b5844", whiteSpace: "nowrap" };
}
const select: React.CSSProperties = { fontWeight: 600, fontSize: 13, padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.08)", color: "#f3ead9", cursor: "pointer" };
