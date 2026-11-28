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
  assert.match(js, /PRIVATE_TEXT_SELECTOR\s*=\s*"input,\s*textarea,\s*select/);
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
  assert.ok(js.includes('const ASSISTANT_API_URL = "https://bdac.ayon0192.workers.dev/api/chat";'));
  assert.ok(js.includes('action === "explain" && selectedInfo) setOutput(explainLocally(selectedInfo))'));
  assert.ok(js.includes('else if (action === "ai") explainWithAI();'));
  assert.match(js, /buildChatGptPrompt/);
  assert.match(js, /ayon0192\/bd-admission-calendar/);
  assert.match(js, /Base branch: main/);
  assert.match(js, /Suggested working branch: owner-select/);
  assert.match(js, /data\/admission-records\.json/);
  assert.match(js, /Pull Request/);
  assert.match(js, /node --test/);
  assert.match(js, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(js, /fetch\([^)]*prompt/i);
});

test("browser explanations and prompts normalize whitespace and contain real line breaks", () => {
  const js = read("assets/js/owner-select.js");
  assert.ok(js.includes('.replace(/\\s+/g, " ")'));
  assert.ok(js.includes('return lines.join("\\n");'));
  assert.ok(js.includes('].join("\\n");'));
  assert.match(js, /Cloudflare/);
  assert.match(js, /response\.status === 429/);
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
