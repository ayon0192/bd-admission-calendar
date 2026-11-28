#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
function read(root, relative) { return fs.readFileSync(path.join(root, relative), "utf8"); }
function check(root = path.resolve(__dirname, "..")) {
  const html = read(root, "index.html");
  const css = read(root, "assets/css/main-shell.css");
  const app = read(root, "assets/js/main-shell.js");
  const assistant = read(root, "assets/js/ai-assistant.js");
  const dataset = JSON.parse(read(root, "data/admission-records.json"));
  const sw = read(root, "sw.js");
  const releaseClient = read(root, "assets/js/release-updates.js");
  const headers = read(root, "_headers");
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(/<html\b[^>]*\blang=["']bn["']/i.test(html), "Document language must be Bengali.");
  require(/name=["']viewport["']/i.test(html), "Responsive viewport metadata is missing.");
  require(/name=["']color-scheme["']/i.test(html), "Color-scheme metadata is missing.");
  require(/name=["']calendar-release["'] content=["']__CALENDAR_RELEASE_ID__["']/.test(html), "The release marker must appear exactly in the HTML shell.");
  const pageIds = ["page-dashboard", "page-calendar", "page-universities", "page-info", "page-notices", "page-profile"];
  pageIds.forEach(id => require(html.includes('id="' + id + '"'), "Missing page section: " + id));
  const navPages = ["dashboard", "calendar", "universities", "notices", "profile"];
  navPages.forEach(page => require(html.includes('data-page="' + page + '"'), "Missing navigation destination: " + page));
  require(html.includes('id="themeToggle"'), "Single icon theme toggle is missing.");
  require(html.includes('id="themeToggle"') && html.includes('id="themeToggleSide"'), "Theme buttons are missing.");
  require(!/themeSelect|themeProfile|paletteProfile|demo-ribbon|demo-tools|compareModal/i.test(html), "Prototype controls or ribbons remain in the production HTML.");
  require(!/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html), "Inline scripts are forbidden.");
  require(!/<style\b/i.test(html), "Inline style blocks are forbidden.");
  require(!/\sstyle\s*=/i.test(html), "Inline style attributes are forbidden.");
  require(!/\son[a-z]+\s*=/i.test(html), "Inline event handlers are forbidden.");
  const ids = Array.from(html.matchAll(/\bid=["']([^"']+)["']/g), m => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  require(!duplicates.length, "Duplicate HTML IDs: " + duplicates.join(", "));
  const stylesheet = Array.from(html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi), m => m[1].split(/[?#]/, 1)[0]);
  require(stylesheet.length === 2 && stylesheet.includes("assets/css/main-shell.css") && stylesheet.includes("assets/css/ai-assistant.css"), "Only the local main shell and AI assistant stylesheets may load.");
  const scripts = Array.from(html.matchAll(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>/gi), m => ({ attrs: m[1] + m[3], src: m[2].split(/[?#]/, 1)[0] }));
  // theme-init.js is the only script allowed to run before first paint.
  const appScripts = scripts.filter(x => x.src !== "assets/js/theme-init.js");
  require(appScripts.length === 2 && appScripts.some(x => x.src === "assets/js/main-shell.js") && appScripts.some(x => x.src === "assets/js/ai-assistant.js"), "Only the local app and AI assistant scripts may load.");
  require(scripts.every(x => ["assets/js/main-shell.js", "assets/js/theme-init.js", "assets/js/ai-assistant.js"].includes(x.src)), "Only local app, theme and assistant scripts may load.");
  appScripts.forEach(x => require(/\bdefer\b/i.test(x.attrs), "Application JavaScript must be deferred."));
  require(/const ADMISSION_EVENTS=\[\{/.test(app), "Official admission events were not integrated.");
  require(/const UNIVERSITIES=\[\{/.test(app), "Official university directory was not integrated.");
  require(dataset.universities.length === 22 && dataset.events.length >= 40, "The official admission dataset is incomplete.");
  require(app.includes("function dataStateEmpty(title)"), "A stable empty-state renderer is required.");
  require(app.includes("function applyTheme()") && app.includes("localStorage.setItem(V2_KEY"), "Theme and preferences must persist locally.");
  require(app.includes('navigator.serviceWorker.register("sw.js"'), "Offline app-shell registration is missing.");
  require(!/themeSelect|themeProfile|paletteProfile|demo-ribbon|demo-tools|DEMO_EVENTS|ev-buet-exam/i.test(app), "Prototype controls or fake records remain in the application script.");
  require(css.includes(".sidebar") && css.includes(".mobile-nav") && css.includes(".theme-toggle"), "Responsive sidebar, mobile navigation or theme icon styles are missing.");
  require(assistant.includes("textContent = text") && assistant.includes("JSON.stringify({ question, page })"), "AI responses must render as text and send only the question/page payload.");
  require(/script-src 'self'/.test(headers) && /style-src 'self'/.test(headers), "Strict self-only script/style CSP is required.");
  require(headers.includes("X-Content-Type-Options") && headers.includes("X-Frame-Options") && headers.includes("Referrer-Policy") && headers.includes("Content-Security-Policy"), "Required security response headers are incomplete.");
  require(sw.includes('addEventListener("push"') && sw.includes('addEventListener("notificationclick"'), "Push event handling must be preserved in the service worker.");
  require(sw.includes("assets/css/main-shell.css?v=20261127-final-1") && sw.includes("assets/js/main-shell.js?v=20261127-final-1"), "Service-worker cache must use the redesigned assets.");
  require(sw.includes("assets/css/ai-assistant.css?v=20261128-ai-1") && sw.includes("assets/js/ai-assistant.js?v=20261128-ai-1"), "Service worker must cache the assistant UI assets.");
  require(sw.includes("assets/css/release-updates.css?v=20261128-polling-1") && sw.includes("assets/js/release-updates.js?v=20261128-polling-1"), "Service worker must cache the release update assets.");
  require(!/connect-src[^\n]*wss:/i.test(headers), "CSP must not allow an unused WebSocket backend.");
  require(sw.includes("admission-records.json") && sw.includes("DATA_CACHE"), "Service worker must cache admission dataset network-first.");
  if (errors.length) throw new Error("Release policy failed:\n- " + errors.join("\n- "));
  return { uniqueHtmlIds: ids.length, localScripts: scripts.length, pages: pageIds.length, securityHeaders: 4, dataRecords: dataset.events.length, universities: dataset.universities.length };
}
if (require.main === module) {
  try { process.stdout.write("Redesigned release checks passed: " + JSON.stringify(check()) + "\n"); }
  catch (e) { process.stderr.write(e.message + "\n"); process.exitCode = 1; }
}
function extractSelectorRootId(selector) {
  const m = /^#([A-Za-z0-9_-]+)/.exec(String(selector || "").trim());
  return m ? m[1] : null;
}
module.exports = { runReleaseChecks: check, extractSelectorRootId };
