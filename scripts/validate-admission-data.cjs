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
if (!event("DU-APP-DEADLINE") || event("DU-APP-DEADLINE").startsAt !== "2026-11-28T00:00:00+06:00") throw new Error("DU extended deadline is missing or incorrect.");
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

process.stdout.write("Admission data valid: " + data.universities.length + " routes, " + data.admissionDetails.length + " unit records, " + data.events.length + " events.\n");
