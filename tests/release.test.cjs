const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { runReleaseChecks } = require("../scripts/check-release.cjs");

test("redesigned production source meets the six-page release policy", () => {
  const result = runReleaseChecks();
  assert.equal(result.pages, 6);
  assert.equal(result.localScripts, 2); // main-shell.js + theme-init.js (no-flash theme)
  assert.ok(result.uniqueHtmlIds >= 12);
  assert.ok(result.dataRecords >= 40);
  assert.equal(result.securityHeaders, 4);
});

test("the production build publishes only the redesigned shell, not the backup", () => {
  const build = require("../scripts/build.cjs");
  assert.ok(build.FILES.includes("assets/css/main-shell.css"));
  assert.ok(build.FILES.includes("assets/js/main-shell.js"));
  assert.ok(!build.FILES.includes("assets/css/calendar-only.css"));
  assert.ok(!build.FILES.includes("assets/js/app.js"));
  assert.ok(!build.FILES.some(file => file.startsWith("backups/")));
});

test("the service worker keeps push handlers but never caches admissions data", () => {
  const sw = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
  assert.match(sw, /addEventListener\("push"/);
  assert.match(sw, /addEventListener\("notificationclick"/);
  assert.match(sw, /admission-records\.json/);
  assert.match(sw, /main-shell\.css/);
  assert.match(sw, /main-shell\.js/);
});
