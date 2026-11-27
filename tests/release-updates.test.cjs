"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const client = fs.readFileSync("assets/js/release-updates.js", "utf8");
const build = fs.readFileSync("scripts/build.cjs", "utf8");
const css = fs.readFileSync("assets/css/release-updates.css", "utf8");

test("release client polls the no-store manifest every five minutes without a Worker socket", () => {
  assert.match(client, /\/release\.json/);
  assert.match(client, /cache: "no-store"/);
  assert.match(client, /const CHECK_INTERVAL_MS = 300_000/);
  assert.match(client, /window\.setInterval\(checkReleaseManifest, CHECK_INTERVAL_MS\)/);
  assert.match(client, /document\.visibilityState !== "visible"/);
  assert.match(client, /visibilitychange/);
  assert.match(client, /addEventListener\("online"/);
  assert.doesNotMatch(client, /WebSocket|scheduleReconnect|connectRealtime|\/api\/updates\/socket/);
});

test("a newer release is announced and reloads only after the page is idle", () => {
  assert.match(client, /calendar-release-update/);
  assert.match(client, /এখনই আপডেট/);
  assert.match(client, /hasActiveWork\(\)/);
  assert.match(client, /IDLE_BEFORE_RELOAD_MS/);
  assert.match(client, /MIN_NOTICE_VISIBLE_MS/);
  assert.match(client, /hasActiveWork\(\) \|\| document\.visibilityState !== "visible"/);
  assert.match(client, /window\.location\.reload\(\)/);
  assert.match(client, /ভর্তি ক্যালেন্ডারে নতুন আপডেট এসেছে/);
});

test("automatic in-page update does not request notification permission or subscribe users", () => {
  assert.doesNotMatch(client, /Notification\.requestPermission|PushManager|serviceWorker\.ready/);
});

test("production build links and copies update assets and refreshes the offline shell cache", () => {
  assert.match(build, /assets\/js\/release-updates\.js/);
  assert.match(build, /assets\/css\/release-updates\.css/);
  assert.match(build, /20261128-polling-1/);
  assert.match(css, /\.release-update-notice/);
  assert.match(css, /prefers-reduced-motion/);
});
