"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
function read(relative) { return fs.readFileSync(path.join(ROOT, relative), "utf8"); }

test("owner mode activates from the hidden logo and excludes its own toolbar from selection", () => {
  const js = read("assets/js/owner-select.js");
  const html = read("index.html");
  assert.match(html, /data-owner-select-trigger/);
  assert.match(js, /ACTIVATION_TAPS\s*=\s*7/);
  assert.match(js, /data-owner-select-ui/);
  assert.match(js, /isOwnerUiTarget/);
  assert.match(js, /document\.addEventListener\(["']click["'],\s*captureSelectionClick,\s*true\)/);
  assert.match(js, /preventDefault\(\)/);
  assert.match(js, /stopImmediatePropagation\(\)/);
  assert.match(js, /bdac-owner-select-active/);
});

test("selected elements expose safe DOM and computed-style metadata without reading private input or notes", () => {
  const js = read("assets/js/owner-select.js");
  for (const field of ["tag", "id", "classes", "selector", "text", "dimensions", "color", "background", "fontSize", "padding", "margin", "border", "borderRadius", "source"]) {
    assert.match(js, new RegExp(field));
  }
  assert.match(js, /querySelectorAll\([^)]*(?:input|textarea|select)/);
  assert.match(js, /contenteditable/);
  assert.match(js, /data-private/);
  assert.match(js, /\.note/);
  assert.doesNotMatch(js, /localStorage/);
  assert.match(js, /closest\(["']\[data-source\]["']\)/);
});

test("outer and inner traversal, browser-first explanation, optional AI and browser-generated prompt are present", () => {
  const js = read("assets/js/owner-select.js");
  assert.match(js, /বাইরের স্তরে যাও/);
  assert.match(js, /ভেতরের স্তরে যাও/);
  assert.match(js, /explainLocally/);
  assert.match(js, /এটা কী\?/);
  assert.match(js, /AI দিয়ে ব্যাখ্যা/);
  assert.match(js, /30000/);
  assert.match(js, /buildChatGptPrompt/);
  assert.match(js, /ayon0192\/bd-admission-calendar/);
  assert.match(js, /base branch: main/);
  assert.match(js, /data\/admission-records\.json/);
  assert.match(js, /পুল রিকোয়েস্ট/);
  assert.match(js, /node --test/);
  assert.match(js, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(js, /fetch\([^)]*prompt/i);
});

test("main page sections carry source markers and toolbar markup is isolated", () => {
  const html = read("index.html");
  for (const id of ["page-dashboard", "page-calendar", "page-universities", "page-info", "page-notices", "page-profile"]) {
    assert.match(html, new RegExp('id="' + id + '"[^>]*data-source='));
  }
  assert.match(html, /data-source="assets\/js\/main-shell\.js#renderDashboard/);
  assert.match(html, /data-source="assets\/js\/main-shell\.js#renderCalendar/);
  assert.match(html, /assets\/css\/owner-select\.css/);
  assert.match(html, /assets\/js\/owner-select\.js/);
  assert.match(read("assets/css/owner-select.css"), /bdac-owner-select-highlight/);
});

test("owner mode assets are included in build output and offline cache with a new cache version", () => {
  const builder = read("scripts/build-redesigned.cjs");
  const build = read("scripts/build.cjs");
  const sw = read("sw.js");
  assert.match(builder, /assets\/css\/owner-select\.css/);
  assert.match(builder, /assets\/js\/owner-select\.js/);
  assert.match(build, /admission-calendar-v26/);
  assert.match(sw, /admission-calendar-v26/);
  assert.match(sw, /owner-select\.css/);
  assert.match(sw, /owner-select\.js/);
});
