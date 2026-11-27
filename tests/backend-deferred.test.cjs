"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const rootWrangler = fs.readFileSync("wrangler.toml", "utf8");
const releaseClient = fs.readFileSync("assets/js/release-updates.js", "utf8");
const workflowDirectory = ".github/workflows";

test("Pages configuration has no binding to the removed UpdateHub Durable Object", () => {
  assert.doesNotMatch(rootWrangler, /durable_objects|UPDATE_HUB|script_name/);
});

test("Web Push and realtime Worker deployment are deferred rather than auto-deployed", () => {
  const activeWorkflows = fs.readdirSync(workflowDirectory).filter((name) => /\.ya?ml$/i.test(name));
  assert.ok(!activeWorkflows.includes("deploy-update-hub.yml"));
  assert.doesNotMatch(releaseClient, /WebSocket|connectRealtime|scheduleReconnect|\/api\/updates\/socket/);
});
