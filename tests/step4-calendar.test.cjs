const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = fs.readFileSync(path.join(__dirname, "../assets/js/main-shell.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../assets/css/main-shell.css"), "utf8");
const todayBlk = js.slice(js.indexOf("/* ==== TODAY-LOGIC-START"), js.indexOf("/* ==== TODAY-LOGIC-END ==== */"));
const storeBlk = js.slice(js.indexOf("/* ==== STORE-LOGIC-START"), js.indexOf("/* ==== STORE-LOGIC-END ==== */"));
const calBlk = js.slice(js.indexOf("/* ==== CALENDAR-LOGIC-START"), js.indexOf("/* ==== CALENDAR-LOGIC-END ==== */"));
const C = vm.runInNewContext(todayBlk + "\n" + storeBlk + "\n" + calBlk + ";({CALENDAR_WEEK_START,weekDayHeaders,startOfWeekISO,eventMatchesDate,isTentativeEvent,monthGridCells,resultCountText,filterCalendarList,groupEventsByDate,buildActiveCalChips,eventTypeShape,emptyTargets,targetsEmpty,matchesTargets})", { Intl, Date });

test("week starts on Saturday and headers rotate from Saturday", () => {
 assert.equal(C.CALENDAR_WEEK_START, 6);
 assert.equal(C.weekDayHeaders()[0], "শনি");
 assert.equal(C.weekDayHeaders()[6], "শুক্র");
 assert.equal(C.startOfWeekISO("2026-11-27"), "2026-11-21");
 assert.equal(C.monthGridCells(2026, 11).cells[0].key, "2026-10-31");
});

test("calendar filter hides past and tentative by default and unlocks them with toggles", () => {
 const events = [
  { id: "past", universityId: "DU", university: "ঢাকা", date: "2026-11-20", type: "application_open", verified: true, status: "officially_confirmed", conflict: false },
  { id: "tent", universityId: "CUET", university: "চুয়েট", date: "2027-01-23", type: "admission_test", verified: false, status: "tentative", conflict: false },
  { id: "ok", universityId: "BUET", university: "বুয়েট", date: "2026-12-01", type: "application_open", verified: true, status: "authority_announced", conflict: false },
  { id: "rng", universityId: "JU", university: "জাবি", date: "2027-01-10", dateEnd: "2027-01-21", type: "admission_test", verified: true, status: "officially_confirmed", conflict: false }
 ];
 const base = { today: "2026-11-27", targets: C.emptyTargets(), targetsEmpty: C.targetsEmpty, matchesTargets: C.matchesTargets, onlyMyTargets: true, showPast: false, showTentative: false };
 assert.deepEqual(C.filterCalendarList(events, base).map(e => e.id), ["ok", "rng"]);
 assert.deepEqual(C.filterCalendarList(events, { ...base, showTentative: true }).map(e => e.id), ["tent", "ok", "rng"]);
 assert.deepEqual(C.filterCalendarList(events, { ...base, showPast: true }).map(e => e.id), ["past", "ok", "rng"]);
 assert.equal(C.eventMatchesDate(events[3], "2027-01-15"), true);
 assert.equal(C.eventMatchesDate(events[3], "2027-01-22"), false);
});

test("onlyMyTargets filters when targets exist and ignores when none set", () => {
 const events = [
  { id: "du", universityId: "DU", institutionGroup: "general_public_university", university: "ঢাকা", date: "2026-12-01", type: "admission_test", verified: true, status: "officially_confirmed", conflict: false },
  { id: "buet", universityId: "BUET", institutionGroup: "engineering_university", university: "বুয়েট", date: "2026-12-02", type: "admission_test", verified: true, status: "officially_confirmed", conflict: false }
 ];
 const targets = { ...C.emptyTargets(), universityIds: ["BUET"] };
 const out = C.filterCalendarList(events, { today: "2026-11-27", targets, targetsEmpty: C.targetsEmpty, matchesTargets: C.matchesTargets, onlyMyTargets: true, showPast: false, showTentative: false });
 assert.deepEqual(out.map(e => e.id), ["buet"]);
});

test("result count, removable chips and event shapes work in Bangla", () => {
 assert.equal(C.resultCountText(12), "১২টি ইভেন্ট দেখানো হচ্ছে");
 const chips = C.buildActiveCalChips({ onlyMyTargets: true, hasTargets: true, showTentative: true, showPast: false, query: "DU", filters: { universityIds: ["DU"], unitIds: [], eventTypeIds: ["admission_test"] }, uniLabels: { DU: "ঢাকা বিশ্ববিদ্যালয়" }, typeLabels: { admission_test: "ভর্তি পরীক্ষা" } });
 assert.equal(chips.length, 5);
 assert.match(chips[3].removeAria, /ঢাকা বিশ্ববিদ্যালয়/);
 assert.equal(C.eventTypeShape("application_deadline").sym, "◆");
 assert.equal(C.eventTypeShape("admission_test").sym, "■");
});

test("calendar markup and CSS satisfy accessibility, default list view and token rules", () => {
 assert.match(js, /view:"list"/);
 assert.match(js, /o\.calendar\.view=/);
 assert.match(js, /o\.calendar\.onlyMyTargets=/);
 assert.match(js, /aria-live="polite"/);
 assert.match(js, /id="calFilterOpenBtn"/);
 assert.match(js, /role="dialog" aria-modal="true" aria-labelledby="filterSheetTitle"/);
 assert.match(js, /সব ভার্সিটি দেখাও|সম্ভাব্য দেখাও/);
 assert.doesNotMatch(css.slice(css.indexOf("/* ---- ক্যালেন্ডার")), /#[0-9a-fA-F]{3,8}\b|gradient|backdrop-filter/);
});
