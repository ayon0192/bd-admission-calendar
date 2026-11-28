#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const EXPECTED = [
  "assets/fonts/OFL.txt",
  "assets/fonts/hind-siliguri-400.woff2",
  "assets/fonts/hind-siliguri-600.woff2",
  "assets/js/release-updates.js",
  "assets/css/release-updates.css",
  "assets/js/ai-assistant.js",
  "assets/css/ai-assistant.css",
  "assets/css/owner-select.css",
  "assets/js/owner-select.js",
  "data/admission-records.json",
  "assets/js/theme-init.js",
  "_headers", "assets/css/main-shell.css", "assets/favicon.svg", "assets/js/main-shell.js",
  "index.html", "release.json", "robots.txt", "sw.js"
].sort();
function walk(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? prefix + "/" + entry.name : entry.name;
    if (entry.isSymbolicLink()) throw new Error("Symlink is not allowed in publish output: " + relative);
    if (entry.isDirectory()) return walk(path.join(directory, entry.name), relative);
    if (!entry.isFile()) throw new Error("Unexpected publish entry: " + relative);
    return [relative];
  });
}
function smokeTest() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run scripts/build.cjs first.");
  const actual = walk(DIST).sort();
  const missing = EXPECTED.filter(file => !actual.includes(file));
  const unexpected = actual.filter(file => !EXPECTED.includes(file));
  if (missing.length || unexpected.length) throw new Error("Publish directory mismatch. Missing: [" + missing.join(", ") + "]; unexpected: [" + unexpected.join(", ") + "].");
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  const publishedDataPath = path.join(DIST, "data", "admission-records.json");
  if (!fs.existsSync(publishedDataPath) || !JSON.parse(fs.readFileSync(publishedDataPath, "utf8")).universities.length) throw new Error("Published admission dataset is missing or invalid.");
  const release = JSON.parse(fs.readFileSync(path.join(DIST, "release.json"), "utf8"));
  if (typeof release.id !== "string" || !release.id) throw new Error("Published release manifest has no release ID.");
  if (!html.includes('<meta name="calendar-release" content="' + release.id + '">') || html.includes("__CALENDAR_RELEASE_ID__")) throw new Error("Published HTML release ID is not exact.");
  const app = fs.readFileSync(path.join(DIST, "assets/js/main-shell.js"), "utf8");
  const ai = fs.readFileSync(path.join(DIST, "assets/js/ai-assistant.js"), "utf8");
  const data = JSON.parse(fs.readFileSync(publishedDataPath, "utf8"));
  const css = fs.readFileSync(path.join(DIST, "assets/css/main-shell.css"), "utf8");
  const sw = fs.readFileSync(path.join(DIST, "sw.js"), "utf8");
  if (!html.includes("assets/js/release-updates.js") || !html.includes("assets/css/release-updates.css")) throw new Error("Release update assets are not linked from the production page.");
  if (!html.includes("assets/js/ai-assistant.js") || !html.includes("assets/css/ai-assistant.css") || !ai.includes("ASSISTANT_API_URL")) throw new Error("AI assistant assets are not linked or built.");
  const ownerSelect = fs.readFileSync(path.join(DIST, "assets/js/owner-select.js"), "utf8");
  if (!html.includes("assets/js/owner-select.js") || !html.includes("assets/css/owner-select.css") || !ownerSelect.includes("function explainLocally") || !ownerSelect.includes("function buildChatGptPrompt")) throw new Error("Owner select assets are not linked or built.");
  const releaseClient = fs.readFileSync(path.join(DIST, "assets/js/release-updates.js"), "utf8");
  if (!releaseClient.includes("/release.json") || !releaseClient.includes('cache: "no-store"') || !releaseClient.includes("const CHECK_INTERVAL_MS = 300_000") || !releaseClient.includes("window.setInterval(checkReleaseManifest, CHECK_INTERVAL_MS)") || !releaseClient.includes("window.location.reload()") || /WebSocket|connectRealtime|scheduleReconnect/.test(releaseClient)) throw new Error("Five-minute foreground-only release polling is missing or a backend socket remains enabled.");
  const requiredPages = ["page-dashboard", "page-calendar", "page-universities", "page-info", "page-notices", "page-profile"];
  if (requiredPages.some(id => !html.includes('id="' + id + '"'))) throw new Error("The redesigned six-page shell is incomplete.");
  if (!html.includes('id="themeToggle"') || !app.includes("function applyTheme()") || !app.includes("button.setAttribute(\"aria-pressed\"")) throw new Error("Single-button theme toggle is missing.");
  if (!/const ADMISSION_EVENTS=\[\{/.test(app) || !/const UNIVERSITIES=\[\{/.test(app) || data.universities.length !== 22 || data.events.length < 40) throw new Error("Official admission data is missing from the production build.");
  if (html.includes("themeSelect") || html.includes("themeProfile") || html.includes("paletteProfile") || html.includes("demo-ribbon")) throw new Error("Demo theme controls or ribbons must not ship.");
  if (/<script\b(?![^>]*\bsrc=)/i.test(html) || /<style\b/i.test(html) || /\sstyle\s*=/i.test(html)) throw new Error("Inline script/style markup is not allowed by the production CSP.");
  if (!app.includes('navigator.serviceWorker.register("sw.js"')) throw new Error("Offline app-shell registration is missing.");
  if (/WebSocket|connectRealtime|scheduleRealtimeReconnect|\/api\/updates\/socket/.test(app)) throw new Error("An unavailable realtime backend must not be referenced by the application shell.");
  if (!sw.includes('addEventListener("push"') || !sw.includes('addEventListener("notificationclick"')) throw new Error("Service worker push/notification-click handling is missing.");
  if (!sw.includes("admission-records.json") || !sw.includes("DATA_CACHE")) throw new Error("Service worker must support network-first caching for admission-records.json.");
  if (!sw.includes("assets/css/ai-assistant.css?v=20261128-ai-1") || !sw.includes("assets/js/ai-assistant.js?v=20261128-ai-1")) throw new Error("Service worker must precache the assistant assets.");
  if (!sw.includes("assets/css/owner-select.css?v=20261128-owner-1") || !sw.includes("assets/js/owner-select.js?v=20261128-owner-1")) throw new Error("Service worker must precache the owner-select assets.");
  if (!sw.includes("assets/css/release-updates.css?v=20261128-polling-1") || !sw.includes("assets/js/release-updates.js?v=20261128-polling-1")) throw new Error("Service worker must precache the release update assets.");
  if (!css.includes(".sidebar{display:none}") || !css.includes(".mobile-nav")) throw new Error("Responsive navigation styles are missing.");
  const ids = Array.from(html.matchAll(/\bid=["']([^"']+)["']/g), match => match[1]);
  if (new Set(ids).size !== ids.length) throw new Error("Publish HTML contains duplicate IDs.");
  return { publishedFiles: actual.length, htmlBytes: Buffer.byteLength(html), jsBytes: Buffer.byteLength(app), cssBytes: Buffer.byteLength(css), dataRecords: data.events.length, universities: data.universities.length };
}
if (require.main === module) {
  try { process.stdout.write("Redesigned publish smoke test passed: " + JSON.stringify(smokeTest()) + "\n"); }
  catch (error) { process.stderr.write("Publish smoke test failed: " + error.message + "\n"); process.exitCode = 1; }
}
module.exports = { smokeTest, EXPECTED };
