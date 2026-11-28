"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");


test("assistant handles greetings without requiring calendar records", async () => {
  const { resolveSmallTalkAnswer } = await import("../workers/assistant-context.mjs");
  assert.match(resolveSmallTalkAnswer("Hi"), /ভর্তি/);
  assert.match(resolveSmallTalkAnswer("ধন্যবাদ"), /স্বাগতম/);
});

test("assistant recognizes confirmation and source follow-ups against the last substantive topic", async () => {
  const { resolveFollowUpAnswer } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU", cycleLabel: "২০২৬–২০২৭ শিক্ষাবর্ষ", verification: { status: "officially_confirmed", sources: [{ sourceId: "src-ru-portal" }] } }],
    admissionDetails: [],
    events: [{
      id: "RU-APP-DEADLINE", cycleId: "RU-2026-27", title: "অনলাইন আবেদন ও ফি জমার শেষ সময়",
      type: "application_deadline", dateOnly: "2026-11-30", startsAt: "2026-11-30T23:59:00+06:00",
      verification: { status: "officially_confirmed", sources: [{ sourceId: "src-ru-portal" }] }
    }],
    examCenters: [], circulars: [], notices: [],
    sources: [{ id: "src-ru-portal", label: "রাজশাহী বিশ্ববিদ্যালয়ের অফিসিয়াল ভর্তি পোর্টাল", url: "https://admission.ru.ac.bd/index.php", sourceType: "official_admission_portal" }]
  };
  const history = [
    { role: "user", content: "Ru er abedon er last date kobe?" },
    { role: "assistant", content: "৩০ নভেম্বর ২০২৬, রাত ১১:৫৯।" },
    { role: "user", content: "Sure?" },
    { role: "assistant", content: "হ্যাঁ, নিশ্চিত।" }
  ];
  const verified = resolveFollowUpAnswer(data, "Sure?", history);
  assert.match(verified, /অফিসিয়াল|সরকারি/);
  assert.match(verified, /৩০ নভেম্বর/);
  const source = resolveFollowUpAnswer(data, "Source deo", [...history, { role: "user", content: "Source deo" }]);
  assert.match(source, /https:\/\/admission\.ru\.ac\.bd\/index\.php/);
  assert.match(source, /অফিসিয়াল ভর্তি পোর্টাল/);
});

test("follow-up topic selection skips repeated confirmation and source requests", async () => {
  const { resolveFollowUpAnswer } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU" }],
    admissionDetails: [],
    events: [{ id: "RU-APP-DEADLINE", cycleId: "RU-2026-27", title: "অনলাইন আবেদন শেষ", type: "application_deadline", startsAt: "2026-11-30T23:59:00+06:00", verification: { status: "officially_confirmed", sources: [{ sourceId: "src-ru" }] } }],
    examCenters: [], circulars: [], notices: [],
    sources: [{ id: "src-ru", label: "RU official portal", url: "https://admission.ru.ac.bd" }]
  };
  const history = [
    { role: "user", content: "RU er abedon er last date kobe?" },
    { role: "assistant", content: "৩০ নভেম্বর।" },
    { role: "user", content: "Sure?" },
    { role: "assistant", content: "হ্যাঁ।" },
    { role: "user", content: "Source deo" }
  ];
  assert.match(resolveFollowUpAnswer(data, "আরও নিশ্চিত?", history), /৩০ নভেম্বর/);
});

test("Worker answers greetings, confirms previous facts and returns source links", async () => {
  const { default: worker } = await import("../workers/assistant.mjs");
  let aiCalls = 0;
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU" }],
    admissionDetails: [],
    events: [{
      id: "RU-APP-DEADLINE", cycleId: "RU-2026-27", title: "অনলাইন আবেদন ও ফি জমার শেষ সময়",
      type: "application_deadline", dateOnly: "2026-11-30", startsAt: "2026-11-30T23:59:00+06:00",
      verification: { status: "officially_confirmed", sources: [{ sourceId: "src-ru-portal" }] }
    }],
    examCenters: [], circulars: [], notices: [],
    sources: [{ id: "src-ru-portal", label: "রাজশাহী বিশ্ববিদ্যালয়ের অফিসিয়াল ভর্তি পোর্টাল", url: "https://admission.ru.ac.bd/index.php" }]
  };
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify(data)) },
    AI: { run: async () => { aiCalls++; throw new Error("should not call model for greetings or grounded follow-ups"); } }
  };
  const ask = async (question, history = []) => {
    const response = await worker.fetch(new Request("https://worker.example.workers.dev/api/chat", {
      method: "POST", headers: { Origin: "https://bd-admission-calendar.pages.dev", "Content-Type": "application/json" },
      body: JSON.stringify({ question, page: "calendar", history })
    }), env);
    return (await response.json()).answer;
  };
  assert.match(await ask("Hi"), /ভর্তি/);
  const first = await ask("RU er abedon er last date kobe");
  const history = [{ role: "user", content: "RU er abedon er last date kobe" }, { role: "assistant", content: first }];
  assert.match(await ask("Sure?", history), /অফিসিয়াল|সরকারি/);
  const sourceHistory = [...history, { role: "user", content: "Sure?" }, { role: "assistant", content: "হ্যাঁ, অফিসিয়াল রেকর্ডে আছে।" }];
  assert.match(await ask("Source deo", sourceHistory), /https:\/\/admission\.ru\.ac\.bd\/index\.php/);
  assert.equal(aiCalls, 0);
});

test("context builder sends only a small number of relevant records", async () => {
  const { buildRelevantContext } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [
      { id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", admissionWebsite: "https://admission.ru.ac.bd" },
      { id: "DU", name: "ঢাকা বিশ্ববিদ্যালয়", admissionWebsite: "https://admission.eis.du.ac.bd" }
    ],
    admissionCycles: [
      { id: "RU-2026-27", universityId: "RU", cycleLabel: "২০২৬–২০২৭ শিক্ষাবর্ষ" },
      { id: "DU-2026-27", universityId: "DU", cycleLabel: "২০২৬–২০২৭ শিক্ষাবর্ষ" }
    ],
    admissionDetails: [
      { id: "RU-B-2026-27", cycleId: "RU-2026-27", unitGroup: "Unit B" },
      { id: "DU-A-2026-27", cycleId: "DU-2026-27", unitGroup: "Unit A" }
    ],
    events: [
      { id: "RU-B-TEST", cycleId: "RU-2026-27", admissionDetailId: "RU-B-2026-27", title: "Unit B ভর্তি পরীক্ষা", type: "admission_test", dateOnly: "2027-02-12", verification: { status: "officially_confirmed" } },
      { id: "DU-A-TEST", cycleId: "DU-2026-27", admissionDetailId: "DU-A-2026-27", title: "Unit A ভর্তি পরীক্ষা", type: "admission_test", dateOnly: "2027-02-20" }
    ],
    examCenters: [], circulars: [], notices: [], sources: []
  };
  const context = buildRelevantContext(data, "রাজশাহী বিশ্ববিদ্যালয়ের Unit B ভর্তি পরীক্ষা কবে?", "calendar");
  assert.match(context, /১২ ফেব্রুয়ারি ২০২৭|2027-02-12/);
  assert.match(context, /রাজশাহী বিশ্ববিদ্যালয়/);
  assert.match(context, /Unit B/);
  assert.doesNotMatch(context, /ঢাকা বিশ্ববিদ্যালয়/);
  assert.ok(context.length < 3800);
});

test("context builder recognizes romanized RU and retrieves its exact application deadline", async () => {
  const { buildRelevantContext } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU", cycleLabel: "২০২৬–২০২৭ শিক্ষাবর্ষ" }],
    admissionDetails: [],
    events: [
      { id: "RU-APP-DEADLINE", cycleId: "RU-2026-27", title: "অনলাইন আবেদন ও ফি জমার শেষ সময়", type: "application_deadline", dateOnly: "2026-11-30", startsAt: "2026-11-30T23:59:00+06:00" }
    ],
    examCenters: [], circulars: [], notices: [], sources: []
  };
  const context = buildRelevantContext(data, "RU er abedon er last date kobe?");
  assert.match(context, /RU-APP-DEADLINE/);
  assert.match(context, /2026-11-30/);
  assert.match(context, /৩০ নভেম্বর,?\s*২০২৬/);
});

test("context builder resolves a romanized follow-up using the prior user question", async () => {
  const { buildRelevantContext } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU", cycleLabel: "২০২৬–২০২৭ শিক্ষাবর্ষ" }],
    admissionDetails: [],
    events: [{ id: "RU-APP-DEADLINE", cycleId: "RU-2026-27", title: "অনলাইন আবেদন ও ফি জমার শেষ সময়", type: "application_deadline", dateOnly: "2026-11-30", startsAt: "2026-11-30T23:59:00+06:00" }],
    examCenters: [], circulars: [], notices: [], sources: []
  };
  const context = buildRelevantContext(data, "Valo kore calendar theke dekho", "calendar", [
    { role: "user", content: "RU er last date kobe?" }
  ]);
  assert.match(context, /RU-APP-DEADLINE/);
  assert.match(context, /2026-11-30/);
});


test("context builder retrieves admission-detail facts for romanized university questions", async () => {
  const { buildRelevantContext } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU" }],
    admissionDetails: [{ id: "RU-B-2026-27", cycleId: "RU-2026-27", unitGroup: "Unit B", application: { applicationUrl: "https://admission.ru.ac.bd", closesAt: "2026-11-30T23:59:00+06:00" }, verification: { status: "officially_confirmed" } }],
    events: [], examCenters: [], circulars: [], notices: [], sources: []
  };
  const context = buildRelevantContext(data, "RU er application date kobe?");
  assert.match(context, /RU-B-2026-27/);
  assert.match(context, /৩০ নভেম্বর|2026-11-30/);
});

test("context builder refuses to dump the dataset for unrelated questions", async () => {
  const { buildRelevantContext } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়" }],
    admissionCycles: [], admissionDetails: [], events: [], examCenters: [], circulars: [], notices: [], sources: []
  };
  const context = buildRelevantContext(data, "আমার ব্যক্তিগত পাসওয়ার্ড কী?", "profile");
  assert.equal(context, "");
});

test("context builder includes a short explanation for a known site section", async () => {
  const { buildRelevantContext } = await import("../workers/assistant-context.mjs");
  const context = buildRelevantContext({ universities: [], admissionCycles: [], admissionDetails: [], events: [], examCenters: [], circulars: [], notices: [], sources: [] }, "এই পেজে কী দেখা যায়?", "calendar");
  assert.match(context, /ক্যালেন্ডার/);
  assert.ok(context.length < 1000);
});


test("Worker answers verified RU deadline directly from calendar data and resolves a follow-up", async () => {
  const { default: worker } = await import("../workers/assistant.mjs");
  let aiCalls = 0, limiterCalls = 0;
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU", cycleLabel: "২০২৬–২০২৭ শিক্ষাবর্ষ" }],
    admissionDetails: [],
    events: [{
      id: "RU-APP-DEADLINE", cycleId: "RU-2026-27",
      title: "অনলাইন আবেদন ও ফি জমার শেষ সময়", type: "application_deadline",
      dateOnly: "2026-11-30", startsAt: "2026-11-30T23:59:00+06:00",
      verification: { status: "officially_confirmed" }
    }],
    examCenters: [], circulars: [], notices: [], sources: []
  };
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify(data)) },
    RATE_LIMITER: { idFromName: () => "global", get: () => ({ fetch: async () => { limiterCalls++; return Response.json({ allowed: true }); } }) },
    AI: { run: async () => { aiCalls++; throw new Error("deterministic deadline must not call the model"); } }
  };
  const ask = (question, history = []) => worker.fetch(new Request("https://worker.example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://bd-admission-calendar.pages.dev", "Content-Type": "application/json" },
    body: JSON.stringify({ question, page: "calendar", history })
  }), env);
  const first = await ask("Ru er last date kobe");
  const firstAnswer = (await first.json()).answer;
  assert.match(firstAnswer, /৩০ নভেম্বর, ২০২৬/);
  assert.match(firstAnswer, /১১:৫৯/);
  const followUp = await ask("Valo kore calendar theke dekho", [
    { role: "user", content: "Ru er last date kobe" },
    { role: "assistant", content: firstAnswer }
  ]);
  const followUpAnswer = (await followUp.json()).answer;
  assert.match(followUpAnswer, /৩০ নভেম্বর, ২০২৬/);
  assert.equal(aiCalls, 0);
  assert.equal(limiterCalls, 0);
});

test("Worker security, model constant and all quota ceilings are explicit", () => {
  const worker = read("workers/assistant.mjs");
  const config = read("workers/ai-config.mjs");
  assert.match(config, /export const AI_MODEL = "@cf\/zai-org\/glm-4\.7-flash"/);
  assert.match(worker, /https:\/\/bd-admission-calendar\.pages\.dev/);
  assert.match(worker, /https:\/\/bdac\.ayon0192\.workers\.dev/);
  assert.doesNotMatch(worker, /https:\/\/\*\.pages\.dev|\*\.pages\.dev|Access-Control-Allow-Origin['"]?\s*:\s*['"]\*['"]/i);
  assert.match(worker, /SITE_DAILY_LIMIT\s*=\s*30/);
  assert.match(worker, /IP_DAILY_LIMIT\s*=\s*8/);
  assert.match(worker, /IP_MINUTE_LIMIT\s*=\s*2/);
  assert.match(worker, /MAX_QUESTION_CHARS\s*=\s*500/);
  assert.match(worker, /MAX_COMPLETION_TOKENS\s*=\s*256/);
  assert.match(worker, /এই তথ্য আমার কাছে নেই/);
  assert.match(worker, /Ignore|উপেক্ষা/);
  assert.match(worker, /CF-Connecting-IP/);
  assert.match(worker, /HMAC/);
  assert.match(worker, /ipHashSecret/);
  assert.doesNotMatch(worker, /sha256\(\`\$\{day\}:\$\{ip\}\`\)/);
});

test("frontend sends bounded history and renders responses plus HTTPS source links safely", () => {
  const js = read("assets/js/ai-assistant.js");
  const html = read("index.html");
  const endpoint = js.match(/ASSISTANT_API_URL\s*=\s*"([^"]+)"\s*;/);
  assert.ok(endpoint, "assistant API endpoint must be configured");
  const endpointUrl = new URL(endpoint[1]);
  assert.equal(endpointUrl.protocol, "https:");
  assert.equal(endpointUrl.hostname, "bdac.ayon0192.workers.dev");
  assert.equal(endpointUrl.pathname, "/api/chat");
  assert.match(js, /JSON\.stringify\(\{\s*question\s*,\s*page\s*,\s*history\s*\}\)/);
  assert.match(js, /conversationHistory\.slice\(-8\)/);
  assert.match(js, /textContent\s*=/);
  assert.match(js, /document\.createElement\("a"\)/);
  assert.match(js, /link\.rel = "noopener noreferrer"/);
  assert.match(js, /parsed\.protocol !== "https:"/);
  assert.doesNotMatch(js, /innerHTML\s*=\s*(?:answer|response|payload|message)\b/i);
  assert.match(html, /assets\/css\/ai-assistant\.css/);
  assert.match(html, /assets\/js\/ai-assistant\.js/);
});


test("Worker accepts only the exact Pages and production Worker origins and returns matching CORS headers", async () => {
  const { default: worker } = await import("../workers/assistant.mjs");
  let assetReads = 0;
  const env = { ASSETS: { fetch: async () => { assetReads++; return new Response("{}"); } } };
  const blocked = await worker.fetch(new Request("https://worker.example.workers.dev/api/chat", {
    method: "POST", headers: { Origin: "https://another.pages.dev", "Content-Type": "application/json" }, body: JSON.stringify({ question: "test" })
  }), env);
  assert.equal(blocked.status, 403);
  assert.equal(assetReads, 0);
  const allowed = await worker.fetch(new Request("https://worker.example.workers.dev/api/chat", {
    method: "OPTIONS", headers: { Origin: "https://bd-admission-calendar.pages.dev", "Access-Control-Request-Method": "POST" }
  }), env);
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), "https://bd-admission-calendar.pages.dev");
  const allowedWorker = await worker.fetch(new Request("https://bdac.ayon0192.workers.dev/api/chat", {
    method: "OPTIONS", headers: { Origin: "https://bdac.ayon0192.workers.dev", "Access-Control-Request-Method": "POST" }
  }), env);
  assert.equal(allowedWorker.status, 204);
  assert.equal(allowedWorker.headers.get("Access-Control-Allow-Origin"), "https://bdac.ayon0192.workers.dev");
  const workerPost = await worker.fetch(new Request("https://bdac.ayon0192.workers.dev/api/chat", {
    method: "POST", headers: { Origin: "https://bdac.ayon0192.workers.dev", "Content-Type": "application/json" }, body: JSON.stringify({ question: "test" })
  }), env);
  assert.equal(workerPost.status, 503);
  assert.equal(workerPost.headers.get("Access-Control-Allow-Origin"), "https://bdac.ayon0192.workers.dev");
});

test("Worker returns the fixed unknown answer without spending AI quota", async () => {
  const { default: worker } = await import("../workers/assistant.mjs");
  let limiterCalls = 0, aiCalls = 0;
  const data = { universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়" }], admissionCycles: [], admissionDetails: [], events: [], examCenters: [], circulars: [], notices: [], sources: [] };
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }) },
    RATE_LIMITER: { idFromName: () => "global", get: () => ({ fetch: async () => { limiterCalls++; return Response.json({ allowed: true }); } }) },
    AI: { run: async () => { aiCalls++; return { response: "ভুল উত্তর" }; } }
  };
  const response = await worker.fetch(new Request("https://worker.example.workers.dev/api/chat", {
    method: "POST", headers: { Origin: "https://bd-admission-calendar.pages.dev", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.10" },
    body: JSON.stringify({ question: "আমার ব্যক্তিগত পাসওয়ার্ড কী?", page: "profile" })
  }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).answer, "এই তথ্য আমার কাছে নেই");
  assert.equal(limiterCalls, 0);
  assert.equal(aiCalls, 0);
});

test("Worker reserves quota before calling AI and returns Bengali quota messages", async () => {
  const { default: worker } = await import("../workers/assistant.mjs");
  let aiCalls = 0, reserved;
  const data = {
    universities: [{ id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", admissionWebsite: "https://admission.ru.ac.bd" }],
    admissionCycles: [{ id: "RU-2026-27", universityId: "RU", cycleLabel: "২০২৬–২০২৭" }],
    admissionDetails: [{ id: "RU-B", cycleId: "RU-2026-27", unitGroup: "Unit B" }],
    events: [{ id: "RU-B-TEST", cycleId: "RU-2026-27", admissionDetailId: "RU-B", title: "Unit B ভর্তি পরীক্ষা", type: "admission_test", dateOnly: "2027-02-12", verification: { status: "officially_confirmed" } }],
    examCenters: [], circulars: [], notices: [], sources: []
  };
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify(data)) },
    RATE_LIMITER: { idFromName: () => "global", get: () => ({ fetch: async (_url, init) => { reserved = JSON.parse(init.body); return Response.json({ allowed: true }); } }) },
    AI: { run: async (_model, input) => {
      aiCalls++;
      assert.match(input.messages[0].content, /QUESTION/);
      assert.equal(input.reasoning_effort, null);
      assert.deepEqual(input.chat_template_kwargs, { enable_thinking: false, clear_thinking: true });
      assert.equal(input.max_completion_tokens, 384);
      assert.equal(Object.hasOwn(input, "max_tokens"), false);
      return { response: "১২ ফেব্রুয়ারি ২০২৭।" };
    } }
  };
  const request = () => worker.fetch(new Request("https://worker.example.workers.dev/api/chat", {
    method: "POST", headers: { Origin: "https://bd-admission-calendar.pages.dev", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.11" },
    body: JSON.stringify({ question: "RU er Unit B eligibility ki?", page: "calendar" })
  }), env);
  const response = await request();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).answer, "১২ ফেব্রুয়ারি ২০২৭।");
  assert.equal(aiCalls, 1);
  assert.equal(reserved.limits.siteDaily, 30);
  assert.equal(reserved.limits.ipDaily, 8);
  assert.equal(reserved.limits.ipMinute, 2);
  assert.equal(reserved.ip, "192.0.2.11");
  assert.equal(Object.hasOwn(reserved, "ipKey"), false);

  env.RATE_LIMITER.get = () => ({ fetch: async () => Response.json({ allowed: false, message: "আজকের এআই সীমা শেষ, কাল আবার চেষ্টা করুন।" }) });
  const limited = await request();
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).message, /আজকের এআই সীমা শেষ/);
  assert.equal(aiCalls, 1);
});


test("SQLite limiter enforces per-IP minute, per-IP day and global site-day ceilings", async () => {
  const { AssistantRateLimiter } = await import("../workers/assistant.mjs");
  function makeLimiter() {
    const rows = new Map();
    const stored = new Map();
    const sql = {
      exec(statement, ...params) {
        if (statement.startsWith("SELECT count")) {
          const key = params.join("|");
          return { toArray: () => rows.has(key) ? [{ count: rows.get(key) }] : [] };
        }
        if (statement.startsWith("INSERT INTO assistant_usage")) {
          const key = params.join("|");
          rows.set(key, (rows.get(key) || 0) + 1);
          return { toArray: () => [] };
        }
        if (statement.startsWith("UPDATE assistant_usage")) {
          const key = params.join("|");
          rows.set(key, Math.max(0, (rows.get(key) || 0) - 1));
          return { toArray: () => [] };
        }
        if (statement.startsWith("DELETE FROM assistant_usage")) {
          const [minute, day] = params;
          for (const key of rows.keys()) {
            const [scope, subject, window, period] = key.split("|");
            if ((window === "m" && period < minute) || (window === "d" && period < day)) rows.delete(key);
          }
          return { toArray: () => [] };
        }
        return { toArray: () => [] };
      }
    };
    const ctx = { storage: { sql, get: async (key) => stored.get(key), put: async (key, value) => stored.set(key, value), transactionSync: (callback) => callback() } };
    return new AssistantRateLimiter(ctx);
  }
  async function call(limiter, ip, minute, limits) {
    const response = await limiter.fetch(new Request("https://limiter.internal/reserve", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reserve", ip, day: "20261128", minute, limits })
    }));
    return response.json();
  }
  const globalLimiter = makeLimiter();
  const globalLimits = { siteDaily: 3, ipDaily: 8, ipMinute: 2 };
  assert.equal((await call(globalLimiter, "192.0.2.1", "202611281500", globalLimits)).allowed, true);
  assert.equal((await call(globalLimiter, "192.0.2.1", "202611281500", globalLimits)).allowed, true);
  assert.equal((await call(globalLimiter, "192.0.2.1", "202611281500", globalLimits)).reason, "ip_minute");
  assert.equal((await call(globalLimiter, "192.0.2.2", "202611281500", globalLimits)).allowed, true);
  assert.equal((await call(globalLimiter, "192.0.2.3", "202611281500", globalLimits)).reason, "site_daily");

  const dailyLimiter = makeLimiter();
  const dailyLimits = { siteDaily: 10, ipDaily: 2, ipMinute: 2 };
  assert.equal((await call(dailyLimiter, "192.0.2.4", "202611281500", dailyLimits)).allowed, true);
  assert.equal((await call(dailyLimiter, "192.0.2.4", "202611281501", dailyLimits)).allowed, true);
  assert.equal((await call(dailyLimiter, "192.0.2.4", "202611281502", dailyLimits)).reason, "ip_daily");
});

test("static build, CSP, Wrangler and offline shell include the assistant assets safely", () => {
  const builder = read("scripts/build-redesigned.cjs");
  const headers = read("_headers");
  const sw = read("sw.js");
  const wrangler = read("wrangler.toml");
  const js = read("assets/js/ai-assistant.js");
  const endpoint = js.match(/ASSISTANT_API_URL\s*=\s*"([^"]+)"\s*;/);
  assert.ok(endpoint, "assistant API endpoint must be configured");
  const endpointUrl = new URL(endpoint[1]);
  assert.match(builder, /assets\/css\/ai-assistant\.css/);
  assert.match(builder, /assets\/js\/ai-assistant\.js/);
  const cspWorkerHost = headers.match(/connect-src 'self' (https:\/\/[^\s;]+)/);
  assert.ok(cspWorkerHost, "CSP must allow the assistant Worker host");
  assert.equal(new URL(cspWorkerHost[1]).hostname, endpointUrl.hostname);
  assert.match(sw, /ai-assistant\.css/);
  assert.match(sw, /ai-assistant\.js/);
  assert.match(sw, /admission-calendar-v25/);
  assert.match(wrangler, /main\s*=\s*"\.\/workers\/assistant\.mjs"/);
  assert.match(wrangler, /binding\s*=\s*"AI"/);
  assert.match(wrangler, /name\s*=\s*"RATE_LIMITER"/);
  assert.match(wrangler, /run_worker_first\s*=\s*\["\/api\/\*"\]/);
});


test("production font assets are copied into dist without writing into source files", () => {
  const build = read("scripts/build.cjs");
  assert.ok(build.includes('const fontsOut = path.join(DIST, "assets", "fonts");'));
});


test("short RU date query returns its verified schedule and preserves Unit labels", async () => {
  const { resolveDeterministicCalendarAnswer } = await import("../workers/assistant-context.mjs");
  const data = {
    universities: [
      { id: "RU", name: "রাজশাহী বিশ্ববিদ্যালয়", shortName: "Rajshahi University" },
      { id: "RUET", name: "রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়", shortName: "Rajshahi University of Engineering & Technology" }
    ],
    admissionCycles: [
      { id: "RU-2026-27", universityId: "RU" },
      { id: "RUET-2026-27", universityId: "RUET" }
    ],
    admissionDetails: [],
    events: [
      { id: "RU-APP-DEADLINE", cycleId: "RU-2026-27", title: "অনলাইন আবেদন ও ফি জমার শেষ সময়", type: "application_deadline", dateOnly: "2026-11-30", verification: { status: "officially_confirmed" } },
      { id: "RU-A-EXAM", cycleId: "RU-2026-27", title: "Unit A ভর্তি পরীক্ষা", type: "admission_test", dateOnly: "2027-02-20", verification: { status: "officially_confirmed" } },
      { id: "RU-B-EXAM", cycleId: "RU-2026-27", title: "Unit B ভর্তি পরীক্ষা", type: "admission_test", dateOnly: "2027-02-12", verification: { status: "officially_confirmed" } },
      { id: "RUET-EXAM", cycleId: "RUET-2026-27", title: "RUET ভর্তি পরীক্ষা", type: "admission_test", dateOnly: "2027-01-28", verification: { status: "authority_announced" } }
    ],
    examCenters: [], circulars: [], notices: [], sources: []
  };
  const answer = resolveDeterministicCalendarAnswer(data, "RU er date");
  assert.match(answer, /রাজশাহী বিশ্ববিদ্যালয়/);
  assert.match(answer, /৩০ নভেম্বর,?\s*২০২৬/);
  assert.match(answer, /Unit A.*২০ ফেব্রুয়ারি,?\s*২০২৭/);
  assert.match(answer, /Unit B.*১২ ফেব্রুয়ারি,?\s*২০২৭/);
  assert.doesNotMatch(answer, /RUET|একক/);
});
