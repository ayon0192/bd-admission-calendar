#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

function validateAdmissionData() {
  const core = require(path.join(ROOT, "assets", "js", "admission-core.js"));
  const dataPath = path.join(ROOT, "data", "admission-records.json");
  if (!fs.existsSync(dataPath)) throw new Error("Missing data/admission-records.json.");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const errors = core.validateDataset(data);
  if (errors.length) throw new Error("Admission dataset validation failed: " + errors.join(" | "));
}
function loadBuilder() {
  validateAdmissionData();
  return require("./build-redesigned.cjs");
}
function buildSite() {
  const files = loadBuilder().buildSite();
  const releaseJsOut = path.join(DIST, "assets", "js", "release-updates.js");
  const releaseCssOut = path.join(DIST, "assets", "css", "release-updates.css");
  fs.mkdirSync(path.dirname(releaseJsOut), { recursive: true });
  fs.mkdirSync(path.dirname(releaseCssOut), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "assets", "js", "release-updates.js"), releaseJsOut);
  fs.copyFileSync(path.join(ROOT, "assets", "css", "release-updates.css"), releaseCssOut);
  const themeOut = path.join(DIST, "assets", "js", "theme-init.js");
  fs.copyFileSync(path.join(ROOT, "assets", "js", "theme-init.js"), themeOut);
  const dataOut = path.join(DIST, "data", "admission-records.json");
  fs.mkdirSync(path.dirname(dataOut), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "data", "admission-records.json"), dataOut);
  const htmlPath = path.join(DIST, "index.html");
  let htmlWithReleaseClient = fs.readFileSync(htmlPath, "utf8");
  const releaseCssLink = '<link rel="stylesheet" href="assets/css/release-updates.css?v=20261128-polling-1">';
  const releaseJsTag = '<script src="assets/js/release-updates.js?v=20261128-polling-1" defer></script>';
  if (!htmlWithReleaseClient.includes("release-updates.css")) {
    if (!htmlWithReleaseClient.includes("</head>")) throw new Error("Could not add release update stylesheet to production HTML.");
    htmlWithReleaseClient = htmlWithReleaseClient.replace("</head>", releaseCssLink + "\n</head>");
  }
  if (!htmlWithReleaseClient.includes("release-updates.js")) {
    if (!htmlWithReleaseClient.includes("</body>")) throw new Error("Could not add release update client to production HTML.");
    htmlWithReleaseClient = htmlWithReleaseClient.replace("</body>", releaseJsTag + "\n</body>");
  }
  fs.writeFileSync(htmlPath, htmlWithReleaseClient, "utf8");

  const assetVersion = "20261127-final-1";
  const updatedHtml = fs.readFileSync(htmlPath, "utf8")
    .replace(/assets\/js\/main-shell\.js\?v=[^"]+/g, "assets/js/main-shell.js?v=" + assetVersion)
    .replace(/assets\/css\/main-shell\.css\?v=[^"]+/g, "assets/css/main-shell.css?v=" + assetVersion);
  fs.writeFileSync(htmlPath, updatedHtml);
  const workerPath = path.join(DIST, "sw.js");
  if (fs.existsSync(workerPath)) {
    const worker = fs.readFileSync(workerPath, "utf8")
      .replace(/CACHE_NAME\s*=\s*["\'][^"\']+["\']/, 'CACHE_NAME = "admission-calendar-v25"')
      .replace(/assets\/js\/main-shell\.js\?v=[^"\']+/g, "assets/js/main-shell.js?v=" + assetVersion)
      .replace(/assets\/css\/main-shell\.css\?v=[^"\']+/g, "assets/css/main-shell.css?v=" + assetVersion);
    fs.writeFileSync(workerPath, worker, "utf8");
  }
  // Inline the @import lines of main-shell.css (tokens, fonts, filters) so the page loads one stylesheet.
  const shellCss = path.join(DIST, "assets", "css", "main-shell.css");
  fs.writeFileSync(shellCss, fs.readFileSync(shellCss, "utf8").replace(/@import\s+url\(["']([^"')]+)["']\);?\s*/g, (m, rel) => fs.readFileSync(path.join(ROOT, "assets", "css", rel), "utf8") + "\n"), "utf8");
  // Self-hosted fonts and their licence.
  const fontsOut = path.join(ROOT, "assets", "fonts");
  fs.mkdirSync(fontsOut, { recursive: true });
  for (const name of fs.readdirSync(path.join(ROOT, "assets", "fonts"))) fs.copyFileSync(path.join(ROOT, "assets", "fonts", name), path.join(fontsOut, name));
  return files;
}
if (require.main === module) {
  try {
    const files = buildSite();
    process.stdout.write("Redesigned admission site ready: dist/ (" + files.length + " files; single stylesheet, self-hosted fonts)\n");
  } catch (error) {
    process.stderr.write("Production build failed: " + error.message + "\n");
    process.exitCode = 1;
  }
}
module.exports = { buildSite, get FILES() { return loadBuilder().FILES; } };
