const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { extractSelectorRootId } = require("../scripts/check-release.cjs");

test("shell root IDs referenced in main-shell.js exist in index.html", () => {
  const root = path.join(__dirname, "..");
  const app = fs.readFileSync(path.join(root, "assets/js/main-shell.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const id of ["mainContent", "topTitle", "stateBanner", "sourceModal", "closeSource", "sourceTitle", "sourceMessage"]) {
    assert.ok(app.includes('$("' + id + '")'), id + " referenced in app");
    assert.ok(html.includes('id="' + id + '"'), id + " exists in index.html");
  }
  assert.equal(extractSelectorRootId("#page-calendar .cal-event-row"), "page-calendar");
});

test("selector-root extraction rejects selectors without a leading HTML ID", () => {
  assert.equal(extractSelectorRootId(".calendar-day.is-selected .calendar-day-number"), null);
  assert.equal(extractSelectorRootId("[data-jump-date]"), null);
  assert.equal(extractSelectorRootId("#calendarSearch"), "calendarSearch");
});
