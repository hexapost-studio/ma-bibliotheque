"use client";

import { useState } from "react";
import Link from "next/link";
import { parseWishlist, type ImportItem } from "@/lib/import";
import { addBooksBatch, exportData, importData, type NewBook } from "@/lib/store";
import { DOMAINS } from "@/data/books";
import { lookupBook } from "@/lib/sources";
import { ACCENT } from "@/lib/meta";

type Row = ImportItem & { domain: string };

export default function ImporterPage() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<number | null>(null);
  const [defaultDomain, setDefaultDomain] = useState("Mes ajouts");

  async function analyze() {
    setAdded(null);
    const items = parseWishlist(text);
    setRows(items.map((it) => ({ ...it, domain: it.domain || defaultDomain })));
    // Enrichissement : compléter titre/auteur manquants via ISBN.
    setBusy(true);
    const enriched = await Promise.all(
      items.map(async (it) => {
        if (it.titleFr || !it.isbn) return it;
        const d = await lookupBook(it.isbn);
        return d ? { ...it, titleFr: d.titleFr || it.titleFr, author: d.author || it.author } : it;
      })
    );
    setRows(enriched.map((it) => ({ ...it, domain: it.domain || defaultDomain })));
    setBusy(false);
  }

  function importAll() {
    const payload: NewBook[] = rows
      .filter((r) => r.titleFr.trim())
      .map((r) => ({ titleFr: r.titleFr, author: r.author, isbn: r.isbn, domain: r.domain }));
    const n = addBooksBatch(payload);
    setAdded(n);
    setRows([]);
    setText("");
  }

  const [restored, setRestored] = useState<"ok" | "err" | null>(null);
  function doExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ma-bibliotheque-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result), false);
      setRestored(ok ? "ok" : "err");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const [mTitle, setMTitle] = useState("");
  const [mAuthor, setMAuthor] = useState("");
  const [mDomain, setMDomain] = useState("Mes ajouts");
  const [mPrice, setMPrice] = useState("");
  function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!mTitle.trim()) return;
    addBooksBatch([{ titleFr: mTitle, author: mAuthor, domain: mDomain, price: mPrice ? parseFloat(mPrice) : undefined }]);
    setMTitle("");
    setMAuthor("");
    setMPrice("");
    setAdded(1);
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "26px 32px 60px" }}>
      <h2 style={{ fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 24, color: "#3b2b20", margin: "0 0 4px" }}>Importer mes livres</h2>
      <p style={{ fontSize: 14, color: "#8a7a68", margin: "0 0 20px", maxWidth: 640 }}>
        Colle une liste depuis <b>n&apos;importe quelle source</b> — liste de souhaits Amazon, Google Livres, export Goodreads (CSV), ou une simple liste tapée à la main. Tes livres restent stockés localement sur cet appareil.
      </p>

      {added != null && (
        <div style={{ background: "#e8f0e4", border: "1px solid #b6cdaa", borderRadius: 10, padding: "12px 16px", marginBottom: 18, color: "#3f5b34", fontWeight: 600 }}>
          ✓ {added} livre{added > 1 ? "s" : ""} ajouté{added > 1 ? "s" : ""} à ta bibliothèque. <Link href="/" style={{ color: ACCENT }}>Voir la bibliothèque →</Link>
        </div>
      )}

      {/* Import en masse */}
      <section style={card}>
        <h3 style={h3}>Coller une liste</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Un livre par ligne, par ex. :\nSapiens by Yuval Noah Harari\n1984 — George Orwell\n9780441013593\nDune"}
          rows={7}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d8ccb6", fontSize: 14, fontFamily: "var(--font-sans), sans-serif", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "#6b5844" }}>Domaine par défaut&nbsp;:</label>
          <select value={defaultDomain} onChange={(e) => setDefaultDomain(e.target.value)} style={inputStyle}>
            <option>Mes ajouts</option>
            {DOMAINS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <button onClick={analyze} disabled={!text.trim() || busy} style={btn(!!text.trim() && !busy)}>
            {busy ? "Analyse…" : "Analyser"}
          </button>
        </div>

        {rows.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#6b5844", marginBottom: 8 }}>{rows.length} livre(s) détecté(s) :</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflow: "auto" }}>
              {rows.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", background: "#fff", border: "1px solid #eaddc6", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2a2018", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.titleFr || <span style={{ color: "#c17" }}>Titre introuvable (ISBN {r.isbn})</span>}</div>
                    <div style={{ fontSize: 12, color: "#8a7a68" }}>{r.author || "Auteur inconnu"}{r.isbn ? ` · ${r.isbn}` : ""}</div>
                  </div>
                  <select value={r.domain} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, domain: e.target.value } : x))} style={{ ...inputStyle, fontSize: 12 }}>
                    <option>Mes ajouts</option>
                    {DOMAINS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Retirer" style={{ border: "none", background: "#eee", borderRadius: 6, cursor: "pointer", padding: "4px 8px", color: "#a55" }}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={importAll} style={{ ...btn(true), marginTop: 14 }}>Ajouter {rows.filter((r) => r.titleFr.trim()).length} livre(s) à ma bibliothèque</button>
          </div>
        )}
      </section>

      {/* Ajout manuel */}
      <section style={card}>
        <h3 style={h3}>Ajouter un livre manuellement</h3>
        <form onSubmit={addManual} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="Titre *"><input value={mTitle} onChange={(e) => setMTitle(e.target.value)} style={inputStyle} required /></Field>
          <Field label="Auteur"><input value={mAuthor} onChange={(e) => setMAuthor(e.target.value)} style={inputStyle} /></Field>
          <Field label="Domaine">
            <select value={mDomain} onChange={(e) => setMDomain(e.target.value)} style={inputStyle}>
              <option>Mes ajouts</option>
              {DOMAINS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Prix (€)"><input type="number" step="0.5" value={mPrice} onChange={(e) => setMPrice(e.target.value)} style={{ ...inputStyle, width: 90 }} /></Field>
          <button type="submit" style={btn(true)}>Ajouter</button>
        </form>
      </section>

      {/* Sauvegarde */}
      <section style={card}>
        <h3 style={h3}>Sauvegarde de ma bibliothèque</h3>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: "0 0 12px" }}>
          Tes données vivent uniquement dans ce navigateur. Exporte-les régulièrement pour ne rien perdre et les transférer sur un autre appareil.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={doExport} style={btn(true)}>⬇ Exporter (JSON)</button>
          <label style={{ ...btn(true), background: "#5a7052", cursor: "pointer" }}>
            ⬆ Restaurer une sauvegarde
            <input type="file" accept="application/json,.json" onChange={doImport} style={{ display: "none" }} />
          </label>
          {restored && <span style={{ fontSize: 13, color: restored === "ok" ? "#5a7052" : "#a2503c", fontWeight: 600 }}>{restored === "ok" ? "✓ Sauvegarde restaurée." : "✗ Fichier invalide."}</span>}
        </div>
      </section>

      {/* Aide */}
      <section style={{ ...card, background: "#efe6d4" }}>
        <h3 style={h3}>Comment exporter ta liste ?</h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#5a4636", lineHeight: 1.8 }}>
          <li><b>Amazon</b> : ouvre ta liste de souhaits → &laquo; … &raquo; → <i>Imprimer la liste</i>, puis copie-colle les lignes « Titre by Auteur » ici.</li>
          <li><b>Goodreads</b> : <i>My Books</i> → <i>Import and export</i> → <i>Export Library</i> (CSV) → colle le contenu du fichier.</li>
          <li><b>Google Livres / autre</b> : copie les titres, un par ligne. Un ISBN seul suffit, le titre sera retrouvé automatiquement.</li>
        </ul>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#8a7a68" }}>
      {label}
      {children}
    </label>
  );
}

const card: React.CSSProperties = { background: "#f7f0e2", border: "1px solid #e3d6bf", borderRadius: 14, padding: 20, marginBottom: 18 };
const h3: React.CSSProperties = { fontFamily: "var(--font-serif), serif", fontWeight: 700, fontSize: 17, color: "#3b2b20", margin: "0 0 12px" };
const inputStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #d8ccb6", fontSize: 14, background: "#fff" };
function btn(enabled: boolean): React.CSSProperties {
  return { fontWeight: 700, fontSize: 14, padding: "10px 18px", borderRadius: 9, cursor: enabled ? "pointer" : "not-allowed", border: "none", background: enabled ? ACCENT : "#cbb89a", color: "#fff" };
}
