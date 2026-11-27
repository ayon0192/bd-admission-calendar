const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../assets/js/admission-core.js");

function dataset() {
  return {
    universities: [
      { id: "u1", name: "University One", institutionGroup: "public" },
      { id: "u2", name: "University Two", institutionGroup: "public" },
      { id: "u3", name: "Target University Three", institutionGroup: "private" }
    ],
    admissionCycles: [
      { id: "c1", universityId: "u1" },
      { id: "c2", universityId: "u2" }
    ],
    admissionDetails: [],
    events: [
      { id: "e1", cycleId: "c1", type: "exam", appliesToAllUnits: true }
    ],
    filterOptions: {
      institutionGroups: [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" }
      ],
      eventTypes: [{ value: "exam", label: "Exam" }]
    }
  };
}

test("calendar university options follow universities represented by calendar events", () => {
  const data = dataset();
  const first = C.getCalendarFilterOptionScope(data, {});
  assert.deepEqual(first.universityIds, ["u1"]);

  // When a new calendar event is added, a fresh option calculation includes its university.
  data.events.push({ id: "e2", cycleId: "c2", type: "exam", appliesToAllUnits: true });
  const refreshed = C.getCalendarFilterOptionScope(data, {});
  assert.deepEqual(new Set(refreshed.universityIds), new Set(["u1", "u2"]));
  assert.equal(refreshed.universityIds.includes("u3"), false);
});

test("reminder university options include the full target directory, including universities without calendar events", () => {
  const data = dataset();
  const scope = C.getReminderFilterOptionScope(data, {}, Date.now());
  assert.deepEqual(new Set(scope.universityIds), new Set(["u1", "u2", "u3"]));
  assert.equal(scope.universityIds.includes("u3"), true);
});
