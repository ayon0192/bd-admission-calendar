"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"assets/js/main-shell.js"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/css/main-shell.css"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");

test("redesigned shell contains the six distinct requested pages",()=>{
 for(const id of ["dashboard","calendar","universities","info","notices","profile"])assert.ok(html.includes('id="page-'+id+'"'),id);
});

test("desktop sidebar and five mobile tabs navigate to the requested pages",()=>{
 assert.match(html,/<aside class="sidebar"/);
 const mobile=html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/);
 assert.ok(mobile);
 const destinations=Array.from(mobile[0].matchAll(/data-page="([^"]+)"/g),m=>m[1]);
 assert.deepEqual(destinations,["dashboard","calendar","universities","notices","profile"]);
 assert.match(html,/<nav class="nav-list" aria-label="প্রধান নেভিগেশন"[^>]*>/);
 assert.match(mobile[0],/aria-label="প্রধান নেভিগেশন"/);
 assert.doesNotMatch(html,/profileShortcut/);
});

test("theme has exactly one icon-only toggle, no theme select, and persists local preference",()=>{
 assert.match(html,/<button[^>]*id="themeToggle"[^>]*>[\s\S]*?<svg[\s\S]*?<\/button>/);
 assert.match(html,/<button[^>]*id="themeToggleSide"/);
 assert.doesNotMatch(html,/themeSelect|themeProfile|paletteProfile/);
 assert.match(app,/function applyTheme\(\)/);
 assert.match(app,/button\.innerHTML=\(dark\?[\s\S]*?circle cx="12" cy="12"/);
 assert.match(app,/querySelectorAll\("\.theme-toggle"\)/);
 assert.doesNotMatch(app,/prefers-color-scheme/);
 assert.match(app,/state\.theme=current==="dark"\?"light":"dark"/);
 assert.match(app,/localStorage\.setItem\(V2_KEY/);
 assert.match(css,/\.icon-btn\{width:var\(--tap\);height:var\(--tap\)/);
 assert.match(fs.readFileSync(path.join(__dirname,"..","assets","css","tokens.css"),"utf8"),/--tap: 48px/);
});

test("official admission dataset is integrated without demo records",()=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,"data/admission-records.json"),"utf8"));
 assert.equal(data.universities.length,22);
 assert.ok(data.events.length>=40);
 assert.match(app,/const ADMISSION_EVENTS=\[\{/);
 assert.match(app,/const UNIVERSITIES=\[\{/);
 assert.match(app,/const ADMISSION_DETAILS=\[\{/);
 assert.match(app,/const ADMISSION_CYCLES=\[\{/);
 assert.ok(app.includes("BUTEX"));
 assert.ok(app.includes("2027-02-20"));
 assert.doesNotMatch(app,/Sample University|DEMO_EVENTS|ev-buet-exam/);
});

test("calendar retains month, week, list, search and event filters while empty",()=>{
 assert.match(app,/state\.view==="month"/);
 assert.match(app,/state\.view==="week"/);
 assert.match(app,/class="event-list"/);
 assert.match(app,/id="calendarSearch"/);
 assert.match(app,/renderMultiFilter\("calendar","eventTypeIds"/);
});

test("prototype ribbons, simulated controls and demo-only sections are removed",()=>{
 assert.doesNotMatch(html,/demo-ribbon|demo-tools|compareModal|paletteProfile|themeSelect/i);
 assert.doesNotMatch(app,/DEMO_EVENTS|ev-buet-exam|createDemoReminder|demo-ribbon|demo-tools|themeSelect|compareModal/i);
});

test("no inline scripts or styles; CSP remains self-hosted",()=>{
 assert.doesNotMatch(html,/<script\b(?![^>]*\bsrc=)/i);
 assert.doesNotMatch(html,/<style\b|\sstyle\s*=/i);
 const headers=fs.readFileSync(path.join(root,"_headers"),"utf8");
 assert.match(headers,/script-src 'self'/);
 assert.match(headers,/style-src 'self'/);
});

test("offline shell uses redesigned assets without an unavailable realtime backend",()=>{
 assert.match(app,/navigator\.serviceWorker\.register\("sw\.js"/);
 assert.doesNotMatch(app,/WebSocket|connectRealtime|scheduleRealtimeReconnect|\/api\/updates\/socket/);
 assert.match(sw,/assets\/css\/main-shell\.css\?v=20261127-final-1/);
 assert.match(sw,/assets\/js\/main-shell\.js\?v=20261127-final-1/);
 assert.match(sw,/assets\/js\/release-updates\.js\?v=20261128-polling-1/);
 assert.match(sw,/addEventListener\("push"/);
 assert.match(sw,/addEventListener\("notificationclick"/);
 assert.match(sw,/admission-records\.json/);assert.match(sw,/DATA_CACHE/);
});

test("calendar has university, unit and event type as independent multi-select filters",()=>{
 assert.match(app,/renderMultiFilter\("calendar","universityIds","বিশ্ববিদ্যালয়"/);
 assert.match(app,/renderMultiFilter\("calendar","unitIds","ইউনিট \/ প্রোগ্রাম"/);
 assert.match(app,/renderMultiFilter\("calendar","eventTypeIds","ইভেন্টের ধরন"/);
 assert.match(app,/function matchesAdmissionFilters\(/);
 assert.match(app,/calendarFilters\.universityIds/);
 assert.match(app,/calendarFilters\.unitIds/);
 assert.match(app,/calendarFilters\.eventTypeIds/);
 assert.match(app,/data-multi-filter-action="all"/);
 assert.match(app,/data-multi-filter-reset="calendar"/);
});
test("reminder preferences are four time toggles saved locally; notifications stay off",()=>{
 assert.match(app,/o\.reminders\.offsetsMinutes=ALLOWED_OFFSETS/);
 assert.match(app,/localStorage\.setItem\(V2_KEY/);
 assert.match(app,/নোটিফিকেশন এখন বন্ধ আছে/);
 assert.doesNotMatch(app,/new Notification\(|Notification\.requestPermission\(/);
});
test("multi-select filter matching combines categories and preserves cycle-wide events",()=>{
 const start=app.indexOf("function matchesAdmissionFilters(");
 const end=app.indexOf("\nfunction renderMultiFilter(",start);
 assert.ok(start>=0&&end>start);
 const matcher=app.slice(start,end);
 assert.match(matcher,/groups\.length&&!groups\.includes/);
 assert.match(matcher,/universities\.length&&!universities\.includes/);
 assert.match(matcher,/cycles\.length&&!cycles\.includes/);
 assert.match(matcher,/units\.length/);
 assert.match(matcher,/types\.length&&!types\.includes/);
 assert.match(matcher,/event\.appliesToAllUnits===true/);
});
