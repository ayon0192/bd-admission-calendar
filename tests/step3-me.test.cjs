const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = fs.readFileSync(path.join(__dirname, "../assets/js/main-shell.js"), "utf8");
const block = js.slice(js.indexOf("/* ==== STORE-LOGIC-START"), js.indexOf("/* ==== STORE-LOGIC-END ==== */"));
const S = vm.runInNewContext(block + ";({defaultV2,migrateV1,validateStore,cleanTargets,matchesTargets,targetsEmpty,emptyTargets,cleanIds})", {});
const J = x => JSON.parse(JSON.stringify(x));            // plain objects, same realm
const ctx = { details: [{ id: "DU-A", universityId: "DU", unit: "A Unit" }, { id: "DU-B", universityId: "DU", unit: "B Unit" }] };
const ev = (o = {}) => ({ universityId: "DU", institutionGroup: "general_public_university", unitId: "", type: "application_deadline", ...o });
const owners = { "DU-A": "DU", "DU-B": "DU" };

test("migration: old favourites and exam become targets; old key stays untouched; flag is set", () => {
  const v1 = { favouriteUniversity: "DU", favouriteUnit: "A Unit", targetExam: "Engineering", theme: "dark", calendarFilters: { universityIds: ["DU"], unitIds: [], eventTypeIds: ["admission_test"] }, reminderFilters: { universityIds: ["RU"] } };
  const snapshot = JSON.stringify(v1), o = J(S.migrateV1(v1, ctx));
  assert.equal(JSON.stringify(v1), snapshot);
  assert.deepEqual(o.targets, { groupIds: [], universityIds: ["DU"], unitIds: ["DU-A"], eventTypeIds: [] });
  assert.equal(o.theme, "dark"); assert.equal(o.migratedFrom, 1); assert.equal(o.version, 2);
  assert.deepEqual(o.calendar.filters.eventTypeIds, ["admission_test"]); assert.deepEqual(o.reminders.filters.universityIds, ["RU"]);
});
test("migration: exam alone maps to institution groups; theme defaults to light; garbage input is safe", () => {
  assert.deepEqual(J(S.migrateV1({ targetExam: "General" }, ctx)).targets.groupIds, ["general_public_university", "admission_cluster"]);
  assert.equal(S.migrateV1({}, ctx).theme, "light");
  assert.doesNotThrow(() => S.migrateV1("junk", ctx)); assert.doesNotThrow(() => S.migrateV1(null, ctx));
});
test("cleanTargets drops ids that left the data and counts them", () => {
  const r = J(S.cleanTargets({ groupIds: ["g"], universityIds: ["DU", "GONE"], unitIds: ["x", "x"], eventTypeIds: [] }, { groups: new Set(["g"]), universities: new Set(["DU"]), units: new Set(["x"]), types: new Set() }));
  assert.deepEqual(r.targets.universityIds, ["DU"]); assert.deepEqual(r.targets.unitIds, ["x"]); assert.equal(r.removed, 1);
});
test("targets: no target means nothing is a 'target match'", () => {
  assert.equal(S.targetsEmpty(S.emptyTargets()), true);
  assert.equal(S.matchesTargets(ev(), S.emptyTargets(), owners), false);
});
test("targets: university, group, unit and event-type rules", () => {
  const t = (o) => ({ ...S.emptyTargets(), ...o });
  assert.equal(S.matchesTargets(ev(), t({ universityIds: ["DU"] }), owners), true);
  assert.equal(S.matchesTargets(ev({ universityId: "RU" }), t({ universityIds: ["DU"] }), owners), false);
  assert.equal(S.matchesTargets(ev(), t({ groupIds: ["general_public_university"] }), owners), true);
  assert.equal(S.matchesTargets(ev({ institutionGroup: "engineering_university" }), t({ groupIds: ["general_public_university"] }), owners), false);
  const unitT = t({ universityIds: ["DU"], unitIds: ["DU-A"] });
  assert.equal(S.matchesTargets(ev({ unitId: "DU-A" }), unitT, owners), true);
  assert.equal(S.matchesTargets(ev({ unitId: "DU-B" }), unitT, owners), false);
  assert.equal(S.matchesTargets(ev({ unitId: "" }), unitT, owners), true);        // applies to all units
  assert.equal(S.matchesTargets(ev({ type: "admission_test" }), t({ eventTypeIds: ["application_deadline"] }), owners), false);
});
test("import validation: accepts v2, upgrades v1, rejects everything else", () => {
  assert.equal(S.validateStore(null, ctx), null); assert.equal(S.validateStore([], ctx), null);
  assert.equal(S.validateStore({ version: 9 }, ctx), null); assert.equal(S.validateStore({ nonsense: 1 }, ctx), null);
  assert.equal(S.validateStore({ version: 1, favouriteUniversity: "DU" }, ctx).migratedFrom, 1);
  const o = J(S.validateStore({ version: 2, theme: "purple", calendar: { view: "evil" }, reminders: { offsetsMinutes: [180, 5, 10080] }, checklist: { k: { form: true, fee: "yes", extra: 1 }, bad: 5 }, targets: { universityIds: ["DU", 7, "x".repeat(200)] } }, ctx));
  assert.equal(o.theme, "light"); assert.equal(o.calendar.view, "list");
  assert.deepEqual(o.reminders.offsetsMinutes, [10080, 180]);               // only allowed offsets, fixed order
  assert.deepEqual(o.checklist, { k: { form: true } });
  assert.deepEqual(o.targets.universityIds, ["DU"]);
});
test("import validation: scripts and prototype pollution never reach the store", () => {
  const o = J(S.validateStore(JSON.parse('{"version":2,"__proto__":{"x":1},"checklist":{"__proto__":{"form":true},"<script>":{"form":true}}}'), ctx));
  assert.equal(({}).x, undefined); assert.equal(Object.keys(o.checklist).includes("__proto__"), false);
});
test("page source: storage, wizard, export/import/reset and privacy copy are wired", () => {
  assert.match(js, /localStorage\.setItem\(V2_KEY/); assert.match(js, /localStorage\.removeItem\("bdac\.preferences\.v1"\)/);
  assert.match(js, /bd-admission-preferences-/); assert.match(js, /file\.size>51200/);
  assert.match(js, /সব পছন্দ মুছো/); assert.match(js, /নিশ্চিত\?/); assert.match(js, /পরে করব/);
  assert.match(js, /তোমার পছন্দ শুধু এই ফোনের ব্রাউজারে থাকে। কোনো লগইন নেই।/);
  assert.match(js, /showStorageNote/); assert.match(js, /pagehide/);
  const theme = fs.readFileSync(path.join(__dirname, "../assets/js/theme-init.js"), "utf8");
  assert.match(theme, /bdac\.preferences\.v2/); assert.match(theme, /bdac\.preferences\.v1/);
});
