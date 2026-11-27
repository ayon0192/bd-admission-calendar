const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/main-shell.js"), "utf8");
const core = require(path.join(root, "assets/js/admission-core.js"));
const dataset = JSON.parse(fs.readFileSync(path.join(root, "data/admission-records.json"), "utf8"));

test("Me page (#page-profile) exists in shell and uses four reminder time toggles plus .ics export", () => {
  assert.ok(html.includes('id="page-profile"'));
  assert.ok(html.includes('data-page="profile"'));
  for (const m of [10080, 4320, 1440, 180]) {
    assert.ok(app.includes("[" + m + ","), "missing offset " + m);
  }
  assert.match(app, /data-ics-bulk="1"/);
  assert.match(app, /ক্যালেন্ডারে যোগ করো \(\.ics\)/);
});

test("empty reminder filters match all eligible confirmed/announced non-range events in core", () => {
  const allEligible = core.getReminderEventsForFilters(dataset, {});
  assert.ok(allEligible.length > 0);
  for (const ev of allEligible) {
    assert.ok(["officially_confirmed", "authority_announced"].includes(ev.verification.status));
    assert.ok(!ev.dateRange);
  }
});

test("notifications remain off by default without requesting permission automatically", () => {
  assert.match(app, /push:\{enabled:false\}/);
  assert.match(app, /নোটিফিকেশন এখন বন্ধ আছে/);
  assert.doesNotMatch(app, /Notification\.requestPermission\(/);
});

test("preferences persist locally in v2 store with v1 migration, wizard, export/import, and reset", () => {
  assert.match(app, /bdac\.preferences\.v2/);
  assert.match(app, /migrateV1/);
  assert.match(app, /data-pf="wizard"/);
  assert.match(app, /data-pf="export"/);
  assert.match(app, /data-pf="import"/);
  assert.match(app, /data-pf="reset-yes"/);
  assert.match(app, /তোমার পছন্দ শুধু এই ফোনের ব্রাউজারে থাকে। কোনো লগইন নেই।/);
});
