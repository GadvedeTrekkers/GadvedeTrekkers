import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "../../../scripts/check-contact-numbers.mjs";
import { BANNED_NUMBERS } from "../utils/contactPolicy.js";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("SEC-41 CI contact-number check", () => {
  it("frontend + backend sources and committed admin-dist are clean", () => {
    expect(scan(["src", "backend/src", "backend/admin-dist", "shared", "public", "supabase", "index.html"].map((p) => join(REPO, p)).filter((p) => !p.endsWith("index.html")))).toEqual([]);
  });
  it("catches planted retired numbers and non-allow-listed links; ignores long vendor constants", () => {
    const d = mkdtempSync(join(tmpdir(), "cn-")); mkdirSync(join(d, "src"));
    const WA = ["wa", "me"].join(".") + "/"; // built so this file passes the scan itself
    writeFileSync(join(d, "src", "a.jsx"), `<a href="https://${WA}91${BANNED_NUMBERS[0]}">x</a>\n`);
    writeFileSync(join(d, "src", "b.js"), `const n = "+91 ${BANNED_NUMBERS[0].slice(0, 5)} ${BANNED_NUMBERS[0].slice(5)}";\n`);
    writeFileSync(join(d, "src", "c.sql"), `insert into x values ('${BANNED_NUMBERS[1]}');\n`);
    writeFileSync(join(d, "src", "d.jsx"), `<a href="https://${WA}98123${"45678"}">other</a><a href="tel:+919856112727">ok</a>\n`);
    writeFileSync(join(d, "src", "e.js"), `const Aw=${"9".repeat(12)},Cw=1;\n`);
    const p = scan([d]);
    for (const f of ["a.jsx", "b.js", "c.sql"]) expect(p.some((x) => x.includes(f)), f).toBe(true);
    expect(p.filter((x) => x.includes("d.jsx"))).toHaveLength(1);
    expect(p.some((x) => x.includes("e.js"))).toBe(false);
  });
});
