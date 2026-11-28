const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/main-shell.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/main-shell.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");

test("index.html preloads only 400 font, provides skeleton and noscript fallback, and marks hidden pages inert", () => {
 assert.match(html, /<link rel="preload" href="assets\/fonts\/hind-siliguri-400\.woff2"/);
 assert.doesNotMatch(html, /preload[^>]*600/);
 assert.match(html, /<noscript>/);
 assert.match(html, /class="skeleton sk-block"/);
 assert.match(html, /id="page-calendar"[^>]*inert/);
});

test("service worker caches the redesigned shell, AI and release assets, and network-first caches admission data", () => {
 assert.match(sw, /DATA_CACHE/);
 assert.match(sw, /admission-records\.json/);
 assert.match(sw, /event\.waitUntil\(networkPromise\)/);
 assert.match(sw, /X-Calendar-Cache/);
 assert.match(sw, /release-updates\.css\?v=20261128-polling-1/);
 assert.match(sw, /release-updates\.js\?v=20261128-polling-1/);
 assert.match(sw, /ai-assistant\.css\?v=20261128-ai-1/);
 assert.match(sw, /ai-assistant\.js\?v=20261128-ai-1/);
 assert.match(sw, /admission-calendar-v25/);
});

test("release-updates uses five-minute foreground polling without a Worker WebSocket", () => {
 const ruPath = path.join(root, "assets/js/release-updates.js");
 if (fs.existsSync(ruPath)) {
  const ru = fs.readFileSync(ruPath, "utf8");
  assert.match(ru, /CHECK_INTERVAL_MS = 300_000/);
  assert.match(ru, /document\.visibilityState !== "visible"/);
  assert.doesNotMatch(ru, /WebSocket|connectRealtime|scheduleReconnect|\/api\/updates\/socket/);
 }
 assert.doesNotMatch(js, /WebSocket|connectRealtime|scheduleRealtimeReconnect|\/api\/updates\/socket/);
});

test("long lists chunk at 20 with আরও দেখাও, content-visibility is enabled, and offline copy matches spec", () => {
 assert.match(js, /data-show-more="cal"/);
 assert.match(js, /data-show-more="uni"/);
 assert.match(js, /data-show-more="notice"/);
 assert.match(js, /আরও দেখাও/);
 assert.match(js, /তুমি অফলাইনে আছ। শেষবার সংরক্ষিত তথ্য দেখাচ্ছি/);
 assert.match(css, /content-visibility:auto/);
});
