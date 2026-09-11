import { Icons } from '@akseer/ask-analyst-design-system';

import { PASSWORD_RULES } from '../../auth/validation';

import classes from './PasswordRequirements.module.css';

/* ============================================================================
 * PASSWORD REQUIREMENTS
 * ============================================================================
 * A live checklist under the new-password field. Each rule shows three
 * signals as it is met: the colour token, the glyph changing from a dash to a
 * check, and a hidden "met" / "not met". The state is never carried by green
 * alone.
 *
 * Deliberately NOT a live region: announcing every keystroke's result is
 * noise. The list is read on demand, and the field's own error message says
 * when a submitted password falls short.
 * ========================================================================= */

export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className={classes.list} aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li key={rule.id} className={classes.item} data-met={met || undefined}>
            <span className={classes.mark}>
              {met ? <Icons.check size="xs" /> : <Icons.flat size="xs" />}
            </span>
            <span className="sr-only">{met ? 'Met: ' : 'Not met: '}</span>
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
