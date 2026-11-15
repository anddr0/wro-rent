import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAllowedIds } from "./access";

describe("parseAllowedIds", () => {
  it("means 'everyone' when the variable is missing or empty", () => {
    assert.equal(parseAllowedIds(undefined), null);
    assert.equal(parseAllowedIds("  "), null);
  });

  it("reads ids separated by commas, with or without spaces", () => {
    const ids = parseAllowedIds("840550973, 123,456 ");
    assert.deepEqual(ids, new Set([840550973, 123, 456]));
  });

  it("refuses anything that isn't an id", () => {
    assert.throws(() => parseAllowedIds("840550973, andrii"));
    assert.throws(() => parseAllowedIds("12,,34"));
    assert.throws(() => parseAllowedIds("-5"));
  });
});
