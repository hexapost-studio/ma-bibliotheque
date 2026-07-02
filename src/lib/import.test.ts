import { describe, it, expect } from "vitest";
import { parseWishlist, extractIsbn } from "./import";

describe("extractIsbn", () => {
  it("reconnaît un ISBN-13 avec tirets", () => {
    expect(extractIsbn("978-0-441-01359-3")).toBe("9780441013593");
  });
  it("reconnaît un ISBN-13 collé", () => {
    expect(extractIsbn("ISBN 9780441013593")).toBe("9780441013593");
  });
  it("ignore une chaîne sans ISBN", () => {
    expect(extractIsbn("Dune de Frank Herbert")).toBe("");
  });
});

describe("parseWishlist", () => {
  it("parse le style Amazon 'Titre by Auteur' et supprime la date", () => {
    const r = parseWishlist("A Concise Encyclopedia of Esperanto by Geoffrey H. Sutton (2008-06-08)");
    expect(r).toHaveLength(1);
    expect(r[0].titleFr).toBe("A Concise Encyclopedia of Esperanto");
    expect(r[0].author).toBe("Geoffrey H. Sutton");
  });

  it("parse le séparateur tiret", () => {
    const r = parseWishlist("1984 — George Orwell");
    expect(r[0]).toMatchObject({ titleFr: "1984", author: "George Orwell" });
  });

  it("traite une ligne ISBN seule sans titre", () => {
    const r = parseWishlist("9780441013593");
    expect(r[0]).toMatchObject({ titleFr: "", isbn: "9780441013593" });
  });

  it("garde un titre simple sans auteur", () => {
    const r = parseWishlist("Dune");
    expect(r[0]).toMatchObject({ titleFr: "Dune", author: "" });
  });

  it("nettoie puces et numérotation", () => {
    const r = parseWishlist("- Sapiens by Yuval Noah Harari\n2. Dune");
    expect(r.map((x) => x.titleFr)).toEqual(["Sapiens", "Dune"]);
  });

  it("déduplique par ISBN et par titre+auteur", () => {
    const r = parseWishlist("Dune\nDune\n9780441013593\n9780441013593");
    expect(r).toHaveLength(2);
  });

  it("parse un CSV type Goodreads avec en-tête", () => {
    const csv = 'Title,Author,ISBN\n"Sapiens","Yuval Noah Harari","9780062316097"\n"1984","George Orwell","9780451524935"';
    const r = parseWishlist(csv);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ titleFr: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097" });
  });

  it("ignore les lignes vides", () => {
    expect(parseWishlist("\n\n  \n")).toEqual([]);
  });
});
