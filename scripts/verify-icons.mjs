/**
 * Icon discipline audit.
 *
 * Rule 1: never an emoji or typed symbol as an icon in rendered output. They
 * render differently per platform, cannot be recoloured with currentColor, and
 * screen readers announce their Unicode name ("black up-pointing triangle")
 * rather than the meaning. v1.0 specified icon SIZES but named no set, which is
 * exactly how a product ends up with three families and some typed arrows.
 *
 * Rule 2: import icons from src/lib/icons.tsx, not @tabler/icons-react
 * directly, so the curated set and the aria defaults stay in force.
 *
 * Comments are stripped before scanning — prose ABOUT a glyph is not a glyph.
 * A line may opt out with `icon-ok` (e.g. plain-text CSV/email export, where an
 * SVG is not possible).
 *
 * Run: npm run verify:icons
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/* Emoji, plus the specific symbols people type when there is no icon set. */
const PICTOGRAPH =
  /[\u{1F300}-\u{1FAFF}]|\u{FE0F}|[\u2605\u2606\u25B2\u25BC\u25CF\u2191\u2193\u27F3\u2713\u2717\u2726\u26A0]/u;

/** Blank comments but keep line count, so reported line numbers stay true. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
}

const findings = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist'].includes(e.name)) walk(p);
    } else if (/\.tsx?$/.test(e.name)) {
      const raw = readFileSync(p, 'utf8');
      const code = stripComments(raw);
      const rawLines = raw.split('\n');

      code.split('\n').forEach((line, i) => {
        if (/icon-ok/.test(rawLines[i])) return;
        if (PICTOGRAPH.test(line)) {
          findings.push({ p, i: i + 1, line: rawLines[i].trim().slice(0, 70), why: 'pictograph used as an icon' });
        }
      });

      // Rule 2 — a real import statement, not a mention in prose.
      const isIconsModule = p.endsWith(join('lib', 'icons.tsx'));
      if (!isIconsModule && /^\s*import[\s\S]*?from\s+['"]@tabler\/icons-react['"]/m.test(code)) {
        findings.push({ p, i: 0, line: "import … from '@tabler/icons-react'", why: 'import from lib/icons instead' });
      }
    }
  }
}
walk('src');

for (const f of findings) console.log(`FAIL  ${f.p}:${f.i}\n        ${f.line}\n        -> ${f.why}`);
console.log(
  findings.length
    ? `\n${findings.length} icon violations`
    : '\nIcon audit clean — Tabler SVGs only, imported through lib/icons',
);
process.exit(findings.length ? 1 : 0);
