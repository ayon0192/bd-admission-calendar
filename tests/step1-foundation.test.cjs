const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const tokens = read("assets/css/tokens.css"), shell = read("assets/css/main-shell.css"), js = read("assets/js/main-shell.js"), html = read("index.html");
const light = tokens.slice(tokens.indexOf(":root {"), tokens.indexOf('[data-theme="dark"] {'));
const darkBlock = tokens.slice(tokens.indexOf('[data-theme="dark"] {'), tokens.indexOf(":root {", tokens.indexOf('[data-theme="dark"] {')));
const vars = block => Object.fromEntries([...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
const L = vars(light), D = { ...L, ...vars(darkBlock) };
const lum = h => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
const PAIRS = [["--text", "--bg"], ["--text", "--card"], ["--text-2", "--bg"], ["--text-2", "--card"], ["--text-2", "--soft"], ["--on-primary", "--btn-bg"], ["--link", "--card"], ["--ok-fg", "--ok-bg"], ["--info-fg", "--info-bg"], ["--maybe-fg", "--maybe-bg"], ["--done-fg", "--done-bg"], ["--soon-fg", "--soon-bg"], ["--near-fg", "--near-bg"], ["--now-fg", "--now-bg"], ["--disabled-fg", "--disabled-bg"]];

test("tokens: every status pair reaches 4.5:1 in light and dark", () => {
  for (const [name, set] of [["light", L], ["dark", D]]) for (const [a, b] of PAIRS) assert.ok(ratio(set[a], set[b]) >= 4.5, `${name} ${a} on ${b}`);
});
test("tokens: page background and browser theme-color agree", () => {
  assert.equal(L["--bg"], "#F6F8F4");
  assert.match(html, /<meta name="theme-color" content="#F6F8F4">/);
  assert.match(js, /meta\.content="#"\+/);
});
test("stylesheet: no raw colours, gradients, blur or removed focus rings", () => {
  assert.doesNotMatch(shell, /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(shell, /gradient|backdrop-filter|outline:\s*(none|0)/);
  assert.match(shell, /outline:2px solid var\(--focus\);outline-offset:2px/);
  assert.match(shell, /prefers-reduced-motion:reduce/);
});
test("typography: 16px/1.65 body, 24/28 H1, 20 H2, 17 H3, 48px buttons", () => {
  assert.match(shell, /body\{[^}]*font-size:16px;line-height:1\.65/);
  assert.match(shell, /h1\{font-size:24px/); assert.match(shell, /h1\{font-size:28px\}/);
  assert.match(shell, /h2\{font-size:20px/); assert.match(shell, /h3\{font-size:17px/);
  assert.match(shell, /\.btn\{min-height:48px/); assert.match(shell, /\.icon-btn\{width:48px;height:48px/);
  assert.doesNotMatch(shell, /(?:min-height|min-width|height|width):44px/);
});
test("fonts: self-hosted Hind Siliguri, two weights, swap, small files", () => {
  const css = read("assets/css/fonts.css");
  assert.equal((css.match(/@font-face/g) || []).length, 2);
  assert.match(css, /font-display:\s*swap/);
  for (const f of ["hind-siliguri-400.woff2", "hind-siliguri-600.woff2"]) assert.ok(fs.statSync(path.join(root, "assets/fonts", f)).size < 70 * 1024, f);
  assert.match(tokens, /--font-sans:\s*"Hind Siliguri"/);
});
test("theme: light by default, manual dark only, accessible toggle", () => {
  assert.doesNotMatch(js, /prefers-color-scheme/);
  assert.match(js, /theme:"light"/);
  assert.match(js, /aria-pressed/);
  assert.match(html, /id="themeToggle"[^>]*aria-pressed="false"/);
  assert.match(read("assets/js/theme-init.js"), /saved\.theme === "dark"/);
});
test("shell: labelled navigation, active page marked, hidden pages inert, safe-area padding", () => {
  assert.equal((html.match(/<nav[^>]*aria-label="প্রধান নেভিগেশন"/g) || []).length, 2);
  assert.match(js, /aria-current/); assert.match(js, /inert/);
  assert.match(html, /viewport-fit=cover/); assert.match(shell, /safe-area-inset-bottom/);
  assert.match(html, /class="skip-link"/);
});
