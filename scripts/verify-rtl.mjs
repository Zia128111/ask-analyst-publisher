/**
 * RTL readiness audit.
 *
 * An Ask Analyst - Saudi product exists, so Arabic (right-to-left) is a real
 * target. A component written with physical properties (left/right) does not
 * mirror; one written with logical properties (inline-start/end) does, with no
 * extra stylesheet.
 *
 * This fails the build on any physical property that has a logical equivalent.
 * Retrofitting later costs far more than never introducing them.
 *
 * Run: npm run verify:rtl
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/* pattern -> what to use instead. Physical properties only. */
const BANNED = [
  [/(?<![\w-])margin-(left|right)\s*:/g, 'margin-inline-start / margin-inline-end'],
  [/(?<![\w-])padding-(left|right)\s*:/g, 'padding-inline-start / padding-inline-end'],
  [/(?<![\w-])border-(left|right)(-\w+)?\s*:/g, 'border-inline-start / border-inline-end'],
  [/(?<![\w-])text-align\s*:\s*(left|right)/g, 'text-align: start / end'],
  [/(?<![\w-])float\s*:\s*(left|right)/g, 'float: inline-start / inline-end'],
  [/(?<![\w-])(?<!inset-)(?<!scroll-padding-)(?<!background-position-)\b(left|right)\s*:\s*(?!auto)/g,
    'inset-inline-start / inset-inline-end'],
  [/border-(top|bottom)-(left|right)-radius\s*:/g, 'border-start-start-radius etc.'],
];

/* Places a physical property is legitimate and must not be flagged. */
const ALLOW_LINE = /rtl-ok|linear-gradient|to (left|right)|@media|background-position/;

const findings = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist'].includes(e.name)) walk(p);
    } else if (/\.(css|tsx?)$/.test(e.name)) {
      // Strip comments first — prose about "right" is not a physical property.
      // Blanked rather than deleted, so reported line numbers stay accurate.
      const src = readFileSync(p, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
      const rawLines = readFileSync(p, 'utf8').split('\n');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        // Allowlist is checked against the RAW line: the `rtl-ok` opt-out lives
        // in a comment, which the stripping above has already blanked out.
        if (ALLOW_LINE.test(rawLines[i])) return;
        for (const [re, fix] of BANNED) {
          re.lastIndex = 0;
          if (re.test(line)) {
            findings.push({ file: p, line: i + 1, text: rawLines[i].trim().slice(0, 78), fix });
          }
        }
      });
    }
  }
}
walk('src');

const seen = new Set();
const unique = findings.filter((f) => {
  const k = `${f.file}:${f.line}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

for (const f of unique) {
  console.log(`FAIL  ${f.file}:${f.line}\n        ${f.text}\n        -> ${f.fix}`);
}
console.log(
  unique.length
    ? `\n${unique.length} physical properties found — these will not mirror in Arabic`
    : '\nRTL audit clean — no physical properties with a logical equivalent',
);
process.exit(unique.length ? 1 : 0);
