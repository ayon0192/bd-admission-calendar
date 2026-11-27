const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = fs.readFileSync(path.join(__dirname, "../assets/js/main-shell.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../assets/css/main-shell.css"), "utf8");
const block = js.slice(js.indexOf("/* ==== NOTICE-LOGIC-START"), js.indexOf("/* ==== NOTICE-LOGIC-END ==== */"));
const N = vm.runInNewContext(block + ";({classifySourceKind,buildNoticeFeed,availableNoticeKinds,filterNoticeFeed,noticeSummaryStats})", {});
const J = x => JSON.parse(JSON.stringify(x));

test("notice classification separates pdf, portal, university notice and third-party news", () => {
 assert.equal(N.classifySourceKind("https://x.bd/a.pdf", "official_university_notice"), "pdf");
 assert.equal(N.classifySourceKind("https://admission.du.ac.bd/", "official_admission_portal"), "portal");
 assert.equal(N.classifySourceKind("https://bau.edu.bd/notice/1", "official_notice_board"), "university");
 assert.equal(N.classifySourceKind("https://prothomalo.com/a", "third_party_discovery_only"), "news");
});

test("notice feed sorts newest first, exposes only present kinds, and marks official vs news", () => {
 const sources = [
  { url: "https://x.bd/a.pdf", sourceType: "official_university_notice", label: "PDF" },
  { url: "https://news.example/1", sourceType: "third_party_discovery_only", label: "News" }
 ];
 const circulars = [{ id: "c1", universityId: "BUTEX", university: "বুটেক্স", title: "সার্কুলার", url: "https://x.bd/a.pdf", publishedAt: "2026-11-19T00:00:00+06:00" }];
 const notices = [
  { id: "n1", universityId: "CoU", university: "কুবি", title: "সংঘাত", summary: "সংবাদ", url: "https://news.example/1", publishedAt: "2026-11-16T00:00:00+06:00" },
  { id: "n2", universityId: "DU", university: "ঢাবি", title: "পুরোনো তারিখবিহীন", summary: "", url: "https://admission.du.ac.bd", publishedAt: "" }
 ];
 const feed = J(N.buildNoticeFeed(circulars, notices, sources));
 assert.deepEqual(feed.map(x => x.id), ["c1", "n1", "n2"]);
 assert.equal(feed[0].official, true);
 assert.equal(feed[1].official, false);
 const kinds = J(N.availableNoticeKinds(feed)).map(k => k.value);
 assert.deepEqual(kinds, ["all", "pdf", "university", "news"]);
 assert.equal(N.filterNoticeFeed(feed, "বুটেক্স", "all").length, 1);
 assert.equal(N.filterNoticeFeed(feed, "", "news").length, 1);
});

test("notice page markup distinguishes secondary sources, keeps register folded, and obeys token CSS", () => {
 assert.match(js, /সংবাদসূত্র — অফিসিয়াল নয়/);
 assert.match(js, /data-official="/);
 assert.match(js, /<details class="fold"><summary>সরকারি উৎস রেজিস্টার/);
 assert.match(js, /id="noticeSearch"/);
 assert.match(js, /aria-live="polite">'\+list\.length/);
 assert.doesNotMatch(css.slice(css.indexOf("/* ---- নোটিশ")), /#[0-9a-fA-F]{3,8}\b|gradient|backdrop-filter/);
});
