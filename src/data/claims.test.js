import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|json)$/.test(name) && !/\.(test|spec)\./.test(name)) out.push(p);
  }
  return out;
}

const PUBLIC_SRC = walk(fileURLToPath(new URL("../", import.meta.url))).filter((f) => !relative(fileURLToPath(new URL("../", import.meta.url)), f).startsWith("backend"));

test("unverified headline claims are not in public source", () => {
  const banned = [/20,000\+/, /15,000\+ trekkers/, /1000\+ Happy Customers/, /10,000\+ trekkers/, /Every Saturday\)/];
  const hits = [];
  for (const f of PUBLIC_SRC) {
    const text = readFileSync(f, "utf8");
    for (const re of banned) if (re.test(text) && !f.endsWith("trainingData.js")) hits.push(`${f}: ${re}`);
  }
  assert.deepEqual(hits, []);
});

test("no default 4.5 rating is invented for items without one", () => {
  const text = readFileSync(new URL("./adminStorage.js", import.meta.url), "utf8");
  assert.doesNotMatch(text, /:\s*4\.5\s*,/);
});
