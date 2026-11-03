import { test } from "node:test";
import assert from "node:assert/strict";
import { trackOncePerEvent } from "../meta-contact-events.js";

test("global and React click handlers track one shared native click once", () => {
  const nativeEvent = {};
  let count = 0;

  assert.equal(trackOncePerEvent(nativeEvent, () => count += 1), true);
  assert.equal(trackOncePerEvent({ nativeEvent }, () => count += 1), false);
  assert.equal(count, 1);
});

test("separate WhatsApp clicks each remain trackable", () => {
  let count = 0;
  assert.equal(trackOncePerEvent({}, () => count += 1), true);
  assert.equal(trackOncePerEvent({}, () => count += 1), true);
  assert.equal(count, 2);
});
