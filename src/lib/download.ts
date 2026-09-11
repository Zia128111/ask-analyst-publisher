/* ============================================================================
 * FILE HAND-OFF
 * ============================================================================
 * Hands the reader a file the browser saves. One place, so every export —
 * image, PDF, workbook — is saved the same way.
 * ========================================================================= */

export function saveUrl(filename: string, url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
}

/** Blob URLs are revoked a minute later, not at once: revoking before the
 *  browser has started the save cancels it in some browsers. */
const REVOKE_AFTER_MS = 60_000;

export function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  saveUrl(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}
