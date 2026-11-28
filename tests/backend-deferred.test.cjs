"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const rootWrangler = fs.readFileSync("wrangler.toml", "utf8");
const releaseClient = fs.readFileSync("assets/js/release-updates.js", "utf8");
const worker = fs.readFileSync("workers/assistant.mjs", "utf8");
const workflowDirectory = ".github/workflows";

test("only the admission assistant Durable Object is configured; the removed UpdateHub stays absent", () => {
  assert.match(rootWrangler, /name\s*=\s*"RATE_LIMITER"/);
  assert.match(rootWrangler, /class_name\s*=\s*"AssistantRateLimiter"/);
  assert.match(rootWrangler, /new_sqlite_classes\s*=\s*\["AssistantRateLimiter"\]/);
  assert.doesNotMatch(rootWrangler, /UPDATE_HUB|script_name/);
  assert.doesNotMatch(worker, /UpdateHub|WebSocket|\/api\/updates\/socket/);
});

test("Web Push and realtime Worker deployment are deferred rather than auto-deployed", () => {
  const activeWorkflows = fs.readdirSync(workflowDirectory).filter((name) => /\.ya?ml$/i.test(name));
  assert.ok(!activeWorkflows.includes("deploy-update-hub.yml"));
  assert.doesNotMatch(releaseClient, /WebSocket|connectRealtime|scheduleReconnect|\/api\/updates\/socket/);
});
