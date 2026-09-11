import { Text } from '@mantine/core';
import { Icons } from '@akseer/ask-analyst-design-system';

import classes from './SecureNotice.module.css';

/* ============================================================================
 * SECURE NOTICE
 * ============================================================================
 * The benchmark's "Your data is secure" card at the foot of the form column.
 * A note, not an alert: it is reassurance, and must not be announced as if
 * something had happened.
 *
 * The check glyph is decorative. The title beside it carries the meaning, so
 * the icon takes no label and is hidden from assistive tech automatically.
 * ========================================================================= */

export function SecureNotice() {
  return (
    <div className={classes.notice} role="note">
      <span className={classes.tile}>
        <Icons.check size="md" />
      </span>
      <div className={classes.text}>
        <Text className={classes.title}>Your data is secure</Text>
        <Text className={classes.body}>
          Encrypted sign-in. Drafts stay private until you publish.
        </Text>
      </div>
    </div>
  );
}
