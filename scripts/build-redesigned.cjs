#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "dist");
const RELEASE_META = '<meta name="calendar-release" content="__CALENDAR_RELEASE_ID__">';
const FILES = [
  "index.html", "_headers", "robots.txt", "sw.js",
  "assets/css/main-shell.css", "assets/js/main-shell.js", "assets/favicon.svg",
  "assets/css/ai-assistant.css", "assets/js/ai-assistant.js",
  "assets/css/owner-select.css", "assets/js/owner-select.js"
];
function buildSite() {
  if (OUTPUT === ROOT || !OUTPUT.startsWith(ROOT + path.sep)) throw new Error("Refusing to write outside the project dist directory.");
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const releaseId = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "local-development";
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(releaseId)) throw new Error("Release ID contains unsupported characters.");
  for (const relative of FILES) {
    const source = path.join(ROOT, relative), target = path.join(OUTPUT, relative);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error("Required release file is missing: " + relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (relative === "index.html") {
      const html = fs.readFileSync(source, "utf8");
      const occurrences = html.split(RELEASE_META).length - 1;
      if (occurrences !== 1) throw new Error("index.html must contain exactly one calendar release marker.");
      fs.writeFileSync(target, html.replace(RELEASE_META, RELEASE_META.replace("__CALENDAR_RELEASE_ID__", releaseId)), "utf8");
    } else fs.copyFileSync(source, target);
  }
  fs.writeFileSync(path.join(OUTPUT, "release.json"), JSON.stringify({ id: releaseId, builtAt: new Date().toISOString() }) + "\n", "utf8");
  return FILES.concat(["release.json"]);
}
if (require.main === module) {
  try { const files = buildSite(); process.stdout.write("Redesigned admission site ready: dist/ (" + files.length + " files)\n"); }
  catch (error) { process.stderr.write("Production build failed: " + error.message + "\n"); process.exitCode = 1; }
}
module.exports = { buildSite, FILES };
