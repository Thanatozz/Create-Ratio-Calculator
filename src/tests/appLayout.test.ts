import { describe, expect, it } from "vitest";
import { shouldShowBottomStats } from "../app/App";

describe("app layout", () => {
  it("hides the bottom stats bar on normal app pages", () => {
    expect(shouldShowBottomStats("settings")).toBe(false);
    expect(shouldShowBottomStats("debug")).toBe(false);
    expect(shouldShowBottomStats("factory")).toBe(false);
    expect(shouldShowBottomStats("visualize")).toBe(false);
  });
});
