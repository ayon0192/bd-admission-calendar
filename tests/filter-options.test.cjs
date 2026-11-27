"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const C = require("../assets/js/admission-core.js");

const NOW = Date.parse("2026-11-18T12:00:00Z");
const engineeringIds = Array.from({ length: 10 }, (_, index) => "engineering-" + (index + 1));

function makeDataset() {
  const universities = engineeringIds.map((id, index) => ({
    id,
    name: "Engineering University " + (index + 1),
    institutionGroup: "engineering_university"
  }));
  universities.push({
    id: "medical-1",
    name: "Medical University",
    institutionGroup: "medical_admission"
  });

  const admissionCycles = universities.map((university, index) => ({
    id: "cycle-" + university.id,
    universityId: university.id,
    session: "2026-27"
  }));
  const admissionDetails = admissionCycles.map((cycle, index) => ({
    id: "unit-" + cycle.universityId,
    cycleId: cycle.id,
    unitGroup: index === 10 ? "Medical Unit" : "A Unit"
  }));
  const events = [];
  engineeringIds.forEach((universityId, index) => {
    events.push({
      id: "deadline-" + (index + 1),
      cycleId: "cycle-" + universityId,
      admissionDetailId: "unit-" + universityId,
      type: "application_deadline",
      title: "Application deadline " + (index + 1),
      dateOnly: "2027-01-20",
      verification: { status: "officially_confirmed" }
    });
  });
  events.push({
    id: "extra-event-engineering-10",
    cycleId: "cycle-engineering-10",
    admissionDetailId: "unit-engineering-10",
    type: "admit_card_open",
    title: "Admit card opens only at engineering 10",
    dateOnly: "2027-01-10",
    verification: { status: "officially_confirmed" }
  });
  events.push({
    id: "medical-result",
    cycleId: "cycle-medical-1",
    admissionDetailId: "unit-medical-1",
    type: "result_publication",
    title: "Medical result",
    dateOnly: "2027-01-15",
    verification: { status: "officially_confirmed" }
  });
  return {
    universities,
    admissionCycles,
    admissionDetails,
    events,
    filterOptions: {
      institutionGroups: [
        { value: "engineering_university", label: "Engineering" },
        { value: "medical_admission", label: "Medical" }
      ],
      eventTypes: [
        { value: "application_deadline", label: "Application deadline" },
        { value: "admit_card_open", label: "Admit card opens" },
        { value: "result_publication", label: "Result" }
      ]
    }
  };
}

test("ten selected universities expose the union of their event types, including a one-university extra", () => {
  const data = makeDataset();
  const filters = {
    institutionGroupIds: ["engineering_university"],
    universityIds: engineeringIds
  };
  const groupOnlyScope = C.getReminderFilterOptionScope(data, {
    institutionGroupIds: ["engineering_university"]
  }, NOW);
  assert.ok(!groupOnlyScope.universityIds.includes("medical-1"));
  const scope = C.getReminderFilterOptionScope(data, filters, NOW);
  assert.deepEqual(scope.universityIds.slice().sort(), engineeringIds.slice().sort());
  assert.equal(scope.cycleIds.length, 10);
  assert.equal(scope.unitIds.length, 10);
  assert.deepEqual(scope.eventTypeIds.slice().sort(), [
    "admit_card_open",
    "application_deadline",
    "result_publication"
  ]);
  const matched = C.getReminderEventsForFilters(data, filters);
  assert.equal(matched.length, 11);
  assert.ok(matched.some(event => event.id === "extra-event-engineering-10"));
});

test("calendar filter options also use a union across selected universities", () => {
  const data = makeDataset();
  const scope = C.getCalendarFilterOptionScope(data, {
    institutionGroup: ["engineering_university"],
    universityId: engineeringIds
  });
  assert.equal(scope.universityIds.length, 10);
  assert.deepEqual(scope.eventTypeIds.slice().sort(), [
    "admit_card_open",
    "application_deadline"
  ]);
});

test("calendar filter option scope traverses the event collection only once", () => {
  const source = makeDataset();
  let traversals = 0;
  const events = new Proxy(source.events, {
    get(target, property, receiver) {
      if (property === "filter" || property === "forEach") {
        return function (...args) {
          traversals += 1;
          return Array.prototype[property].apply(target, args);
        };
      }
      return Reflect.get(target, property, receiver);
    }
  });
  const data = { ...source, events };
  C.getCalendarFilterOptionScope(data, {
    institutionGroup: ["engineering_university"],
    universityId: engineeringIds,
    cycleId: ["cycle-engineering-10"],
    unitGroup: ["unit:A"]
  });
  assert.equal(traversals, 1);
});

test("reminder filter option scope does not depend on or traverse the event collection", () => {
  const source = makeDataset();
  let traversals = 0;
  const events = new Proxy(source.events, {
    get(target, property, receiver) {
      if (property === "filter" || property === "forEach") {
        return function (...args) {
          traversals += 1;
          return Array.prototype[property].apply(target, args);
        };
      }
      return Reflect.get(target, property, receiver);
    }
  });
  const data = { ...source, events };
  C.getReminderFilterOptionScope(data, {
    institutionGroupIds: ["engineering_university"],
    universityIds: engineeringIds,
    cycleIds: ["cycle-engineering-10"],
    unitIds: ["unit-engineering-10"]
  }, NOW);
  assert.equal(traversals, 0);
});

test("multiple selected units are combined with OR across their universities", () => {
  const data = makeDataset();
  const matched = C.getReminderEventsForFilters(data, {
    institutionGroupIds: ["engineering_university"],
    universityIds: ["engineering-9", "engineering-10"],
    unitIds: ["unit-engineering-9", "unit-engineering-10"],
    eventTypeIds: ["application_deadline", "admit_card_open"]
  });
  assert.deepEqual(matched.map(event => event.id).sort(), [
    "deadline-10",
    "deadline-9",
    "extra-event-engineering-10"
  ]);
});

test("OR applies within one filter; different filter categories remain ANDed", () => {
  const data = makeDataset();
  const bothGroups = C.getReminderEventsForFilters(data, {
    institutionGroupIds: ["engineering_university", "medical_admission"],
    universityIds: ["engineering-10", "medical-1"],
    eventTypeIds: ["admit_card_open", "result_publication"]
  });
  assert.deepEqual(bothGroups.map(event => event.id).sort(), [
    "extra-event-engineering-10",
    "medical-result"
  ]);

  const conflictingGroupAndUniversity = C.getReminderEventsForFilters(data, {
    institutionGroupIds: ["engineering_university"],
    universityIds: ["medical-1"]
  });
  assert.deepEqual(conflictingGroupAndUniversity, []);
});


test("reminder filter catalogue includes universities, cycles, units and event types before dates are published", () => {
  const data = makeDataset();
  data.universities.push({
    id: "future-engineering",
    name: "Future Engineering University",
    institutionGroup: "engineering_university"
  });
  data.admissionCycles.push({
    id: "cycle-future-engineering",
    universityId: "future-engineering",
    session: "2026-27"
  });
  data.admissionDetails.push({
    id: "unit-future-engineering",
    cycleId: "cycle-future-engineering",
    unitGroup: "A Unit"
  });

  const groupScope = C.getReminderFilterOptionScope(data, {
    institutionGroupIds: ["engineering_university"]
  }, NOW);
  assert.ok(groupScope.universityIds.includes("future-engineering"));

  const selectedScope = C.getReminderFilterOptionScope(data, {
    institutionGroupIds: ["engineering_university"],
    universityIds: ["future-engineering"]
  }, NOW);
  assert.deepEqual(selectedScope.cycleIds, ["cycle-future-engineering"]);
  assert.deepEqual(selectedScope.unitIds, ["unit-future-engineering"]);
  assert.deepEqual(selectedScope.eventTypeIds.slice().sort(), [
    "admit_card_open",
    "application_deadline",
    "result_publication"
  ]);
});
