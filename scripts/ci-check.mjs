import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const requiredFiles = [
  "README.md",
  "SECURITY.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
];

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const trackedSet = new Set(trackedFiles);

for (const file of requiredFiles) {
  if (!trackedSet.has(file) || !existsSync(file)) {
    throw new Error(`Required repository file is missing: ${file}`);
  }
}

const forbiddenName = /^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i;
const allowedExamples = new Set([".env.example", ".dev.vars.example"]);

for (const file of trackedFiles) {
  if (forbiddenName.test(basename(file)) && !allowedExamples.has(basename(file))) {
    throw new Error(`Potential secret-bearing file is tracked: ${file}`);
  }
}

const jsonFiles = trackedFiles.filter((file) => file.toLowerCase().endsWith(".json"));

for (const file of jsonFiles) {
  try {
    JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${error.message}`);
  }
}

console.log(`Repository checks passed. Validated ${jsonFiles.length} tracked JSON file(s).`);
