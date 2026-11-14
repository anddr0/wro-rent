import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAmount } from "./amounts";

describe("parseAmount", () => {
  it("reads whole and fractional amounts", () => {
    assert.equal(parseAmount("70"), 70);
    assert.equal(parseAmount("70.5"), 70.5);
    assert.equal(parseAmount(" 0 "), 0);
  });

  it("reads a comma as the decimal sign", () => {
    assert.equal(parseAmount("70,50"), 70.5);
  });

  it("returns null for anything else", () => {
    assert.equal(parseAmount(""), null);
    assert.equal(parseAmount("-5"), null);
    assert.equal(parseAmount("abc"), null);
    assert.equal(parseAmount("1.234"), null);
    assert.equal(parseAmount("1e3"), null);
  });
});
