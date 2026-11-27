const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = fs.readFileSync(path.join(__dirname, "../assets/js/main-shell.js"), "utf8");
const todayBlk = js.slice(js.indexOf("/* ==== TODAY-LOGIC-START"), js.indexOf("/* ==== TODAY-LOGIC-END ==== */"));
const icsBlk = js.slice(js.indexOf("/* ==== ICS-LOGIC-START"), js.indexOf("/* ==== ICS-LOGIC-END ==== */"));
const helpers = "function addDaysISO(k,a){const d=new Date(k+\"T00:00:00Z\");d.setUTCDate(d.getUTCDate()+a);return d.toISOString().slice(0,10);}";
const I = vm.runInNewContext(todayBlk + "\n" + helpers + "\n" + icsBlk + ";({buildIcsEvent,buildIcsCalendar,toIcsUtc})", { Intl, Date });

test("ics with known time uses UTC DTSTART and all selected VALARM offsets", () => {
 const ev = { id: "JU-APP-DEADLINE", university: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়", unit: "সকল ইউনিট", type: "application_deadline", title: "আবেদন শেষ", date: "2026-12-15", time: "23:59", verified: true, status: "officially_confirmed", sourceUrl: "https://juniv.edu.bd" };
 const ics = I.buildIcsCalendar([ev], [10080, 4320, 1440, 180], "2026-11-27T10:00:00Z");
 assert.ok(ics.includes("BEGIN:VCALENDAR\r\n"));
 assert.ok(ics.includes("DTSTART:20261215T175900Z"));
 assert.ok(ics.includes("TRIGGER:-P7D"));
 assert.ok(ics.includes("TRIGGER:-P3D"));
 assert.ok(ics.includes("TRIGGER:-P1D"));
 assert.ok(ics.includes("TRIGGER:-PT180M"));
 assert.ok(ics.includes("অফিসিয়াল সূত্রে নিশ্চিত"));
 assert.ok(ics.includes("https://juniv.edu.bd"));
 assert.ok(!ics.includes("(সম্ভাব্য)"));
});


test("DU extended application deadline exports the official 23:59 time", () => {
 const ev = { id: "DU-APP-DEADLINE", university: "ঢাকা বিশ্ববিদ্যালয়", unit: "সকল ইউনিট", type: "application_deadline", title: "আবেদন শেষ", date: "2026-11-28", time: "23:59", verified: true, status: "officially_confirmed", sourceUrl: "https://admission.eis.du.ac.bd" };
 const ics = I.buildIcsCalendar([ev], [10080, 4320, 1440, 180], "2026-11-27T10:00:00Z");
 assert.ok(ics.includes("DTSTART:20261128T175900Z"));
 assert.ok(ics.includes("TRIGGER:-PT180M"));
 assert.ok(!ics.includes("DTSTART;VALUE=DATE:20261128"));
});

test("ics with unknown time uses VALUE=DATE, 8am morning trigger, and unpublished-time note", () => {
 const ev = { id: "IUT-UNKNOWN-TIME", university: "Islamic University of Technology", unit: "সকল ইউনিট", type: "admission_test", title: "ভর্তি পরীক্ষা", date: "2026-11-28", time: "", verified: false, status: "tentative", sourceUrl: "https://admission.iutoic-dhaka.edu" };
 const ics = I.buildIcsCalendar([ev], [10080, 4320, 1440, 180], "2026-11-27T10:00:00Z");
 assert.ok(ics.includes("DTSTART;VALUE=DATE:20261128"));
 assert.ok(ics.includes("DTEND;VALUE=DATE:20261129"));
 assert.ok(ics.includes("TRIGGER:-P7D"));
 assert.ok(ics.includes("TRIGGER:-P3D"));
 assert.ok(ics.includes("TRIGGER:-P1D"));
 assert.ok(ics.includes("TRIGGER:PT8H"));
 const unfolded = ics.replace(/\r\n /g, "").replace(/\\;/g, ";");
 assert.ok(unfolded.includes("সময় প্রকাশিত নয়; অফিসিয়াল সাইটে মিলিয়ে নাও।"));
});

test("ics for tentative date forces (সম্ভাব্য) in SUMMARY", () => {
 const ev = { id: "CUET-EXAM-TENTATIVE", university: "CUET", unit: "Level-1", type: "admission_test", title: "ভর্তি পরীক্ষা", date: "2027-01-23", time: "", verified: false, status: "tentative", sourceUrl: "https://cuet.ac.bd" };
 const ics = I.buildIcsCalendar([ev], [1440], "2026-11-27T10:00:00Z");
 const unfolded = ics.replace(/\r\n /g, "");
 assert.ok(unfolded.includes("(সম্ভাব্য)"));
});

test("UI wires .ics buttons on Today cards, Calendar rows, and Me reminders", () => {
 assert.match(js, /data-ics-id="/);
 assert.match(js, /data-ics-bulk="/);
 assert.match(js, /ক্যালেন্ডারে যোগ করো \(\.ics\)/);
});
