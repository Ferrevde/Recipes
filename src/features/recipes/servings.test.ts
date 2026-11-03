import { describe, expect, it } from "vitest";
import {
  factorForServings,
  scaleAmount,
  servingPresets,
  servingsLabel,
} from "./servings";

describe("factorForServings", () => {
  it("geeft de juiste factor", () => {
    expect(factorForServings(8, 4)).toBe(2);
    expect(factorForServings(2, 4)).toBe(0.5);
    expect(factorForServings(4, 4)).toBe(1);
  });

  it("valt terug op 1 bij ongeldige invoer", () => {
    expect(factorForServings(0, 4)).toBe(1);
    expect(factorForServings(4, 0)).toBe(1);
    expect(factorForServings(Number.NaN, 4)).toBe(1);
  });
});

describe("scaleAmount", () => {
  it("laat bedragen ongemoeid bij factor 1", () => {
    expect(scaleAmount("200", 1)).toBe("200");
    expect(scaleAmount("1,5", 1)).toBe("1,5");
  });

  it("schaalt hele getallen", () => {
    expect(scaleAmount("4", 2)).toBe("8");
    expect(scaleAmount("2", 0.5)).toBe("1");
    expect(scaleAmount("200", 1.5)).toBe("300");
  });

  it("schaalt decimale bedragen met komma", () => {
    expect(scaleAmount("1,5", 2)).toBe("3");
    expect(scaleAmount("0,5", 3)).toBe("1,5");
    expect(scaleAmount("1.5", 2)).toBe("3");
  });

  it("schaalt breuken en gemengde breuken", () => {
    expect(scaleAmount("1/2", 2)).toBe("1");
    expect(scaleAmount("1 1/2", 2)).toBe("3");
    expect(scaleAmount("½", 4)).toBe("2");
  });

  it("rondt af op een kookbare waarde", () => {
    expect(scaleAmount("3", 0.5)).toBe("1,5");
    expect(scaleAmount("1", 1 / 3)).toBe("0,25");
    expect(scaleAmount("250", 1 / 3)).toBe("85");
  });

  it("bewaart tekst na het getal", () => {
    expect(scaleAmount("1 blik", 2)).toBe("2 blik");
    expect(scaleAmount("200 g", 2)).toBe("400 g");
  });

  it("laat bedragen zonder getal ongemoeid", () => {
    expect(scaleAmount("snufje", 3)).toBe("snufje");
    expect(scaleAmount("", 3)).toBe("");
  });
});

describe("servingsLabel", () => {
  it("gebruikt enkelvoud voor één persoon", () => {
    expect(servingsLabel(1)).toBe("1 persoon");
    expect(servingsLabel(4)).toBe("4 personen");
  });
});

describe("servingPresets", () => {
  it("bevat de vaste keuzes", () => {
    expect([...servingPresets]).toEqual([2, 4, 6, 8]);
  });
});
