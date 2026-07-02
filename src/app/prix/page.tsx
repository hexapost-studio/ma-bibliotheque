"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/data/books";
import { useLibrary, usePriceAlerts, setPriceAlert, bookKey } from "@/lib/store";
import { eur, ACCENT } from "@/lib/meta";
import BookSpine from "@/components/BookSpine";
import BookModal from "@/components/BookModal";
import Sparkline from "@/components/Sparkline";

type Sort = "drop" | "price-asc" | "price-desc";

export default function PrixPage() {
  const books = useLibrary();
  const alerts = usePriceAlerts();
  const [sort, setSort] = useState<Sort>("drop");
  const [selected, setSelected] = useState<Book | null>(null);

  const tracked = useMemo(() => books.filter((b) => b.priceHistory.length > 1), [books]);

  const rows = useMemo(() => {
    const withStats = tracked.map((b) => {
      const start = b.priceHistory[0];
      const lowest = Math.min(...b.priceHistory);
      const drop = start - b.price;
      const dropPct = start ? (drop / start) * 100 : 0;
      return { b, start, lowest, drop, dropPct };
    });
    withStats.sort((a, z) => {
      if (sort === "drop") return z.dropPct - a.dropPct;
      if (sort === "price-asc") return a.b.price - z.b.price;
      return z.b.price - a.b.price;
    });
    return withStats;
  }, [tracked, sort]);

  const selectedLive = selected ? books.find((b) => b.id === selected.id) ?? selected : null;
  const totalDrop = rows.reduce((s, r) => s + Math.max(0, r.drop), 0);

  return (
    <main style={{ maxWidth: 1500, margin: "0 auto", padding: "26px 32px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 22, color: "#3b2b20", margin: "0 0 4px" }}>Suivi des prix</h2>
          <p style={{ fontSize: 14, color: "#8a7a68", margin: 0 }}>
            {rows.length} titres suivis · <b style={{ color: "#5a7052" }}>{eur(totalDrop)}</b> d&apos;économies potentielles cumulées
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {([["drop", "Meilleures baisses"], ["price-asc", "Prix ↑"], ["price-desc", "Prix ↓"]] as [Sort, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setSort(id)} style={btn(sort === id)}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#f7f0e2", border: "1px solid #e3d6bf", borderRadius: 14, overflow: "hidden" }}>
        {rows.map(({ b, lowest, drop, dropPct }, i) => {
          const k = bookKey(b);
          const alert = alerts[k];
          const hit = alert != null && b.price <= alert;
          return (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderTop: i ? "1px solid #eaddc6" : "none" }}>
              <div onClick={() => setSelected(b)} style={{ flex: "0 0 40px", cursor: "pointer" }}>
                <BookSpine book={b} width={40} height={58} />
              </div>
              <div onClick={() => setSelected(b)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#2a2018", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.titleFr}</div>
                <div style={{ fontSize: 12, color: "#8a7a68" }}>{b.author}</div>
              </div>
              <div style={{ flex: "0 0 160px" }}>
                <Sparkline data={b.priceHistory} width={150} height={36} />
              </div>
              <div style={{ flex: "0 0 90px", textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: ACCENT }}>{eur(b.price)}</div>
                <div style={{ fontSize: 11, color: "#a4917a" }}>bas {eur(lowest)}</div>
              </div>
              <div style={{ flex: "0 0 90px", textAlign: "right" }}>
                {drop > 0.01 ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#5a7052" }}>▼ {dropPct.toFixed(0)}%</span>
                ) : (
                  <span style={{ fontSize: 13, color: "#a4917a" }}>—</span>
                )}
              </div>
              <div style={{ flex: "0 0 140px", textAlign: "right" }}>
                <label style={{ fontSize: 11, color: "#a4917a", display: "block", marginBottom: 2 }}>Alerte prix</label>
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={alert ?? ""}
                    placeholder="—"
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value.replace(",", "."));
                      setPriceAlert(k, e.target.value && !Number.isNaN(v) ? v : null);
                    }}
                    style={{ width: 60, padding: "4px 6px", border: `1px solid ${hit ? "#5a7052" : "#d8ccb6"}`, borderRadius: 6, fontSize: 13, textAlign: "right", background: hit ? "#e8f0e4" : "#fff" }}
                  />
                  <span style={{ fontSize: 12, color: "#8a7a68" }}>€</span>
                </div>
                {hit && <div style={{ fontSize: 11, color: "#5a7052", fontWeight: 700, marginTop: 2 }}>✓ Atteint !</div>}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "#a4917a", marginTop: 14, fontStyle: "italic" }}>
        Historique de prix initialisé au catalogue. Un job planifié (voir README) peut rafraîchir les prix réels et déclencher tes alertes.
      </p>

      {selectedLive && <BookModal book={selectedLive} onClose={() => setSelected(null)} />}
    </main>
  );
}

function btn(active: boolean): React.CSSProperties {
  return { fontWeight: 600, fontSize: 13, padding: "8px 13px", borderRadius: 8, cursor: "pointer", border: "1px solid", borderColor: active ? ACCENT : "#c9b48f", background: active ? ACCENT : "#f7f0e2", color: active ? "#fff" : "#6b5844" };
}
