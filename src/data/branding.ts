import { normaliseHex } from '../branding/contrast';
import {
  COMPANY_MAX_LENGTH,
  DEFAULT_BRANDING,
  REPORT_FONTS,
  REPORT_SIZE_ORDER,
  SOURCE_MAX_LENGTH,
  type Branding,
} from '../branding/types';

/* ============================================================================
 * REPORT STYLE — storage
 * ============================================================================
 * Where the white-label settings are kept. Today that is this browser's
 * localStorage, under two keys: the settings as a small JSON object, and the
 * logo on its own, so a colour dragged across the picker never rewrites a
 * logo of a megabyte. These functions are the seam for an account-level
 * store: give them API calls instead and nothing above them changes.
 *
 * Everything read back is validated field by field — storage is editable by
 * hand and outlives releases — and anything unrecognised falls back to the
 * design-system default rather than breaking the sheet.
 *
 * Server-safe: the root layout imports the head script from here.
 * ========================================================================= */

export const STYLE_KEY = 'ask-publisher:report-style:v1';
export const LOGO_KEY = 'ask-publisher:report-logo:v1';

/**
 * Runs in <head> before first paint and marks <html> when this browser has
 * stored branding, so a report can wait for it instead of flashing the
 * default letterhead first (see PublicationView.module.css).
 */
export const BRANDED_FLAG_SCRIPT =
  'try{var s=window.localStorage;' +
  `if(s.getItem(${JSON.stringify(STYLE_KEY)})||s.getItem(${JSON.stringify(LOGO_KEY)}))` +
  "document.documentElement.setAttribute('data-report-branded','')}catch(e){}";

/** Only what prepareLogo produces: a base64 image of an accepted type. */
const LOGO_DATA_URL = /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Blocked by the browser's site-data settings.
    return null;
  }
}

function readItem(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function parseObject(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    // Not JSON: treat as nothing stored.
    return {};
  }
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

const colour = (value: unknown) => (typeof value === 'string' ? normaliseHex(value) : null);

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((a) => a === value) ?? fallback;
}

export function readBranding(): Branding {
  const store = storage();
  if (!store) return DEFAULT_BRANDING;
  const saved = parseObject(readItem(store, STYLE_KEY));
  const logo = readItem(store, LOGO_KEY);
  return {
    font: oneOf(
      saved.font,
      REPORT_FONTS.map((f) => f.id),
      DEFAULT_BRANDING.font,
    ),
    size: oneOf(saved.size, REPORT_SIZE_ORDER, DEFAULT_BRANDING.size),
    rule: colour(saved.rule),
    fill: colour(saved.fill),
    highlight: colour(saved.highlight),
    negative: colour(saved.negative),
    bar: colour(saved.bar),
    line: colour(saved.line),
    heading: colour(saved.heading),
    tag: colour(saved.tag),
    source: text(saved.source, SOURCE_MAX_LENGTH),
    company: text(saved.company, COMPANY_MAX_LENGTH),
    logo: logo && LOGO_DATA_URL.test(logo) ? logo : null,
  };
}

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

function write(key: string, value: string | null): SaveResult {
  const store = storage();
  if (!store) return { ok: false, reason: 'unavailable' };
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unavailable' };
  }
}

/**
 * Saves everything but the logo. Settings that are all defaults are removed
 * rather than stored, so the head script does not hold back a report that
 * has nothing to apply.
 */
export function writeSettings(b: Branding): SaveResult {
  const settings = {
    font: b.font,
    size: b.size,
    rule: b.rule,
    fill: b.fill,
    highlight: b.highlight,
    negative: b.negative,
    bar: b.bar,
    line: b.line,
    heading: b.heading,
    tag: b.tag,
    source: b.source,
    company: b.company,
  };
  const allDefault = (Object.keys(settings) as (keyof typeof settings)[]).every(
    (k) => settings[k] === DEFAULT_BRANDING[k],
  );
  return write(STYLE_KEY, allDefault ? null : JSON.stringify(settings));
}

export function writeLogo(logo: string | null): SaveResult {
  return write(LOGO_KEY, logo);
}
