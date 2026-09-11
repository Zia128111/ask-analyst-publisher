'use client';

import { useCallback, useRef, useState } from 'react';

/* ============================================================================
 * useExportStage
 * ============================================================================
 * Mounts the ExportStage on demand. `open()` resolves with the stage element
 * once it is in the DOM and has had a frame to lay out and decode its images;
 * `close()` unmounts it. Kept apart from the component so React Fast Refresh
 * can hot-swap either file on its own.
 * ========================================================================= */

export function useExportStage() {
  const [mounted, setMounted] = useState(false);
  const waiting = useRef<((node: HTMLElement) => void) | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    const resolve = waiting.current;
    if (!node || !resolve) return;
    waiting.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(node)));
  }, []);

  const open = useCallback(
    () =>
      new Promise<HTMLElement>((resolve) => {
        waiting.current = resolve;
        setMounted(true);
      }),
    [],
  );

  const close = useCallback(() => setMounted(false), []);

  return { mounted, ref, open, close };
}
