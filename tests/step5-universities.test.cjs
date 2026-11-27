const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = fs.readFileSync(path.join(__dirname, "../assets/js/main-shell.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../assets/css/main-shell.css"), "utf8");
const todayBlk = js.slice(js.indexOf("/* ==== TODAY-LOGIC-START"), js.indexOf("/* ==== TODAY-LOGIC-END ==== */"));
const uniBlk = js.slice(js.indexOf("/* ==== UNI-LOGIC-START"), js.indexOf("/* ==== UNI-LOGIC-END ==== */"));
const dateHelpers = "function dateLabel(d){return d;}";
const U = vm.runInNewContext(todayBlk + "\n" + dateHelpers + "\n" + uniBlk + ";({UNI_TABS,mapInfoTopicToUniTab,uniGroupOptions,filterUniversities,nextEventForUni,missingFieldLabel,formatIsoDhaka})", { Intl, Date });

test("university group chips come strictly from data without inventing groups", () => {
 const unis = [
  { id: "DU", name: "ঢাকা", short: "DU", institutionGroup: "general_public_university", groupLabel: "সাধারণ" },
  { id: "BUET", name: "বুয়েট", short: "BUET", institutionGroup: "engineering_university", groupLabel: "প্রকৌশল" },
  { id: "AGRI", name: "কৃষি", short: "AGRI", institutionGroup: "admission_cluster", groupLabel: "গুচ্ছ" }
 ];
 const groups = U.uniGroupOptions(unis);
 assert.deepEqual(JSON.parse(JSON.stringify(groups.map(g => g.value))), ["all", "general_public_university", "engineering_university", "admission_cluster"]);
 assert.equal(U.filterUniversities(unis, "", "engineering_university").map(x => x.id).join(","), "BUET");
 assert.equal(U.filterUniversities(unis, "ঢাকা", "all").map(x => x.id).join(","), "DU");
});

test("missing field states distinguish unpublished, awaiting notice, and not applicable", () => {
 assert.equal(U.missingFieldLabel("officially_confirmed", "applicable"), "প্রকাশিত হয়নি");
 assert.equal(U.missingFieldLabel("awaiting_official_notice", "applicable"), "অফিসিয়াল নোটিশের অপেক্ষায়");
 assert.equal(U.missingFieldLabel("authority_announced", "na"), "প্রযোজ্য নয়");
});

test("formatIsoDhaka never invents 00:00 clock times", () => {
 assert.match(U.formatIsoDhaka("2026-11-28T00:00:00+06:00", null, "officially_confirmed"), /সময় প্রকাশিত নয়/);
 assert.match(U.formatIsoDhaka(null, "2027-01-07", "authority_announced"), /সময় প্রকাশিত নয়/);
});

test("old #info routes map cleanly to university tabs", () => {
 assert.equal(U.mapInfoTopicToUniTab("eligibility"), "eligibility");
 assert.equal(U.mapInfoTopicToUniTab("application"), "eligibility");
 assert.equal(U.mapInfoTopicToUniTab("exam"), "exam");
 assert.equal(U.mapInfoTopicToUniTab("syllabus"), "syllabus");
 assert.equal(U.mapInfoTopicToUniTab("seats"), "syllabus");
});

test("universities detail uses ARIA tabs, contextual buttons, star toggle and #info redirect", () => {
 assert.match(js, /role="tablist"/);
 assert.match(js, /role="tab"/);
 assert.match(js, /role="tabpanel"/);
 assert.match(js, /ArrowRight/);
 assert.match(js, /র বিস্তারিত দেখো/);
 assert.match(js, /লক্ষ্যে যোগ করো/);
 assert.match(js, /if\(root==="info"\)/);
 assert.match(js, /একটি ইউনিট বেছে নাও/);
 assert.doesNotMatch(css.slice(css.indexOf("/* ---- ভার্সিটি")), /#[0-9a-fA-F]{3,8}\b|gradient|backdrop-filter/);
});
