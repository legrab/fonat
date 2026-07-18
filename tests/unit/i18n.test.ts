import { describe, expect, it } from "vitest";
import hu from "../../apps/web/src/i18n/hu.json";
import en from "../../apps/web/src/i18n/en.json";
import { translate } from "../../apps/web/src/i18n/core";

describe("interface translations", () => {
  it("keeps locale catalogs in key parity", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(hu).sort());
  });

  it("contains no empty translations", () => {
    for (const catalog of [hu, en])
      for (const value of Object.values(catalog))
        expect(value.trim().length).toBeGreaterThan(0);
  });

  it("interpolates named values", () => {
    expect(translate("en", "entity.results", { count: 3 })).toBe("3 results");
    expect(translate("hu", "today.deadline", { value: "2026-09-01" })).toBe(
      "Határidő: 2026-09-01",
    );
  });
});
