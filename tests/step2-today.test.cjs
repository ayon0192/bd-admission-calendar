const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = fs.readFileSync(path.join(__dirname, "../assets/js/main-shell.js"), "utf8");
const block = js.slice(js.indexOf("/* ==== TODAY-LOGIC-START"), js.indexOf("/* ==== TODAY-LOGIC-END ==== */"));
const L = vm.runInNewContext(block + ";({countdownInfo,pickTop3,evTimeKnown,evEndMs,dayDiff,appKey,stepsFor,statusView})", { Intl, Date });
const at = iso => Date.parse(iso);            // a fixed "now"
const ev = (id, date, time, extra = {}) => ({ id, university: "ঢাকা", cycleId: "C1", unitId: "", type: "application_deadline", date, time, verified: true, conflict: false, status: "officially_confirmed", ...extra });

test("countdown: far / soon / near use day counts with Dhaka dates", () => {
  const now = at("2026-11-26T10:00:00+06:00");
  assert.deepEqual([L.countdownInfo(ev("a", "2026-12-20", "17:00"), now).urgency, L.countdownInfo(ev("a", "2026-12-20", "17:00"), now).text], ["far", "আর ২৪ দিন"]);
  assert.equal(L.countdownInfo(ev("a", "2026-12-02", ""), now).urgency, "soon");   // 6 days
  assert.equal(L.countdownInfo(ev("a", "2026-11-29", ""), now).urgency, "near");   // 3 days
});
test("countdown: tomorrow with a known time shows hours and minutes", () => {
  const c = L.countdownInfo(ev("a", "2026-11-27", "06:30"), at("2026-11-26T10:00:00+06:00"));
  assert.equal(c.urgency, "now"); assert.equal(c.text, "আর ২০ ঘণ্টা ৩০ মিনিট");
});
test("countdown: today with a known time says when it ends and how long is left", () => {
  const c = L.countdownInfo(ev("a", "2026-11-26", "17:00"), at("2026-11-26T14:00:00+06:00"));
  assert.match(c.text, /^আজ .*-এ শেষ — আর ৩ ঘণ্টা$/); assert.equal(c.urgency, "now");
});
test("countdown: unknown time never claims an hour (no 00:00 or 23:59 invented)", () => {
  const now = at("2026-11-26T10:00:00+06:00");
  assert.equal(L.evTimeKnown(ev("a", "2026-11-26", "")), false);
  assert.equal(L.evTimeKnown(ev("a", "2026-11-26", "00:00")), false);
  assert.equal(L.countdownInfo(ev("a", "2026-11-26", ""), now).text, "আজকের মধ্যে — সময় প্রকাশিত নয়");
  assert.equal(L.countdownInfo(ev("a", "2026-11-27", "00:00"), now).text, "আগামীকাল — সময় প্রকাশিত নয়");
  assert.ok(!/২৩:৫৯|০০:০০|আজ শেষ/.test(L.countdownInfo(ev("a", "2026-11-26", ""), now).text));
});
test("countdown: past events say finished", () => {
  assert.equal(L.countdownInfo(ev("a", "2026-11-25", "17:00"), at("2026-11-26T10:00:00+06:00")).text, "শেষ হয়েছে");
  assert.equal(L.countdownInfo(ev("a", "2026-11-26", "09:00"), at("2026-11-26T10:00:00+06:00")).urgency, "past");
});
test("countdown: uses Asia/Dhaka, not the phone's zone (UTC evening is already next day in Dhaka)", () => {
  const c = L.countdownInfo(ev("a", "2026-11-27", ""), at("2026-11-26T20:00:00Z")); // 02:00 on 27th in Dhaka
  assert.equal(c.urgency, "now"); assert.match(c.text, /আজকের মধ্যে/);
});
const base = { now: at("2026-11-26T10:00:00+06:00"), hasTarget: false, targetScore: () => 2, isDone: () => false };
test("top3: only confirmed or announced deadlines, no conflicts, none past, sorted by end", () => {
  const events = [
    ev("late", "2026-12-30", "17:00"), ev("soon", "2026-11-28", "17:00"), ev("mid", "2026-12-10", ""),
    ev("tent", "2026-11-27", "10:00", { status: "tentative", verified: false }), ev("conf", "2026-11-27", "10:00", { conflict: true }),
    ev("past", "2026-11-20", "10:00"), ev("exam", "2026-11-27", "10:00", { type: "admission_test" }),
    ev("ann", "2026-12-05", "10:00", { status: "authority_announced" }) ];
  assert.deepEqual(L.pickTop3(events, base).map(e => e.id), ["soon", "ann", "mid"]);
});
test("top3: target matches come first, then others fill up to three", () => {
  const events = [ev("x1", "2026-11-28", "10:00"), ev("t1", "2026-12-20", "10:00"), ev("x2", "2026-12-01", "10:00"), ev("t2", "2026-12-25", "10:00")];
  const out = L.pickTop3(events, { ...base, hasTarget: true, targetScore: e => e.id.startsWith("t") ? 0 : 2 });
  assert.deepEqual(out.map(e => e.id), ["t1", "t2", "x1"]);
});
test("top3: a fully completed application leaves the list; fewer than three is fine; none is empty", () => {
  const events = [ev("a", "2026-11-28", "10:00"), ev("b", "2026-12-01", "10:00")];
  assert.deepEqual(L.pickTop3(events, { ...base, isDone: e => e.id === "a" }).map(e => e.id), ["b"]);
  assert.deepEqual(L.pickTop3([], base), []);
});
test("status badges map to the four wordings", () => {
  assert.equal(L.statusView({ status: "officially_confirmed" }).label, "অফিসিয়াল সূত্রে নিশ্চিত");
  assert.equal(L.statusView({ status: "authority_announced" }).label, "কর্তৃপক্ষ ঘোষিত");
  assert.equal(L.statusView({ status: "tentative" }).label, "সম্ভাব্য — এখনো পাকা নয়");
  assert.equal(L.statusView({ status: "awaiting_official_notice" }).label, "অফিসিয়াল নোটিশের অপেক্ষায়");
});
test("checklist: admit-card step only when the cycle has an admit-card event", () => {
  const withAdmit = [ev("a", "2026-11-28", ""), ev("b", "2026-12-05", "10:00", { type: "admit_card_deadline" })];
  const keys = (e, list) => Array.from(L.stepsFor(e, list), s => s[0]);
  assert.deepEqual(keys(withAdmit[0], withAdmit), ["form", "fee", "admit"]);
  assert.deepEqual(keys(withAdmit[0], [withAdmit[0]]), ["form", "fee"]);
  assert.equal(L.appKey(ev("a", "2026-11-28", "")), "C1:all");
});
test("page source: card markup follows the spec (status/urgency attributes, real checkboxes, no live countdown)", () => {
  assert.match(js, /data-status="'\+sv\.key/); assert.match(js, /data-urgency="'\+c\.urgency/);
  assert.match(js, /type="checkbox" id="'\+id/); assert.match(js, /<label for="'\+id/);
  assert.match(js, /setInterval\(tickCountdowns,60000\)/); assert.match(js, /document\.hidden\)return/);
  assert.match(js, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(js.slice(js.indexOf("function deadlineCard"), js.indexOf("function goalHtml")), /aria-live/);
});
test("page source: forbidden words are absent from the Today copy", () => {
  const today = js.slice(js.indexOf("/* ==== TODAY-PAGE"), js.indexOf("function bindToday"));
  for (const bad of ["সর্বনাশ", "দেরি হয়ে গেল", "শেষ সুযোগ", "আসসালামু", "নমস্কার"]) assert.ok(!today.includes(bad), bad);
});
