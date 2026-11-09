/**
 * Unit video parser + public-allowlist tests.
 * node --test src/lib/lenaqar/__tests__/parse-unit-video.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import { parseUnitVideo } from "../parse-unit-video.js";
import { toPublicOpportunity } from "../to-public-opportunity.js";

const OPTS = { videoBaseUrl: "https://video.lenaai.net" };
const ID = "dQw4w9WgXcQ";
const YT = { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${ID}` };

test("youtube variants resolve to the nocookie embed", () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=10`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `  https://youtu.be/${ID}  `,
  ]) {
    assert.deepEqual(parseUnitVideo(url, OPTS), YT, url);
  }
});

test("youtube with invalid ids is rejected", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=short",
    `https://www.youtube.com/watch?v=${ID}x`,
    'https://www.youtube.com/watch?v="><script>',
    "https://www.youtube.com/watch",
    "https://www.youtube.com/shorts/",
    "https://youtu.be/",
    `https://www.youtube.com/channel/${ID}`,
  ]) {
    assert.equal(parseUnitVideo(url, OPTS), null, url);
  }
});

test("lookalike hosts and credentials are rejected", () => {
  for (const url of [
    `https://youtube.com.evil.com/watch?v=${ID}`,
    `https://evilyoutube.com/watch?v=${ID}`,
    `https://youtu.be.evil.com/${ID}`,
    "https://evilfacebook.com/watch/?v=1",
    "https://facebook.com.evil.com/video/1",
    `https://user:pw@www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com:8443/watch?v=${ID}`,
  ]) {
    assert.equal(parseUnitVideo(url, OPTS), null, url);
  }
});

test("facebook urls become the plugin embed with an encoded href", () => {
  const url = "https://www.facebook.com/lenaqar/videos/123456789/";
  assert.deepEqual(parseUnitVideo(url, OPTS), {
    provider: "facebook",
    src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
  });
  assert.equal(parseUnitVideo("https://fb.watch/abc123/", OPTS)?.provider, "facebook");
  assert.equal(parseUnitVideo("https://m.facebook.com/watch/?v=1", OPTS)?.provider, "facebook");
  assert.equal(parseUnitVideo("https://www.facebook.com/", OPTS), null);
});

test("files are accepted only from the configured video host", () => {
  const ok = "https://video.lenaai.net/videos/lenaqar/" + "a".repeat(64) + ".mp4";
  assert.deepEqual(parseUnitVideo(ok, OPTS), { provider: "file", src: ok });
  const webm = "https://video.lenaai.net/videos/x/y.webm";
  assert.equal(parseUnitVideo(webm, OPTS)?.provider, "file");
  assert.equal(parseUnitVideo("https://cdn.evil.com/videos/x.mp4", OPTS), null);
  assert.equal(parseUnitVideo("https://video.lenaai.net.evil.com/x.mp4", OPTS), null);
  assert.equal(parseUnitVideo("https://video.lenaai.net/videos/x.exe", OPTS), null);
  assert.equal(parseUnitVideo("https://video.lenaai.net/videos/x.mov", OPTS), null);
  assert.equal(parseUnitVideo(ok, {}), null);
  assert.equal(parseUnitVideo(ok, { videoBaseUrl: "http://video.lenaai.net" }), null);
});

test("non-https and dangerous schemes are rejected", () => {
  for (const url of [
    `http://www.youtube.com/watch?v=${ID}`,
    "http://video.lenaai.net/videos/x.mp4",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//www.youtube.com/watch?v=" + ID,
    "ftp://video.lenaai.net/x.mp4",
  ]) {
    assert.equal(parseUnitVideo(url, OPTS), null, url);
  }
});

test("empty, non-string and oversized input is rejected", () => {
  for (const v of [undefined, null, "", "   ", 42, {}, [], true]) {
    assert.equal(parseUnitVideo(v, OPTS), null);
  }
  assert.equal(
    parseUnitVideo(`https://www.youtube.com/watch?v=${ID}&x=${"a".repeat(2100)}`, OPTS),
    null
  );
});

test("toPublicOpportunity exposes only the parsed video, never the raw string", () => {
  const raw = `https://youtu.be/${ID}`;
  const unit = toPublicOpportunity({ code: "U1", video: raw });
  assert.deepEqual(unit.video, YT);
  assert.ok(!JSON.stringify(unit).includes(raw));

  const bad = toPublicOpportunity({ code: "U2", video: "javascript:alert(1)" });
  assert.equal(bad.video, null);
  assert.ok(!JSON.stringify(bad).includes("javascript"));

  assert.equal(toPublicOpportunity({ code: "U3" }).video, null);
});
