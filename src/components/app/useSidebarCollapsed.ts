'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  SIDEBAR_ATTRIBUTE,
  SIDEBAR_KEY,
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from '../../data/sidebar';

/* ============================================================================
 * USE SIDEBAR COLLAPSED
 * ============================================================================
 * The docked sidebar's collapsed state. The attribute on <html> is the one
 * source: the head script sets it before first paint, the stylesheet draws
 * from it, and this reads it. The server renders the sidebar open (the
 * server snapshot); straight after hydrating, React re-renders with the
 * attribute, so only the buttons' words and aria-expanded catch up — the
 * picture was already right.
 *
 * Another tab changing it arrives as a storage event and is followed here.
 * ========================================================================= */

const CHANGED = 'ask-publisher:sidebar-collapsed';

function subscribe(onChange: () => void) {
  const fromOtherTab = (event: StorageEvent) => {
    if (event.key !== SIDEBAR_KEY) return;
    document.documentElement.toggleAttribute(SIDEBAR_ATTRIBUTE, readSidebarCollapsed());
    onChange();
  };
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', fromOtherTab);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', fromOtherTab);
  };
}

const getSnapshot = () => document.documentElement.hasAttribute(SIDEBAR_ATTRIBUTE);
const getServerSnapshot = () => false;

export function useSidebarCollapsed(): [boolean, (collapsed: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setCollapsed = useCallback((next: boolean) => {
    document.documentElement.toggleAttribute(SIDEBAR_ATTRIBUTE, next);
    writeSidebarCollapsed(next);
    window.dispatchEvent(new Event(CHANGED));
  }, []);
  return [collapsed, setCollapsed];
}
