#!/usr/bin/env node
/**
 * SEC-41 / FR-FE-89 content check. Fails (exit 1) if:
 *   - a banned number (the wrong booking number or the 9999 placeholder) appears in any tracked/text file, or
 *   - a wa.me/ or tel: link uses a number that is not allow-listed.
 * Usage: node scripts/check-contact-numbers.mjs [dir ...]   (default: whole repo incl. dist/ and backend/admin-dist/)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BANNED = [['86058', '66155'].join(''), ['9999', '999999'].join(''), ['88280', '04949'].join('')];
// Whole phone-number tokens only (optional +91/91/0 prefix), so long numeric constants in vendor code don't match.
const BANNED_RE = BANNED.map((b) => new RegExp(`(?<!\\d)(?:\\+?91|0)?${b}(?!\\d)`));
const ALLOWED = new Set(['919856112727', '9856112727']);
// Numbers awaiting a BA/Pratik decision (BRD review M18). Reported as warnings, not failures, until decided.
//   (none; the old cancellation-policy number was retired by Pratik on 25 Nov 2026 and is now banned)
const PENDING_REVIEW = new Set([]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', 'test-results', 'playwright-report']);
const TEXT_EXT = /\.(m?[jt]sx?|cjs|json|sql|md|html?|css|ya?ml|txt|env|example|sh|svg)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (st.size <= MAX_BYTES && (TEXT_EXT.test(name) || name.startsWith('.env'))) yield p;
  }
}

export function scan(roots, { warnings = [] } = {}) {
  const problems = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      if (/package-lock\.json$/.test(file)) continue; // integrity hashes can contain long digit runs
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const digits = line.replace(/[\s\-().]/g, '');
        for (const re of BANNED_RE) if (re.test(digits)) problems.push(`${relative(process.cwd(), file)}:${i + 1}: banned number`);
        for (const m of line.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|tel:)\+?([\d\s-]{6,20})/g)) {
          const n = m[1].replace(/[\s-]/g, '');
          if (PENDING_REVIEW.has(n)) warnings.push(`${relative(process.cwd(), file)}:${i + 1}: pending-review number (M18)`);
          else if (!ALLOWED.has(n)) problems.push(`${relative(process.cwd(), file)}:${i + 1}: non-allow-listed contact number in link`);
        }
      });
    }
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const roots = process.argv.slice(2).length ? process.argv.slice(2) : [root];
  // build output (dist/, backend/admin-dist/) lives under the repo root and is scanned too
  const warnings = [];
  const problems = [...new Set(scan(roots, { warnings }))];
  for (const w of new Set(warnings)) console.warn('WARN ' + w);
  if (problems.length) { console.error(`SEC-41 contact-number check FAILED (${problems.length}):\n` + problems.join('\n')); process.exit(1); }
  console.log('SEC-41 contact-number check passed');
}
