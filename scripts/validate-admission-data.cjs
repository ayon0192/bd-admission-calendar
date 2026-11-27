#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const Core = require("../assets/js/admission-core.js");
const file = path.resolve(__dirname, "../data/admission-records.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = Core.validateDataset(data);
if (errors.length) {
  process.stderr.write("Admission dataset validation failed:\n" + errors.map(x => "- " + x).join("\n") + "\n");
  process.exit(1);
}
const ids = list => new Set(list.map(x => x.id));
for (const collection of Core.COLLECTIONS) {
  if (ids(data[collection]).size !== data[collection].length) throw new Error(collection + " contains duplicate IDs.");
}
if (data.universities.length !== 22) throw new Error("Expected exactly 22 admission routes.");
if (data.admissionCycles.length !== 22) throw new Error("Expected one 2026-27 cycle per route.");
const event = id => data.events.find(x => x.id === id);
if (!event("DU-APP-DEADLINE") || event("DU-APP-DEADLINE").startsAt !== "2026-11-28T23:59:00+06:00") throw new Error("DU extended deadline must be 28 Nov at 23:59.");
if (event("RU-A-EXAM")?.dateOnly !== "2027-02-20" || event("RU-B-EXAM")?.dateOnly !== "2027-02-12" || event("RU-C-EXAM")?.dateOnly !== "2027-02-13") throw new Error("RU official unit exam dates are missing or incorrect.");
if (["RU-A-EXAM","RU-B-EXAM","RU-C-EXAM","KUET-EXAM"].some(id => event(id)?.startsAt || event(id)?.endsAt)) throw new Error("An unannounced RU/KUET exam time was added.");
if (event("JU-EXAM-WINDOW")?.verification?.status !== "tentative") throw new Error("JU's tentative exam window must remain visibly tentative.");
if (!event("BUTEX-EXAM") || event("BUTEX-EXAM").startsAt !== "2027-01-29T10:00:00+06:00") throw new Error("BUTEX official exam date/time is missing.");
if (event("COU-APP-OPEN")?.dateOnly !== "2026-12-10" || event("COU-APP-OPEN")?.verification?.status !== "officially_confirmed") throw new Error("Comilla University official application-start announcement is missing or mislabelled.");
if (event("COU-APP-DEADLINE")?.dateOnly !== "2026-12-31" || event("COU-A-EXAM")?.dateOnly !== "2027-02-05" || event("COU-B-EXAM")?.dateOnly !== "2027-02-06" || event("COU-C-EXAM")?.dateOnly !== "2027-02-07") throw new Error("CoU official application or unit exam dates are missing.");
if (event("BUET-EXAM")?.dateOnly !== "2027-02-01" || event("BUET-APP-OPEN")?.dateOnly !== "2026-12-01") throw new Error("BUET 2026–27 dates are missing.");
if (event("CU-APP-OPEN")?.dateOnly !== "2026-12-10" || event("CU-B-EXAM")?.dateOnly !== "2027-02-05" || event("CU-D1-EXAM")?.dateOnly !== "2027-02-08") throw new Error("CU revised dates are missing.");
if (event("KU-A-EXAM")?.dateOnly !== "2027-02-04" || event("KU-D-EXAM")?.dateOnly !== "2027-02-05") throw new Error("Khulna University revised dates are missing.");
if (event("SUST-EXAM-DAY-1")?.dateOnly !== "2027-01-17" || event("SUST-EXAM-DAY-2")?.dateOnly !== "2027-01-18") throw new Error("SUST revised exam dates are missing.");
if (event("RUET-EXAM")?.dateOnly !== "2027-01-28" || event("AGRI-EXAM")?.dateOnly !== "2027-01-02") throw new Error("RUET or Agricultural Cluster test dates are missing.");
if (event("MBBS-EXAM")?.dateOnly !== "2026-12-18" || event("BDS-EXAM")?.dateOnly !== "2026-12-18") throw new Error("Medical/dental test date announcement is missing.");
if (event("GST-B-EXAM")?.dateOnly !== "2027-03-19" || event("GST-A-EXAM")?.dateOnly !== "2027-03-27") throw new Error("GST unit-wise test dates are missing.");
if (event("CUET-EXAM-TENTATIVE")?.verification?.status !== "tentative") throw new Error("CUET probable date must remain tentative.");


const detail = id => data.admissionDetails.find(x => x.id === id);
const cycleByUniversity = id => data.admissionCycles.find(x => x.universityId === id);
const assertEvent = (id, status, dateOnly, startsAt) => {
  const x = event(id);
  if (!x) throw new Error("Missing required event: " + id);
  if (status && x.verification.status !== status) throw new Error(id + " has unexpected verification status.");
  if (dateOnly && x.dateOnly !== dateOnly) throw new Error(id + " has unexpected date.");
  if (startsAt !== undefined && (x.startsAt || "") !== startsAt) throw new Error(id + " has unexpected time.");
};
if (cycleByUniversity("AFMC")?.verification.status !== "officially_confirmed") throw new Error("AFMC circular must resolve the awaiting-official-notice status.");
if (cycleByUniversity("IUT")?.verification.status !== "awaiting_official_notice") throw new Error("IUT must remain awaiting an official 2026–27 notice.");
if (cycleByUniversity("AGRI")?.verification.status !== "officially_confirmed") throw new Error("Agricultural Cluster circular must be officially confirmed.");
if (cycleByUniversity("MBBS")?.verification.status !== "officially_confirmed" || cycleByUniversity("BDS")?.verification.status !== "officially_confirmed") throw new Error("MBBS/BDS official circular status is missing.");
if (detail("AGRI-ALL-2026-27")?.seats !== 3795) throw new Error("Agricultural Cluster official seat total must be 3,795.");
if (detail("AFMC-ALL-2026-27")?.application?.feeBDT !== 1000) throw new Error("AFMC fee must be 1,000 BDT.");
if (detail("MBBS-ALL-2026-27")?.application?.feePaymentDeadlineOn !== "2026-12-04") throw new Error("MBBS fee deadline must be 4 Dec 2026.");
if (detail("BDS-ALL-2026-27")?.application?.feePaymentDeadlineOn !== "2026-12-04") throw new Error("BDS fee deadline must be 4 Dec 2026.");
assertEvent("AFMC-APP-OPEN","officially_confirmed","2026-11-29","2026-11-29T12:00:00+06:00");
assertEvent("AFMC-APP-DEADLINE","officially_confirmed","2026-12-08","2026-12-08T23:59:00+06:00");
assertEvent("AFMC-ADMIT-OPEN","officially_confirmed","2027-01-12","2027-01-12T10:00:00+06:00");
assertEvent("AFMC-EXAM","officially_confirmed","2027-01-15","2027-01-15T10:00:00+06:00");
assertEvent("AGRI-ADMIT-OPEN","officially_confirmed","2026-12-21");
assertEvent("AGRI-SEAT-PLAN","officially_confirmed","2026-12-27");
assertEvent("AGRI-RESULT","officially_confirmed","2027-01-07");
assertEvent("RUET-APP-OPEN","authority_announced","2026-12-12");
assertEvent("RUET-APP-DEADLINE","authority_announced","2027-01-07");
assertEvent("MBBS-APP-OPEN","officially_confirmed","2026-11-25","2026-11-25T18:30:00+06:00");
assertEvent("MBBS-APP-DEADLINE","officially_confirmed","2026-12-03","2026-12-03T23:59:00+06:00");
assertEvent("MBBS-FEE-DEADLINE","officially_confirmed","2026-12-04","2026-12-04T23:59:00+06:00");
assertEvent("MBBS-ADMIT-OPEN","officially_confirmed","2026-12-14");
assertEvent("MBBS-ADMIT-DEADLINE","officially_confirmed","2026-12-17");
assertEvent("BDS-APP-OPEN","officially_confirmed","2026-11-25","2026-11-25T18:30:00+06:00");
assertEvent("BDS-APP-DEADLINE","officially_confirmed","2026-12-03","2026-12-03T23:59:00+06:00");
assertEvent("BDS-FEE-DEADLINE","officially_confirmed","2026-12-04","2026-12-04T23:59:00+06:00");
assertEvent("BDS-ADMIT-OPEN","officially_confirmed","2026-12-14");
assertEvent("BDS-ADMIT-DEADLINE","officially_confirmed","2026-12-17");
assertEvent("BUTEX-ADMIT-OPEN","officially_confirmed","2027-01-17","2027-01-17T10:00:00+06:00");
assertEvent("BUTEX-ADMIT-DEADLINE","officially_confirmed","2027-01-24","2027-01-24T11:59:00+06:00");
assertEvent("BUTEX-SHORTLIST","tentative","2027-01-15");
assertEvent("BUTEX-RESULT","tentative","2027-02-15");
assertEvent("JU-EXAM-WINDOW","tentative");
assertEvent("CUET-EXAM-TENTATIVE","tentative");
const shell = fs.readFileSync(path.resolve(__dirname,"../assets/js/main-shell.js"),"utf8");
function shellCollection(name) {
  const marker = "const " + name + "=";
  const start = shell.indexOf(marker);
  const end = shell.indexOf(";\\n",start);
  if (start < 0 || end < 0) throw new Error("Missing generated shell collection: " + name);
  return JSON.parse(shell.slice(start + marker.length,end));
}
function assertShellIds(name, records) {
  const actual = shellCollection(name).map(x=>x.id).sort();
  const expected = records.map(x=>x.id).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(name + " is out of sync with data/admission-records.json.");
}
assertShellIds("ADMISSION_EVENTS",data.events);
assertShellIds("UNIVERSITIES",data.universities);
assertShellIds("ADMISSION_CYCLES",data.admissionCycles);
assertShellIds("ADMISSION_DETAILS",data.admissionDetails);
assertShellIds("ADMISSION_CIRCULARS",data.circulars);
assertShellIds("ADMISSION_NOTICES",data.notices);
assertShellIds("ADMISSION_SOURCES",data.sources);

process.stdout.write("Admission data valid: " + data.universities.length + " routes, " + data.admissionDetails.length + " unit records, " + data.events.length + " events.\n");
