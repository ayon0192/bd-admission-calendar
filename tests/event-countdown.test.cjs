"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../assets/js/admission-core.js");

function makeEvent(date, type = "admission_test", status = "officially_confirmed") {
  return {
    id: "test-event",
    dateOnly: date,
    type,
    verification: { status }
  };
}

test("event countdown handles today, tomorrow, and the short range", () => {
  assert.equal(C.getEventCountdown(makeEvent("2026-11-15"), "2026-11-15").label, "আজ");
  assert.equal(C.getEventCountdown(makeEvent("2026-11-16"), "2026-11-15").label, "আগামীকাল");
  assert.equal(C.getEventCountdown(makeEvent("2026-11-17"), "2026-11-15").label, "২ দিন বাকি");
});

test("event countdown includes day 60 and hides day 61", () => {
  assert.equal(C.getEventCountdown(makeEvent("2027-01-14"), "2026-11-15").label, "৬০ দিন বাকি");
  assert.equal(C.getEventCountdown(makeEvent("2027-01-15"), "2026-11-15"), null);
});

test("past events are labelled complete and never urgent", () => {
  const result = C.getEventCountdown(makeEvent("2026-11-14", "application_deadline"), "2026-11-15");
  assert.equal(result.label, "শেষ হয়েছে");
  assert.equal(result.isUrgent, false);
});

test("countdown crosses month and year boundaries using calendar days", () => {
  assert.equal(C.getEventCountdown(makeEvent("2027-01-01"), "2026-12-31").label, "আগামীকাল");
});

test("countdown uses Dhaka's date when a UTC timestamp crosses midnight", () => {
  const event = {
    id: "dhaka-midnight",
    startsAt: "2026-11-14T20:00:00Z",
    type: "admission_test",
    verification: { status: "officially_confirmed" }
  };
  assert.equal(C.getDateKeyForEvent(event), "2026-11-15");
  assert.equal(C.getEventCountdown(event, "2026-11-15").label, "আজ");
});

test("authority-announced event countdowns are not marked approximate", () => {
  const result = C.getEventCountdown(makeEvent("2026-11-17", "admission_test", "authority_announced"), "2026-11-15");
  assert.equal(result.label, "২ দিন বাকি");
  assert.equal(result.isApproximate, false);
  assert.equal(result.isUrgent, false);
});

test("tentative and unknown statuses are explicitly approximate", () => {
  assert.equal(C.getEventCountdown(makeEvent("2026-11-17", "admission_test", "tentative"), "2026-11-15").label,
    "আনুমানিক · ২ দিন বাকি");
  assert.equal(C.getEventCountdown(makeEvent("2026-11-17", "admission_test", "future-status"), "2026-11-15").isApproximate,
    true);
});

test("past tentative events retain the approximate marker", () => {
  const result = C.getEventCountdown(makeEvent("2026-11-14", "application_deadline", "tentative"), "2026-11-15");
  assert.equal(result.label, "আনুমানিক · শেষ হয়েছে");
  assert.equal(result.isApproximate, true);
  assert.equal(result.isUrgent, false);
});

test("only confirmed deadline events due within seven days are urgent", () => {
  assert.equal(C.getEventCountdown(makeEvent("2026-11-22", "application_deadline"), "2026-11-15").isUrgent, true);
  assert.equal(C.getEventCountdown(makeEvent("2026-11-23", "application_deadline"), "2026-11-15").isUrgent, false);
  assert.equal(C.getEventCountdown(makeEvent("2026-11-17", "admission_test"), "2026-11-15").isUrgent, false);
  assert.equal(C.getEventCountdown(makeEvent("2026-11-17", "application_deadline", "tentative"), "2026-11-15").isUrgent, false);
});
