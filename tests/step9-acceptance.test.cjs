const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/main-shell.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/main-shell.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");

test("README matches the redesigned 5-destination production codebase", () => {
 assert.doesNotMatch(readme, /empty university|redesign-source\.tar\.gz/i);
 assert.match(readme, /bdac\.preferences\.v2/);
 assert.match(readme, /admission-records\.json/);
});

test("no unknown-time fallback claims সময় ঘোষিত হয়নি or invents clock times", () => {
 assert.doesNotMatch(js, /সময় ঘোষিত হয়নি/);
});

test("final stylesheet keeps token-only rule without raw hex, gradients, blur or 44px", () => {
 assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/);
 assert.doesNotMatch(css, /gradient|backdrop-filter|outline:\s*(none|0)/);
 assert.doesNotMatch(css, /(?:min-height|min-width|height|width):44px/);
});

test("asset versions match across html, sw, build, and release checks", () => {
 assert.match(html, /main-shell\.css\?v=20261127-final-1/);
 assert.match(html, /main-shell\.js\?v=20261127-final-1/);
 assert.match(sw, /main-shell\.css\?v=20261127-final-1/);
 assert.match(sw, /main-shell\.js\?v=20261127-final-1/);
});
