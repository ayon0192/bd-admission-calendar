"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets/js/main-shell.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/main-shell.css"), "utf8");

test("calendar assets and service-worker cache use the same fresh version", () => {
  const assets = Array.from(html.matchAll(/(?:href|src)="(assets\/(?:css\/main-shell\.css|js\/main-shell\.js))\?v=([^"]+)"/g));
  const workerAssets = Array.from(worker.matchAll(/assets\/(?:css\/main-shell\.css|js\/main-shell\.js)\?v=([^"]+)/g));
  assert.equal(assets.length, 2);
  assert.equal(new Set(assets.map(m => m[2])).size, 1);
  assert.deepEqual(workerAssets.map(m => m[1]), assets.map(m => m[2]));
  assert.match(worker, /const CACHE_NAME = "admission-calendar-v\d+"/);
});

test("offline worker caches shell stale-while-revalidate, dataset network-first, and clears older caches", () => {
  assert.ok(app.includes('navigator.serviceWorker.register("sw.js"'));
  assert.match(worker, /DATA_CACHE/);
  assert.match(worker, /data\/admission-records\.json/);
  assert.match(worker, /X-Calendar-Cache/);
  assert.match(worker, /cache\.addAll\(APP_SHELL\)/);
  assert.match(worker, /caches\.delete\(name\)/);
});

test("calendar reset clears search, toggles and filters while keeping saved targets and checklist intact", () => {
  assert.match(app, /data-multi-filter-reset="calendar"/);
  const start = app.indexOf("function resetMultiFilters(scope){");
  const end = app.indexOf("/* ==== CALENDAR-PAGE", start);
  assert.ok(start >= 0 && end > start);
  const reset = app.slice(start, end);
  assert.match(reset, /calendarFilters=\{universityIds:\[\],unitIds:\[\],eventTypeIds:\[\]\}/);
  assert.match(reset, /state\.search=""/);
  assert.match(reset, /state\.showPast=false/);
  assert.match(reset, /state\.showTentative=false/);
  assert.doesNotMatch(reset, /localStorage\.clear|localStorage\.removeItem/);
});

test("status badges and calendar legend pair shapes/icons with explicit Bengali labels", () => {
  assert.match(app, /statusView\(e\)/);
  assert.match(app, /অফিসিয়াল সূত্রে নিশ্চিত/);
  assert.match(app, /কর্তৃপক্ষ ঘোষিত/);
  assert.match(app, /সম্ভাব্য — এখনো পাকা নয়/);
  assert.match(app, /function renderCalendarLegend\(\)/);
  assert.match(app, /cal-legend/);
});

test("notices distinguish official circulars/notices from third-party news discoveries", () => {
  assert.match(app, /third_party_discovery_only/);
  assert.match(app, /সংবাদসূত্র — অফিসিয়াল নয়/);
  assert.match(app, /data-official="/);
});

test("theme control is an icon-only toggle on topbar with >= 48px target and mode-aware glyph", () => {
  const button = html.match(/<button[^>]*id="themeToggle"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(button, "theme toggle button exists");
  assert.match(button[0], /<svg[\s\S]*aria-hidden="true"/);
  const visibleText = button[0].replace(/<button[^>]*>/, "").replace(/<svg[\s\S]*?<\/svg>/, "").replace(/<\/button>/, "").trim();
  assert.equal(visibleText, "", "topbar theme button must not contain visible text");
  assert.doesNotMatch(html, /<select[^>]*(?:id|name)=["']theme/i);
  assert.match(app, /applyTheme\(\)/);
  assert.match(css, /\.icon-btn\{width:var\(--tap\);height:var\(--tap\)/);
});

test("calendar search debounces input and view switcher persists view choice", () => {
  assert.match(app, /id="calendarSearch"/);
  assert.match(app, /setTimeout\(updateCalendarResults,150\)/);
  assert.match(app, /state\.view=view\.dataset\.view;persistPrefs\(\)/);
});
