import { Text, Title } from '@mantine/core';

import { ProductPreview } from './ProductPreview';

import classes from './BrandPanel.module.css';

/* ============================================================================
 * BRAND PANEL
 * ============================================================================
 * The benchmark's right-hand half: product imagery on a brand-coloured field.
 * Ours is built from the brand ramp — the deepest step under the copy, so
 * white text clears AAA there, running down to the brand blue itself — and a
 * live preview of the Publisher desk assembled from design-system components
 * rather than a screenshot that would drift the first time the product moved.
 *
 * The preview is decoration: it is aria-hidden as a whole, so the sample
 * figures inside it are never read out as if they were the reader's own.
 * ========================================================================= */

export function BrandPanel() {
  return (
    <aside className={classes.panel} aria-labelledby="brand-panel-heading">
      <div className={classes.copy}>
        <Text component="p" className={classes.eyebrow}>
          Ask Analyst Publisher
        </Text>
        <Title order={2} id="brand-panel-heading" className={classes.headline}>
          Publish your research where Pakistan&rsquo;s investors already read it.
        </Title>
        <Text component="p" className={classes.lede}>
          Upload reports and notes, schedule the morning release, and see who is reading, from
          one desk.
        </Text>
      </div>

      <div className={classes.preview} aria-hidden="true">
        <ProductPreview />
      </div>
    </aside>
  );
}
