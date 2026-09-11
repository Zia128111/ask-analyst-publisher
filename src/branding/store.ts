'use client';

import { useSyncExternalStore } from 'react';

import {
  LOGO_KEY,
  STYLE_KEY,
  readBranding,
  writeLogo,
  writeSettings,
  type SaveResult,
} from '../data/branding';
import { DEFAULT_BRANDING, DEFAULT_STYLE, type Branding } from './types';

/* ============================================================================
 * BRANDING STORE
 * ============================================================================
 * The report style as an external store read with useSyncExternalStore: one
 * copy per page, shared by the drawer that edits it and every sheet that
 * shows it, with no provider to thread through the tree. It holds two
 * versions of the style:
 *
 *   SAVED  what this browser keeps. Read from storage, written only by Apply,
 *          so a refresh always shows the last applied style.
 *   DRAFT  the drawer's working copy, or null when nothing is pending. Every
 *          report renders the draft while there is one, so each control
 *          previews live; Apply writes it to storage and it becomes the saved
 *          style; Discard drops it.
 *
 * An edit that brings the draft back to the saved style clears it, so
 * "pending" always means "different from what is kept".
 *
 * THE SERVER AND HYDRATION render the defaults — the server cannot see this
 * browser's storage — and React swaps in the saved style straight after
 * hydrating. `ready` says which a render has. Until it is true, a report with
 * saved branding stays hidden (see PublicationView.module.css), so a
 * white-label reader never sees the default letterhead flash first.
 *
 * Another tab's Apply arrives through the `storage` event and replaces the
 * saved style here; a draft in progress is kept.
 * ========================================================================= */

interface State {
  saved: Branding;
  draft: Branding | null;
}

let state: State | null = null;
const listeners = new Set<() => void>();

function snapshot(): State {
  state ??= { saved: readBranding(), draft: null };
  return state;
}

function commit(next: State) {
  state = next;
  for (const listener of listeners) listener();
}

const same = (a: Branding, b: Branding) =>
  (Object.keys(a) as (keyof Branding)[]).every((key) => a[key] === b[key]);

/** A draft only while it differs from what is kept. */
const pending = (draft: Branding, saved: Branding) => (same(draft, saved) ? null : draft);

function onStorage(event: StorageEvent) {
  // A null key means another tab cleared storage altogether.
  if (event.key !== null && event.key !== STYLE_KEY && event.key !== LOGO_KEY) return;
  const { draft } = snapshot();
  const saved = readBranding();
  commit({ saved, draft: draft && pending(draft, saved) });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

/** Changes the draft; every report previews it at once. Nothing is saved. */
export function editBranding(patch: Partial<Branding>) {
  const { saved, draft } = snapshot();
  commit({ saved, draft: pending({ ...(draft ?? saved), ...patch }, saved) });
}

/**
 * Puts the design system's look back in the draft. The logo and company name
 * stay. `keys` limits it to the settings the report in view offers, so a
 * reset on one report leaves another report's settings alone.
 */
export function resetStyle(keys: readonly (keyof typeof DEFAULT_STYLE)[] = Object.keys(DEFAULT_STYLE) as (keyof typeof DEFAULT_STYLE)[]) {
  editBranding(Object.fromEntries(keys.map((key) => [key, DEFAULT_STYLE[key]])));
}

export type ApplyResult =
  | { ok: true }
  | { ok: false; failed: 'settings' | 'logo'; reason: Exclude<SaveResult, { ok: true }>['reason'] };

/**
 * Keeps the draft: writes it to storage and makes it the saved style. If the
 * browser has no room for the logo, everything else is still kept and the
 * logo stays pending, so the result can say exactly what was not saved.
 */
export function applyBranding(): ApplyResult {
  const { saved, draft } = snapshot();
  if (!draft) return { ok: true };
  const settings = writeSettings(draft);
  if (!settings.ok) return { ok: false, failed: 'settings', reason: settings.reason };
  if (draft.logo !== saved.logo) {
    const logo = writeLogo(draft.logo);
    if (!logo.ok) {
      const kept = { ...draft, logo: saved.logo };
      commit({ saved: kept, draft: pending(draft, kept) });
      return { ok: false, failed: 'logo', reason: logo.reason };
    }
  }
  commit({ saved: draft, draft: null });
  return { ok: true };
}

/** Drops the draft; every report returns to the saved style. */
export function discardBranding() {
  const { saved } = snapshot();
  commit({ saved, draft: null });
}

const SERVER_STATE: State = { saved: DEFAULT_BRANDING, draft: null };
const serverSnapshot = () => SERVER_STATE;
const subscribeToNothing = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function useBranding(): {
  /** What reports show: the draft while there is one, else the saved style. */
  branding: Branding;
  /** What this browser keeps. */
  saved: Branding;
  /** The draft has changes that Apply has not saved. */
  dirty: boolean;
  /** False on the server and while hydrating; true from the render after. */
  ready: boolean;
} {
  const current = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const ready = useSyncExternalStore(subscribeToNothing, onClient, onServer);
  return {
    branding: current.draft ?? current.saved,
    saved: current.saved,
    dirty: current.draft !== null,
    ready,
  };
}
