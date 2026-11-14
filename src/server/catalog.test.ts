import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cheapestPrice } from "./catalog";

describe("cheapestPrice", () => {
  it("returns the lowest plan price", () => {
    const plans = [{ price: 250 }, { price: 50 }, { price: 120 }];
    assert.equal(cheapestPrice(plans), 50);
  });

  it("returns null when there are no plans", () => {
    assert.equal(cheapestPrice([]), null);
  });
});
