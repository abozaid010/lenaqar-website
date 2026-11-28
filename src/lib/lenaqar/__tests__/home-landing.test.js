/**
 * Homepage landing mode (ad journey vs dialog vs composer). Run with:
 * node --test src/lib/lenaqar/__tests__/home-landing.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { homeLandingMode, isCampaignLanding } from "../home-landing.js";

const AD =
  "?utm_source=meta&utm_medium=paid_social&utm_campaign=v7_buyers_eastcairo&utm_content=ad24_lawyer_chat";

test("an ad click to #buy-request plays the journey for a first-time visitor", () => {
  assert.equal(homeLandingMode({ hash: "#buy-request", search: AD, seen: false }), "journey");
  assert.equal(homeLandingMode({ hash: "#buy-request", search: "?fbclid=abc", seen: false }), "journey");
});

test("a visitor who has seen the onboarding gets the dialog at once", () => {
  assert.equal(homeLandingMode({ hash: "#buy-request", search: AD, seen: true }), "dialog");
});

test("an internal #buy-request link (no campaign tags) opens the dialog at once", () => {
  assert.equal(homeLandingMode({ hash: "#buy-request", search: "", seen: false }), "dialog");
  assert.equal(homeLandingMode({ hash: "#buy-request", search: "?city=cairo", seen: false }), "dialog");
});

test("other landings keep their behaviour", () => {
  assert.equal(homeLandingMode({ hash: "#request", search: AD, seen: false }), "compose");
  assert.equal(homeLandingMode({ hash: "", search: AD, seen: false }), "intro");
  assert.equal(homeLandingMode({ hash: "", search: "", seen: true }), "seen");
  assert.equal(homeLandingMode(), "intro");
});

test("campaign detection needs a non-empty tag", () => {
  assert.equal(isCampaignLanding(AD), true);
  assert.equal(isCampaignLanding("?gclid=x"), true);
  assert.equal(isCampaignLanding("?utm_source="), false);
  assert.equal(isCampaignLanding("?utmsource=meta"), false);
  assert.equal(isCampaignLanding(""), false);
  assert.equal(isCampaignLanding(undefined), false);
});
