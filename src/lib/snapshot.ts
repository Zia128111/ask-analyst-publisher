/* ============================================================================
 * SNAPSHOT
 * ============================================================================
 * Renders an element to a PNG in the browser with html-to-image, loaded on
 * first use so it costs the page nothing until someone downloads.
 *
 * The element passed in is the off-screen export stage (see ExportStage), so
 * the clone root's `opacity: 0` and fixed positioning are overridden here; its
 * children carry no such styles and render as laid out.
 * ========================================================================= */

/** Where a link sits in the picture, in CSS pixels from its top-left corner. */
export interface PictureLink {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CapturedImage {
  dataUrl: string;
  /** Size in CSS pixels. The bitmap is `pixelRatio` times larger. */
  width: number;
  height: number;
  /**
   * The links in the picture — one box per line a link runs over — so a PDF
   * made from it can keep them clickable (the Morning Briefing's "Click here
   * for more").
   */
  links: PictureLink[];
}

/** Every web or mail link in the node, one box per line box it wraps onto. */
function linksIn(node: HTMLElement): PictureLink[] {
  const origin = node.getBoundingClientRect();
  return [...node.querySelectorAll<HTMLAnchorElement>('a[href]')]
    .filter((a) => /^(https?|mailto):/.test(a.href))
    .flatMap((a) =>
      [...a.getClientRects()].map((box) => ({
        href: a.href,
        x: box.x - origin.x,
        y: box.y - origin.y,
        width: box.width,
        height: box.height,
      })),
    );
}

/*
 * html-to-image reads every stylesheet in the document to find the web fonts
 * it embeds. A stylesheet from another origin cannot be read — Google Charts
 * adds three from gstatic.com, which sends no CORS headers — and each fails
 * twice, with a console error both times, while carrying no font the picture
 * needs. So cross-origin stylesheets are set aside for the moment of the
 * capture and put back where they were. The app's own fonts are self-hosted.
 */
function setAsideForeignStylesheets(): () => void {
  const foreign = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')]
    .filter((link) => new URL(link.href, location.href).origin !== location.origin)
    .map((link) => ({ link, parent: link.parentNode, next: link.nextSibling }));
  for (const { link } of foreign) link.remove();
  /* Back to front, so a link whose next sibling was also set aside finds it
     already restored. */
  return () => {
    for (const { link, parent, next } of foreign.reverse()) {
      parent?.insertBefore(link, next?.parentNode === parent ? next : null);
    }
  };
}

export async function capturePng(node: HTMLElement, pixelRatio: number): Promise<CapturedImage> {
  // A capture taken before Lato has loaded would embed the fallback font.
  await document.fonts.ready;
  const { toPng } = await import('html-to-image');
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const links = linksIn(node);
  const restore = setAsideForeignStylesheets();
  try {
    const dataUrl = await toPng(node, {
      pixelRatio,
      width,
      height,
      backgroundColor: getComputedStyle(node).backgroundColor,
      style: { opacity: '1', position: 'static', transform: 'none' },
    });
    return { dataUrl, width, height, links };
  } finally {
    restore();
  }
}
