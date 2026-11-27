const test=require("node:test");
const assert=require("node:assert/strict");
const core=require("../assets/js/admission-core.js");
const fixture=require("./fixtures/sample-admission-records.json");

test("calendar uses Monday-first weeks and a complete month grid",()=>{
  const cells=core.getCalendarCells(2026,11);
  assert.equal(cells.length,42);
  assert.equal(cells.filter(x=>x.inCurrentMonth).length,30);
  assert.equal(cells[0].weekday,1);
});
test("current-month dates exclude adjacent-month calendar cells",()=>{
  const cells=core.getCalendarCells(2026,11);
  const dates=cells.filter(cell=>cell.inCurrentMonth).map(cell=>cell.key);
  assert.equal(dates[0],"2026-11-01");
  assert.equal(dates[dates.length-1],"2026-11-30");
  assert.ok(!dates.includes("2026-12-05"));
});
test("week range always starts Monday and ends Sunday",()=>{
  assert.deepEqual(core.getWeekKeys("2026-11-11"),["2026-11-09","2026-11-10","2026-11-11","2026-11-12","2026-11-13","2026-11-14","2026-11-15"]);
});
test("calendar date keys are interpreted in Bangladesh time",()=>{
  assert.equal(core.getDhakaDateKey("2026-11-11T18:30:00Z"),"2026-11-12");
  assert.equal(core.getDhakaDateKey("not-a-date"),null);
});
test("invalid calendar date strings are rejected",()=>{
  assert.equal(core.parseDateKey("2026-02-30"),null);
  assert.equal(core.parseDateKey("2026/02/01"),null);
});
test("synthetic admission data passes referential validation",()=>{
  assert.deepEqual(core.validateDataset(fixture),[]);
});
test("calendar filters match unit, type, date and search",()=>{
  const list=core.filterEvents(fixture,{unitGroup:"A Unit (TEST ONLY)",type:"application_deadline",dateKey:"2026-11-12",query:"synthetic"});
  assert.deepEqual(list.map(x=>x.id),["test-application-deadline"]);
});

test("cycle-wide application windows keep different unit dates separate",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionDetails.push({
    ...data.admissionDetails[0],
    id:"test-unit-b",
    unitGroup:"B Unit (TEST ONLY)",
    application:{
      opensAt:"2026-11-13T12:00:00+06:00",
      closesAt:"2026-11-20T23:59:00+06:00"
    }
  });
  const event={
    ...data.events[0],
    id:"test-cycle-wide-application-open",
    type:"application_open",
    appliesToAllUnits:true
  };
  delete event.admissionDetailId;
  const result=core.getApplicationWindowsForEvent(event,data);
  assert.equal(result.detailCount,2);
  assert.equal(result.coveredDetailCount,2);
  assert.equal(result.windows.length,2);
  assert.deepEqual(result.windows.map(window=>window.unitGroups),[
    ["A Unit (TEST ONLY)"],
    ["B Unit (TEST ONLY)"]
  ]);
});

test("calendar search returns only matching dated events, never source or notice records",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].startsAt=null;
  data.events[0].dateOnly="2027-01-12";
  data.sources[0].label="Synthetic source only — TEST ONLY";
  data.notices.push({
    id:"test-search-only-notice",cycleId:"test-cycle-2026-27",
    title:"Synthetic source only notice — TEST ONLY",publishedAt:null,
    sourceId:"test-discovery-source",reviewStatus:"reviewed"
  });
  const eventMatches=core.filterEvents(data,{query:"synthetic application"});
  assert.deepEqual(eventMatches.map(item=>item.id),["test-application-deadline"]);
  assert.deepEqual(eventMatches.map(core.getDateKeyForEvent),["2027-01-12"]);
  assert.deepEqual(core.filterEvents(data,{query:"synthetic source only"}),[]);
});

test("total programme fee is separate from application processing fee",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionDetails[0].application.totalProgramFeeBDT=125000;
  assert.deepEqual(core.validateDataset(data),[]);
  data.admissionDetails[0].application.totalProgramFeeBDT=-1;
  assert.ok(core.validateDataset(data).some(message=>message.includes("invalid total programme fee")));
});

test("admission details enforce unit-group and exam-venue field limits",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionDetails[0].unitGroup="A".repeat(101);
  assert.ok(core.validateDataset(data).some(message=>message.includes("unitGroup of 1–100 characters")));
  data.admissionDetails[0].unitGroup="A Unit (TEST ONLY)";
  data.admissionDetails[0].exam.venue="V".repeat(301);
  assert.ok(core.validateDataset(data).some(message=>message.includes("exam.venue exceeds 300 characters")));
  data.admissionDetails[0].exam.venue="National University campus, Gazipur";
  assert.deepEqual(core.validateDataset(data),[]);
});

test("source document references must fit the schema limit",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.sources[0].documentReference="D".repeat(301);
  assert.ok(core.validateDataset(data).some(message=>message.includes("invalid documentReference")));
});

test("calendar event search includes Latin and legacy university aliases",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.universities[0].aliases=["Synthetic University Alias","Legacy Institute Name"];
  assert.deepEqual(core.filterEvents(data,{query:"Synthetic University Alias"}).map(x=>x.id),["test-application-deadline"]);
  assert.deepEqual(core.filterEvents(data,{query:"Legacy Institute Name"}).map(x=>x.id),["test-application-deadline"]);
});

test("filter-only lookup finds matching events outside the selected month",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].startsAt="2027-01-12T14:00:00+06:00";
  const currentMonth=core.filterEvents(data,{
    unitGroup:"A Unit (TEST ONLY)",type:"application_deadline",query:"synthetic",
    dateKeys:["2026-11-01","2026-11-02"]
  });
  const allDates=core.filterEvents(data,{
    unitGroup:"A Unit (TEST ONLY)",type:"application_deadline",query:"synthetic"
  });
  assert.deepEqual(currentMonth,[]);
  assert.deepEqual(allDates.map(event=>core.getDateKeyForEvent(event)),["2027-01-12"]);
});
test("date-only events validate and filter without inventing a time",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].startsAt=null;
  data.events[0].dateOnly="2026-11-13";
  assert.deepEqual(core.validateDataset(data),[]);
  assert.equal(core.getDateKeyForEvent(data.events[0]),"2026-11-13");
  assert.deepEqual(core.filterEvents(data,{dateKey:"2026-11-13"}).map(x=>x.id),["test-application-deadline"]);
});

test("invalid date-only event dates are rejected",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].startsAt=null;
  data.events[0].dateOnly="2026-02-30";
  assert.ok(core.validateDataset(data).some(x=>x.includes("requires a timezone-qualified startsAt or a valid dateOnly")));
});

test("date-only application and exam dates validate without placeholder timestamps",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  const detail=data.admissionDetails[0];
  detail.application.opensAt=null;
  detail.application.closesAt=null;
  detail.application.opensOn="2026-11-15";
  detail.application.closesOn="2026-12-10";
  detail.exam.startsAt=null;
  detail.exam.dateOnly="2027-01-30";
  assert.deepEqual(core.validateDataset(data),[]);
  detail.exam.dateOnly="2027-02-30";
  assert.ok(core.validateDataset(data).some(x=>x.includes("exam.dateOnly must be a valid YYYY-MM-DD date")));
});
test("university search supports the short name and Latin aliases",()=>{
  assert.equal(core.getVisibleUniversities(fixture,{query:"TESTU"}).length,1);
  assert.equal(core.getVisibleUniversities(fixture,{query:"test university"}).length,1);
});
test("directory filters include the attached admission-detail status",()=>{
  assert.equal(core.getVisibleUniversities(fixture,{status:"tentative"}).length,1);
  assert.equal(core.getVisibleUniversities(fixture,{status:"officially_confirmed"}).length,0);
});
test("broken university references are rejected",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionCycles[0].universityId="missing-university";
  assert.ok(core.validateDataset(data).some(x=>x.includes("missing universities id")));
});
test("third-party discovery sources cannot support official confirmation",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.universities[0].verification={status:"officially_confirmed",lastVerifiedAt:"2026-11-11T10:00:00+06:00",sources:[{sourceId:"test-discovery-source",supports:["name"]}]};
  assert.ok(core.validateDataset(data).some(x=>x.includes("without a referenced official source")));
});
test("official portal source and timestamp allow a confirmed record",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.sources[0].sourceType="official_admission_portal";
  data.universities[0].verification={status:"officially_confirmed",lastVerifiedAt:"2026-11-11T10:00:00+06:00",sources:[{sourceId:"test-discovery-source",supports:["officialWebsite"]}]};
  assert.deepEqual(core.validateDataset(data),[]);
});
test("event links cannot cross admission-cycle boundaries",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionCycles.push({id:"other-cycle",universityId:"test-university",session:"2025-26",verification:{status:"awaiting_official_notice",lastVerifiedAt:null,sources:[]}});
  data.events[0].cycleId="other-cycle";
  assert.ok(core.validateDataset(data).some(x=>x.includes("another cycle")));
});

test("authority-announced events require a source and explanatory note, and are not approximate",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].verification.status="authority_announced";
  data.events[0].verification.lastVerifiedAt="2026-11-11T10:00:00+06:00";
  data.events[0].verification.changeNote="Named authority confirmed the date; primary notice not directly retrieved.";
  assert.deepEqual(core.validateDataset(data),[]);
  assert.equal(core.isTentativeStatus("authority_announced"),false);
  assert.equal(core.getStatusLabel("authority_announced"),"কর্তৃপক্ষ-ঘোষিত");
  delete data.events[0].verification.changeNote;
  assert.ok(core.validateDataset(data).some(message=>message.includes("authority-announced without a change note")));
});

test("unknown verification statuses are rejected outside events but allowed for approximate event display",()=>{
  const nonEventData=JSON.parse(JSON.stringify(fixture));
  nonEventData.universities[0].verification.status="verified_maybe";
  assert.ok(core.validateDataset(nonEventData).some(x=>x.includes("invalid verification status")));

  const eventData=JSON.parse(JSON.stringify(fixture));
  eventData.events[0].verification.status="verified_maybe";
  assert.deepEqual(core.validateDataset(eventData),[]);
  assert.equal(core.isTentativeStatus(eventData.events[0].verification.status),true);
});
test("date-times without an explicit timezone are rejected",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].startsAt="2026-11-12T14:00:00";
  assert.ok(core.validateDataset(data).some(x=>x.includes("timezone-qualified ISO 8601")));
});
test("source URLs must use HTTP or HTTPS",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.sources[0].url="javascript:alert(1)";
  assert.ok(core.validateDataset(data).some(x=>x.includes("HTTP(S) URL")));
});
test("negative application fees are rejected",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionDetails[0].application.feeBDT=-10;
  assert.ok(core.validateDataset(data).some(x=>x.includes("invalid application fee")));
});

test("impossible calendar dates are rejected even when Date.parse normalizes them",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].startsAt="2026-02-30T14:00:00+06:00";
  assert.ok(core.validateDataset(data).some(x=>x.includes("timezone-qualified ISO 8601")));
});

test("pending-review events require official evidence and show the Pending label",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.sources[0].sourceType="official_university_notice";
  data.events[0].verification.status="pending_review";
  data.events[0].verification.lastVerifiedAt=null;
  assert.deepEqual(core.validateDataset(data),[]);
  assert.equal(core.getStatusLabel("pending_review"),"Pending...");
});
test("pending-review events cannot be backed by discovery-only sources",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].verification.status="pending_review";
  assert.ok(core.validateDataset(data).some(x=>x.includes("pending review without a referenced official source")));
});
test("undated official notices can be stored in the Pending Review queue",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.sources[0].sourceType="official_admission_portal";
  data.notices.push({
    id:"test-undated-notice",cycleId:"test-cycle-2026-27",
    title:"Official admission notice — TEST ONLY",publishedAt:null,
    sourceId:"test-discovery-source",reviewStatus:"needs_review",
    changeSummary:"Synthetic pending notice; never production data."
  });
  assert.deepEqual(core.validateDataset(data),[]);
});
test("third-party sources may create discovery-only Pending Review notices but cannot confirm events",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.notices.push({
    id:"test-discovery-notice",cycleId:"test-cycle-2026-27",
    title:"Synthetic discovery notice — TEST ONLY",publishedAt:null,
    sourceId:"test-discovery-source",reviewStatus:"needs_review",
    changeSummary:"Discovery only; verify against the official notice."
  });
  assert.deepEqual(core.validateDataset(data),[]);
  data.events[0].verification.status="officially_confirmed";
  data.events[0].verification.lastVerifiedAt="2026-11-18T12:00:00+06:00";
  assert.ok(core.validateDataset(data).some(x=>x.includes("confirmed without a referenced official source")));
});

test("institution type filter limits events to the selected institution group",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.universities[0].institutionGroup="engineering_university";
  assert.equal(core.filterEvents(data,{institutionGroup:"engineering_university"}).length,1);
  assert.equal(core.filterEvents(data,{institutionGroup:"general_public_university"}).length,0);
});
test("unknown institution groups are rejected",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.universities[0].institutionGroup="made_up_group";
  assert.ok(core.validateDataset(data).some(x=>x.includes("invalid institutionGroup")));
});


test("cycle-wide application dates remain visible under any selected unit",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.admissionDetails.push({...data.admissionDetails[0],id:"test-detail-b",unitGroup:"B Unit (TEST ONLY)"});
  const event={...data.events[0],id:"test-cycle-wide-application",type:"application_open",title:"All units application opens — TEST ONLY",appliesToAllUnits:true};
  delete event.admissionDetailId;
  data.events.push(event);
  assert.deepEqual(core.filterEvents(data,{unitGroup:"B Unit (TEST ONLY)",type:"application_open"}).map(x=>x.id),["test-cycle-wide-application"]);
});
test("cycle-wide flags are validated and cannot be combined with a unit link",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.events[0].appliesToAllUnits="yes";
  assert.ok(core.validateDataset(data).some(x=>x.includes("invalid appliesToAllUnits flag")));
  data.events[0].appliesToAllUnits=true;
  assert.ok(core.validateDataset(data).some(x=>x.includes("cannot be both cycle-wide and linked")));
});

test("configured filter catalogue accepts additional institution and event types",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.filterOptions={
    institutionGroups:[{value:"custom_group",label:"Custom institution group"}],
    eventTypes:[{value:"scholarship_interview",label:"Scholarship interview"}]
  };
  data.universities[0].institutionGroup="custom_group";
  data.events[0].type="scholarship_interview";
  assert.deepEqual(core.validateDataset(data),[]);
});
test("configured filter catalogue rejects duplicate values and invalid labels",()=>{
  const data=JSON.parse(JSON.stringify(fixture));
  data.filterOptions={
    institutionGroups:[
      {value:"custom_group",label:"Custom group"},
      {value:"custom_group",label:"Duplicate group"}
    ],
    eventTypes:[{value:"custom_event",label:""}]
  };
  const errors=core.validateDataset(data);
  assert.ok(errors.some(error=>error.includes("duplicate value")));
  assert.ok(errors.some(error=>error.includes("requires a value and label")));
});

test("reminders are scheduled at 09:00 Bangladesh time two days before",()=>{
 const s=core.createReminderSchedule({id:"test-reminder",title:"Test",dateOnly:"2027-01-02",verification:{status:"officially_confirmed"}},Date.parse("2026-11-17T00:00:00Z"));
 assert.equal(new Date(s.notifyAt).toISOString(),"2026-12-31T03:00:00.000Z");
 assert.equal(new Date(s.eventAt).toISOString(),"2027-01-02T03:00:00.000Z");
});
test("reminders created inside the 48-hour window are scheduled immediately",()=>{
 const now=Date.parse("2026-11-17T03:00:00Z");
 const s=core.createReminderSchedule({id:"test-reminder",title:"Test",dateOnly:"2026-11-18",verification:{status:"authority_announced"}},now);
 assert.equal(s.notifyAt,now);assert.ok(s.notifyAt<s.eventAt);
});
test("past and invalid dates are not scheduled",()=>{
 assert.equal(core.createReminderSchedule({id:"past",dateOnly:"2026-11-01"},Date.parse("2026-11-17T00:00:00Z")),null);
 assert.equal(core.createReminderSchedule({id:"bad",dateOnly:"2026-02-30"},Date.now()),null);
});


test("all five reminder filters are optional and combine without changing verified-event rules",()=>{
 const data={
  universities:[
   {id:"reminder-uni-a",name:"A University",shortName:"A",institutionGroup:"group-a"},
   {id:"reminder-uni-b",name:"B University",shortName:"B",institutionGroup:"group-b"}
  ],
  admissionCycles:[
   {id:"reminder-cycle-a",universityId:"reminder-uni-a",session:"2026-27"},
   {id:"reminder-cycle-b",universityId:"reminder-uni-b",session:"2026-27"}
  ],
  admissionDetails:[
   {id:"reminder-unit-a",cycleId:"reminder-cycle-a",unitGroup:"A Unit"},
   {id:"reminder-unit-b",cycleId:"reminder-cycle-a",unitGroup:"B Unit"},
   {id:"reminder-unit-c",cycleId:"reminder-cycle-b",unitGroup:"C Unit"}
  ],
  events:[
   {id:"reminder-general",cycleId:"reminder-cycle-a",type:"application_open",title:"Application opens",dateOnly:"2027-01-01",appliesToAllUnits:true,verification:{status:"officially_confirmed"}},
   {id:"reminder-unit-a-event",cycleId:"reminder-cycle-a",admissionDetailId:"reminder-unit-a",type:"admission_test",title:"A Unit test",dateOnly:"2027-01-02",verification:{status:"officially_confirmed"}},
   {id:"reminder-unit-b-event",cycleId:"reminder-cycle-a",admissionDetailId:"reminder-unit-b",type:"admission_test",title:"B Unit test",dateOnly:"2027-01-03",verification:{status:"officially_confirmed"}},
   {id:"reminder-unit-c-event",cycleId:"reminder-cycle-b",admissionDetailId:"reminder-unit-c",type:"application_deadline",title:"B university deadline",dateOnly:"2027-01-04",verification:{status:"authority_announced"}},
   {id:"reminder-tentative",cycleId:"reminder-cycle-a",type:"result_publication",title:"Tentative result",dateOnly:"2027-01-05",verification:{status:"tentative"}}
  ]
 };
 const ids=filters=>core.getReminderEventsForFilters(data,filters).map(event=>event.id);
 assert.deepEqual(ids({}),["reminder-general","reminder-unit-a-event","reminder-unit-b-event","reminder-unit-c-event"]);
 assert.deepEqual(ids({institutionGroupIds:["group-a"]}),["reminder-general","reminder-unit-a-event","reminder-unit-b-event"]);
 assert.deepEqual(ids({universityIds:["reminder-uni-b"]}),["reminder-unit-c-event"]);
 assert.deepEqual(ids({cycleIds:["reminder-cycle-b"]}),["reminder-unit-c-event"]);
 assert.deepEqual(ids({unitIds:["reminder-unit-a"]}),["reminder-general","reminder-unit-a-event"]);
 assert.deepEqual(ids({eventTypeIds:["admission_test"]}),["reminder-unit-a-event","reminder-unit-b-event"]);
 assert.deepEqual(ids({
  institutionGroupIds:["group-a"],universityIds:["reminder-uni-a"],cycleIds:["reminder-cycle-a"],
  unitIds:["reminder-unit-a"],eventTypeIds:["admission_test"]
 }),["reminder-unit-a-event"]);
});


test("official notice-board source type is accepted by shared integrity validation",()=>{
 const data=JSON.parse(JSON.stringify(fixture));
 data.sources[0].sourceType="official_notice_board";
 data.events[0].verification.status="pending_review";
 data.events[0].verification.lastVerifiedAt=null;
 assert.deepEqual(core.validateDataset(data),[]);
 assert.equal(core.getSourceTypeLabel("official_notice_board"),"বিশ্ববিদ্যালয়ের নোটিশ বোর্ড");
});


test("event date ranges validate and intersect calendar periods",()=>{
 const data=JSON.parse(JSON.stringify(fixture));
 data.events[0].startsAt=null;
 data.events[0].dateOnly="2026-11-10";
 data.events[0].dateRange={startsOn:"2026-11-10",endsOn:"2026-11-21"};
 assert.deepEqual(core.validateDataset(data),[]);
 assert.equal(core.filterEvents(data,{dateKeys:["2026-11-18"]}).length,1);
 data.events[0].dateRange.endsOn="2026-11-09";
 assert.ok(core.validateDataset(data).some(x=>x.includes("invalid dateRange")));
});

test("event unit scope and Dhaka-local date/time consistency are enforced",()=>{
 const data=JSON.parse(JSON.stringify(fixture));
 delete data.events[0].admissionDetailId;
 assert.ok(core.validateDataset(data).some(x=>x.includes("requires an admissionDetailId or appliesToAllUnits")));
 data.events[0].admissionDetailId="test-unit-a";
 data.events[0].dateOnly="2026-11-13";
 assert.ok(core.validateDataset(data).some(x=>x.includes("dateOnly does not match startsAt")));
 data.events[0].dateOnly="2026-11-12";
 data.events[0].endsAt="2026-11-12T13:00:00+06:00";
 assert.ok(core.validateDataset(data).some(x=>x.includes("endsAt precedes startsAt")));
});

test("late reminders are explicitly marked for the next scheduled dispatch",()=>{
 const now=Date.parse("2026-11-17T12:00:00Z");
 const soon=core.createReminderSchedule({
  id:"soon-reminder",title:"Soon",dateOnly:"2026-11-18",
  verification:{status:"officially_confirmed"}
 },now);
 assert.ok(soon);
 assert.equal(soon.notifyAt,now);
 assert.equal(soon.notifyImmediately,true);
 const later=core.createReminderSchedule({
  id:"later-reminder",title:"Later",dateOnly:"2026-11-22",
  verification:{status:"officially_confirmed"}
 },now);
 assert.ok(later);
 assert.equal(later.notifyImmediately,false);
});
