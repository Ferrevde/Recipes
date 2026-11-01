import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatServings,
  formatTimeParts,
  formatTotalTime,
} from "./recipeFormatters";

describe("formatTotalTime", () => {
  it("adds prep and cook minutes", () => {
    expect(formatTotalTime({ prepMinutes: 10, cookMinutes: 15 })).toBe(
      "25 min",
    );
  });

  it("reports prep only when there is no cook time", () => {
    expect(formatTotalTime({ prepMinutes: 15, cookMinutes: 0 })).toBe("15 min");
  });
});

describe("formatTimeParts", () => {
  it("labelt geen bereidingstijd", () => {
    expect(formatTimeParts(5, 0)).toEqual({
      prep: "5 min voorbereiding",
      cook: "niet koken",
    });
  });

  it("labelt beide onderdelen", () => {
    expect(formatTimeParts(10, 20)).toEqual({
      prep: "10 min voorbereiding",
      cook: "20 min bereiding",
    });
  });
});

describe("formatServings", () => {
  it("appends the serving label", () => {
    expect(formatServings(2)).toBe("2 porties");
  });
});

describe("formatDuration", () => {
  it("keeps short durations in minutes", () => {
    expect(formatDuration(5)).toBe("5 min");
  });

  it("converts longer durations to hours and minutes", () => {
    expect(formatDuration(75)).toBe("1 uur, 15 min");
  });

  it("reports whole hours without a trailing minute", () => {
    expect(formatDuration(60)).toBe("1 uur");
  });
});
