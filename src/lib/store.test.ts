import { describe, it, expect } from "vitest";
import { bookKey, exportData, importData, addBooksBatch } from "./store";
import { BOOKS } from "@/data/books";

describe("bookKey", () => {
  it("utilise l'ISBN pour un livre du catalogue", () => {
    const b = BOOKS[0];
    expect(bookKey(b)).toBe(b.isbn);
  });
});

describe("sauvegarde export / import", () => {
  it("refuse un contenu invalide", () => {
    expect(importData("ceci n'est pas du json")).toBe(false);
  });

  it("effectue un aller-retour export → import", () => {
    addBooksBatch([{ titleFr: "Livre de test unique", author: "Testeur" }]);
    const dump = exportData();
    expect(dump).toContain("Livre de test unique");
    expect(importData(dump)).toBe(true);
    // Le contenu reste présent après réimport (remplacement complet).
    expect(exportData()).toContain("Livre de test unique");
  });

  it("accepte aussi un objet d'état nu (sans enveloppe)", () => {
    const bare = JSON.stringify({ overrides: {}, custom: [], priceAlerts: {}, priceLog: {} });
    expect(importData(bare)).toBe(true);
  });
});
