/**
 * Tests all iframe URLs, sorts working ones by response time, appends broken
 * ones at the end, and writes the result directly to src/config/index.js.
 *
 * Usage: node scripts/checkUrls.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// --- Load .env.local ---
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = parseEnvFile(path.join(ROOT, ".env.local"));

// Build url1..url32 map: envKey -> { name, url }
const URL_COUNT = 32;
const urlEntries = [];
for (let i = 1; i <= URL_COUNT; i++) {
  const key = `NEXT_PUBLIC_PERSONAL_url${i}`;
  const url = env[key];
  if (url) urlEntries.push({ name: `url${i}`, envKey: key, url });
}

if (urlEntries.length === 0) {
  console.error(
    "No URLs found. Make sure .env.local exists with NEXT_PUBLIC_PERSONAL_url* values.",
  );
  process.exit(1);
}

console.log(`Found ${urlEntries.length} URLs. Testing...\n`);

// --- Test a URL ---
const TIMEOUT_MS = 8000;

async function testUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    const elapsed = Date.now() - start;
    clearTimeout(timer);
    // Treat 2xx, 3xx, and common "embed" pages (403/405/410) as alive
    const alive = res.status < 500;
    return { alive, elapsed, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    return {
      alive: false,
      elapsed,
      status: err.name === "AbortError" ? "TIMEOUT" : "ERROR",
    };
  }
}

// --- Run all tests in parallel ---
const results = await Promise.all(
  urlEntries.map(async (entry) => {
    const result = await testUrl(entry.url);
    const icon = result.alive ? "✓" : "✗";
    const timeStr = result.alive ? `${result.elapsed}ms` : "";
    console.log(
      `${icon} [${String(result.status).padStart(7)}] ${timeStr.padStart(6)}  ${entry.name.padEnd(6)} ${entry.url}`,
    );
    return { ...entry, ...result };
  }),
);

// --- Filter & sort ---
const working = results
  .filter((r) => r.alive)
  .sort((a, b) => a.elapsed - b.elapsed);

const broken = results.filter((r) => !r.alive);

console.log(`\n--- Results ---`);
console.log(
  `Working: ${working.length}  |  Broken/Timeout: ${broken.length}\n`,
);

if (broken.length > 0) {
  console.log("Broken URLs (remove from config):");
  broken.forEach((r) =>
    console.log(`  ${r.name.padEnd(6)} [${r.status}]  ${r.url}`),
  );
  console.log();
}

// --- Output new urls array ---
console.log("Sorted urls array for src/config/index.js:\n");
console.log("    urls: [");
working.forEach((r) => {
  console.log(`      process.env.${r.envKey}, // ${r.elapsed}ms`);
});

broken.forEach((r) => {
  console.log(`      process.env.${r.envKey}, // Broken`);
});
console.log("    ],");
