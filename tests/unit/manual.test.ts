import { describe, expect, it } from "vitest";
import { manualArticles } from "../../apps/web/src/manual";

describe("file-backed manual", () => {
  it("has unique, connected articles with valid internal guide links", () => {
    const slugs = manualArticles.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const article of manualArticles) {
      expect(article.body.startsWith("# ")).toBe(true);
      expect(article.summary.length).toBeGreaterThan(10);
      for (const related of article.related) expect(slugs).toContain(related);
      const internalLinks = Array.from(
        article.body.matchAll(/\]\(\/guide\/([a-z-]+)(?:#[^)]+)?\)/g),
        (match) => match[1],
      );
      for (const linkedSlug of internalLinks)
        expect(slugs).toContain(linkedSlug);
    }
  });

  it("covers the core teacher terminology", () => {
    const glossary =
      manualArticles.find((article) => article.slug === "terminology")?.body ||
      "";
    const requiredTerms = [
      "Munkatér",
      "Kurzus",
      "Tanulócsoport",
      "Beiratkozás",
      "Fogalom",
      "Tananyagforrás",
      "Kapcsolat",
      "Revízió",
      "Gyakorlófeladat",
      "Éves terv",
      "Óraterv",
      "Bemutató mód",
      "Órafuttatás",
      "Kiosztás",
      "Beadás",
      "Tanulási bizonyíték",
      "Felmérési sablon",
      "Követelményhely",
      "Kézbesítés",
      "Tartalomcsomag",
    ];
    for (const term of requiredTerms) expect(glossary).toContain(term);
  });
});
