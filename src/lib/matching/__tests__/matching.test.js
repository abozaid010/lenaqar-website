/**
 * Requirement pricing + UnitRecommendationService tests.
 * Run: node --test src/lib/matching/__tests__/matching.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { hasMatchablePricing } from "../requirement-pricing.js";
import {
  UnitRecommendationService,
  getMatchingUnitId,
} from "../unit-recommendation-service.js";

test("hasMatchablePricing requires at least one positive price field", () => {
  assert.equal(hasMatchablePricing(null), false);
  assert.equal(hasMatchablePricing({}), false);
  assert.equal(hasMatchablePricing({ roomsCount: 3 }), false);
  assert.equal(hasMatchablePricing({ min_price: 0 }), false);
  assert.equal(hasMatchablePricing({ min_price: 1000000 }), true);
  assert.equal(hasMatchablePricing({ max_price: 2000000 }), true);
  assert.equal(hasMatchablePricing({ totalPrice: 1500000 }), true);
  assert.equal(hasMatchablePricing({ monthlyInstallment: 20000 }), true);
  assert.equal(hasMatchablePricing({ downPayment: 500000 }), true);
  assert.equal(hasMatchablePricing({ min_price: ["", 900000] }), true);
  assert.equal(hasMatchablePricing({ error: "fail" }), false);
});

test("UnitRecommendationService returns empty for empty input", () => {
  assert.deepEqual(UnitRecommendationService.select([]), []);
  assert.deepEqual(UnitRecommendationService.select(null), []);
});

test("UnitRecommendationService recommends 1 or 2 when fewer units exist", () => {
  const one = [{ id: "a", totalPrice: 100, purpose: "sell", area: 80 }];
  assert.equal(UnitRecommendationService.select(one).length, 1);

  const two = [
    { id: "a", totalPrice: 100, purpose: "sell", area: 80 },
    { id: "b", totalPrice: 200, purpose: "sell", area: 120 },
  ];
  assert.equal(UnitRecommendationService.select(two).length, 2);
});

test("UnitRecommendationService picks lowest price, lowest down payment, largest area", () => {
  const units = [
    {
      id: "cheap",
      totalPrice: 100,
      downPayment: 50,
      area: 70,
      purpose: "sell",
    },
    {
      id: "lowDown",
      totalPrice: 300,
      downPayment: 10,
      area: 90,
      purpose: "sell",
    },
    {
      id: "bigArea",
      totalPrice: 250,
      downPayment: 40,
      area: 200,
      purpose: "sell",
    },
    {
      id: "other",
      totalPrice: 400,
      downPayment: 60,
      area: 100,
      purpose: "sell",
    },
  ];

  const selected = UnitRecommendationService.select(units);
  assert.equal(selected.length, 3);
  assert.equal(getMatchingUnitId(selected[0]), "cheap");
  assert.equal(getMatchingUnitId(selected[1]), "lowDown");
  assert.equal(getMatchingUnitId(selected[2]), "bigArea");
});

test("UnitRecommendationService skips duplicates across priorities", () => {
  const units = [
    {
      id: "best",
      totalPrice: 100,
      downPayment: 5,
      area: 300,
      purpose: "sell",
    },
    {
      id: "secondDown",
      totalPrice: 200,
      downPayment: 20,
      area: 80,
      purpose: "sell",
    },
    {
      id: "secondArea",
      totalPrice: 220,
      downPayment: 40,
      area: 250,
      purpose: "sell",
    },
  ];

  const selected = UnitRecommendationService.select(units);
  const ids = selected.map(getMatchingUnitId);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 3);
  assert.equal(ids[0], "best");
  assert.equal(ids[1], "secondDown");
  assert.equal(ids[2], "secondArea");
});

test("UnitRecommendationService respects dismissed ids", () => {
  const units = [
    { id: "a", totalPrice: 100, downPayment: 10, area: 50, purpose: "sell" },
    { id: "b", totalPrice: 200, downPayment: 20, area: 80, purpose: "sell" },
    { id: "c", totalPrice: 300, downPayment: 30, area: 120, purpose: "sell" },
  ];
  const selected = UnitRecommendationService.select(units, {
    dismissedIds: new Set(["a"]),
  });
  assert.ok(!selected.some((u) => getMatchingUnitId(u) === "a"));
});
