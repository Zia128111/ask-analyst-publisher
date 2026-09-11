'use client';

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import {
  ActionIcon,
  Button,
  ColorInput,
  ColorSwatch,
  FileButton,
  Input,
  Loader,
  SegmentedControl,
  Select,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { Icons, formatNumber, tokens } from '@akseer/ask-analyst-design-system';

import { AA_GRAPHIC, AA_TEXT, PAPER, contrast, normaliseHex, textOn } from '../../branding/contrast';
import { LOGO_ACCEPT, LogoError, prepareLogo } from '../../branding/logo';
import { offeredStyle, placementFor, type StyleSetting } from '../../branding/placement';
import {
  applyBranding,
  discardBranding,
  editBranding,
  resetStyle,
  useBranding,
  type ApplyResult,
} from '../../branding/store';
import {
  CHART_DEFAULTS,
  COMPANY_MAX_LENGTH,
  REPORT_FONTS,
  REPORT_SIZES,
  REPORT_SIZE_ORDER,
  SOURCE_MAX_LENGTH,
  customLogoAlt,
  fontById,
  type ReportFontId,
  type ReportSize,
} from '../../branding/types';
import { PUBLISHER } from '../../data/publications';
import { SettingsSection } from '../SettingsSection';

import chrome from '../ChromeToggle.module.css';
import classes from './ReportStyleSettings.module.css';

/* ============================================================================
 * REPORT STYLE — the white-label controls in the account drawer
 * ============================================================================
 * Table text size first, then the company logo and name, typeface, rule and
 * fill colours, and the source line — the order the user set. Every change
 * previews on the report behind the drawer
 * as it is made — the drawer keeps no scrim for exactly that reason — and the
 * downloads follow, since they are made from the same styled sheet.
 *
 * NOTHING IS KEPT UNTIL APPLY. The controls edit a draft (src/branding/
 * store.ts); Apply writes it to this browser's storage, so a refresh shows
 * the applied style, and Discard returns the report to it. Closing the drawer
 * with changes pending asks first — Apply and close, or Discard and close —
 * and so does leaving the page (the browser's own prompt, in AccountMenu).
 *
 * The choices are bounded where the design system has rules: sizes are steps
 * of its type scale from the 14px data floor up; typefaces are self-hosted
 * faces with real italics and tabular figures; a fill's text colour is picked
 * for contrast and the ratio is shown, in words and with an icon, not colour
 * alone. Colours, the name and the source line are free: they are the
 * publisher's.
 *
 * THE REPORT IN VIEW sets what is offered. MTS offers every setting; Latest
 * Result only the logo, the border colour, its row fills (header and
 * highlight), the typeface and the text size; BOP adds the company name on
 * its band and the colours of its negative figures and of its chart's bars
 * and line; Oil Marketing and Portfolio Investment offer what their sheets
 * show. Each field's info
 * tooltip says in one line what it does on that report, and Reset style
 * resets only the offered settings (src/branding/placement.ts).
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];

/** Suggestions from the design system's palette; any colour can be typed. */
const RULE_SWATCHES = [
  tokens.blue[6],
  tokens.blue[9],
  tokens.ink,
  tokens.neutral[5],
  tokens.neutral[7],
  tokens.green[7],
  tokens.red[7],
];

const FILL_SWATCHES = [
  tokens.blue[0],
  tokens.blue[1],
  tokens.blue[2],
  tokens.neutral[1],
  tokens.green[1],
  tokens.amber[1],
  tokens.blue[9],
];

/** Reds from light to deep, amber, and ink, for negative figures. */
const NEGATIVE_SWATCHES = [
  tokens.red[5],
  tokens.red[6],
  tokens.red[7],
  tokens.red[8],
  tokens.red[9],
  tokens.amber[6],
  tokens.ink,
];

/** The design system's categorical chart palette, in its order. */
const CHART_SWATCHES = [...tokens.chartCategorical];

const FONT_OPTIONS = REPORT_FONTS.map((f) => ({
  value: f.id,
  label: f.id === 'lato' ? 'Lato (default)' : f.label,
}));

const SIZE_OPTIONS = REPORT_SIZE_ORDER.map((value) => ({ value, label: REPORT_SIZES[value].label }));

/** The light surface: an uploaded logo's plate, as on the sheet in dark mode. */
const PLATE = color['bg-surface'];

/*
 * A field of the Report style: its label, an info button at the end of the
 * label's line — the field's top corner, over the end of its control — and
 * the control 4px below: the gap between the Latest Result page's "Company"
 * label and its search.
 *
 * THE EXPLAINER lives in the info button's tooltip, opened by hover, focus or
 * a tap (the design system's Tooltip defaults), so the drawer reads as labels
 * and controls. One plain line, from the report's placement. The tooltip
 * follows the colour scheme, light on a light page (the stylesheet says how).
 * The button sits beside the <label>, not inside it: a button
 * inside a label is invalid markup and would focus the field when pressed.
 * The explainer is also kept, visually hidden, as the control's description,
 * so a screen reader hears it on the field itself: `infoId` for a control
 * that takes aria-describedby, or Mantine's own `description` prop, hidden
 * (`HIDDEN_DESCRIPTION`), for a Mantine input — which sets aria-describedby
 * from its wrapper after any passed in, so a passed one never arrives.
 */
function Field({
  label,
  info,
  labelAs = 'label',
  group = false,
  children,
}: {
  label: string;
  info?: string;
  /** 'div' for a control named by aria-labelledby instead of <label for>. */
  labelAs?: 'label' | 'div';
  /** The field is a group of controls, named by its label. */
  group?: boolean;
  children: (ids: { id: string; labelId: string; infoId: string | undefined; info: string | undefined }) => ReactNode;
}) {
  const id = useId();
  const labelId = useId();
  const infoId = useId();
  return (
    <div
      className={classes.field}
      role={group ? 'group' : undefined}
      aria-labelledby={group ? labelId : undefined}
    >
      <div className={classes.head}>
        <Input.Label
          id={labelId}
          labelElement={labelAs}
          htmlFor={labelAs === 'label' ? id : undefined}
          className={classes.label}
        >
          {label}
        </Input.Label>
        {info && (
          <>
            <Tooltip
              label={info}
              multiline
              radius="md"
              position="top-end"
              arrowPosition="center"
              classNames={{ tooltip: classes.tooltip, arrow: classes.tooltipArrow }}
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                className={classes.info}
                aria-label={`About ${label.toLowerCase()}`}
                aria-describedby={infoId}
              >
                <Icons.info size="xs" />
              </ActionIcon>
            </Tooltip>
            <span id={infoId} className="sr-only">
              {info}
            </span>
          </>
        )}
      </div>
      {children({ id, labelId, infoId: info ? infoId : undefined, info })}
    </div>
  );
}

/** A Mantine input's description, kept for screen readers and hidden on screen. */
const HIDDEN_DESCRIPTION = { description: 'sr-only' };

/*
 * A group of the Report style's fields under a heading of its own: the
 * table's settings, then the chart's where the report has one (the user's
 * ask, so a report with both reads as two short lists rather than one long
 * one). The heading names the group for assistive technology too: "Chart,
 * group".
 */
function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={classes.group}>
      <p id={id} className={classes.groupTitle}>
        {title}
      </p>
      {children}
    </div>
  );
}

/*
 * A colour field that takes a hex code as readily as a pick. The code is the
 * field's own text, typed with or without its "#", in any case, three digits
 * or six, and the report takes it the moment it is a whole colour: "0a6",
 * "#00AA66". An empty field means the design-system default and shows that
 * default's code as its placeholder, so there is always a code to read; the
 * swatch shows the colour in use either way. Enter, or leaving the field,
 * settles the text to the six-digit code that is kept; a half-typed value
 * goes back to the colour in use.
 *
 * ESCAPE closes the picker, not the drawer. Mantine's drawer closes on any
 * Escape unless the focused element carries data-mantine-stop-propagation,
 * which Select sets while its list is open and ColorInput does not. So this
 * field holds the picker's open state itself — opened on focus and click,
 * closed on blur and Escape (and Enter), as ColorInput does internally — and
 * flags the input while the picker shows. A second Escape then closes the
 * drawer.
 */
function ColourField({
  label,
  info,
  readout,
  fallback,
  fallbackName,
  value,
  swatches,
  onChange,
}: {
  label: string;
  /** The explainer, in the info button's tooltip. */
  info?: string;
  /**
   * What to say under the field about a chosen colour: how text reads on it
   * (a fill), or how it reads on the white report as text or as a chart mark.
   */
  readout?: 'fill' | 'text' | 'mark';
  /** What an empty field means, as #rrggbb: the design-system default. */
  fallback: string;
  /** That default in words, shown beside its code in the placeholder. */
  fallbackName: string;
  value: string | null;
  swatches: string[];
  onChange: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const [synced, setSynced] = useState(value);
  const [pickerOpen, setPickerOpen] = useState(false);
  // A change from elsewhere — Reset style, Discard, another tab — replaces
  // the text, unless it already says the same colour in other words.
  if (synced !== value) {
    setSynced(value);
    const meant = draft.trim() === '' ? null : normaliseHex(draft);
    if (meant !== value) setDraft(value ?? '');
  }

  const settle = () => {
    setPickerOpen(false);
    if (draft.trim() !== '') setDraft(normaliseHex(draft) ?? value ?? '');
  };

  return (
    <Field label={label} info={info}>
      {({ id }) => (
        <>
          <ColorInput
            id={id}
            description={info}
            placeholder={`${fallback.toUpperCase()} (${fallbackName})`}
            format="hex"
            classNames={{ input: classes.hex, ...HIDDEN_DESCRIPTION }}
            /* Mantine's own preview goes white on an empty field; this one
               shows the colour the report is using, the default included. */
            leftSection={<ColorSwatch color={value ?? fallback} size={tokens.iconSize.md} aria-hidden />}
            swatches={swatches}
            swatchesPerRow={swatches.length}
            fixOnBlur={false}
            /* Mantine's eyedropper is an icon button with no name of its own. */
            eyeDropperButtonProps={{ 'aria-label': `Pick the ${label.toLowerCase()} from the screen` }}
            popoverProps={{ opened: pickerOpen }}
            data-mantine-stop-propagation={pickerOpen || undefined}
            value={draft}
            onChange={(next) => {
              setDraft(next);
              if (next.trim() === '') onChange(null);
              else {
                const hex = normaliseHex(next);
                if (hex) onChange(hex);
              }
            }}
            onFocus={() => setPickerOpen(true)}
            onClick={() => setPickerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setPickerOpen(false);
              else if (event.key === 'Enter') settle();
            }}
            onBlur={settle}
          />
          {value !== null &&
            (readout === 'fill' ? (
              <FillReadout fill={value} />
            ) : readout ? (
              <PaperReadout colour={value} use={readout} />
            ) : null)}
        </>
      )}
    </Field>
  );
}

/**
 * The text colour on a chosen fill and whether it passes, as words and icon.
 * A polite status, so the verdict is heard as the colour changes.
 */
function FillReadout({ fill }: { fill: string }) {
  const text = textOn(fill);
  const ratio = formatNumber(text.ratio, { decimals: 2 });
  return (
    <span className={classes.readout} data-passes={text.passes} role="status">
      <span className={classes.icon}>
        {text.passes ? <Icons.check size="xs" /> : <Icons.warning size="xs" />}
      </span>
      <span>
        {text.color === INK ? 'Ink' : 'White'} text on it: {ratio}:1,{' '}
        {text.passes
          ? 'passes AA.'
          : `below the ${formatNumber(AA_TEXT, { decimals: 1 })}:1 AA minimum. Try a lighter or darker shade.`}
      </span>
    </span>
  );
}

/**
 * How a chosen colour reads on the white a report prints on, which every
 * download is: as text, against WCAG's 4.5:1, or as a chart's bar or line,
 * against 3:1 for graphics. Words and an icon, as the fill's readout.
 */
function PaperReadout({ colour, use }: { colour: string; use: 'text' | 'mark' }) {
  const minimum = use === 'text' ? AA_TEXT : AA_GRAPHIC;
  const ratio = contrast(colour, PAPER);
  const passes = ratio >= minimum;
  const shown = formatNumber(ratio, { decimals: 2 });
  /* "4.5:1" and "3:1", as WCAG writes them. */
  const floor = formatNumber(minimum, { decimals: Number.isInteger(minimum) ? 0 : 1 });
  return (
    <span className={classes.readout} data-passes={passes} role="status">
      <span className={classes.icon}>
        {passes ? <Icons.check size="xs" /> : <Icons.warning size="xs" />}
      </span>
      <span>
        On white: {shown}:1,{' '}
        {use === 'text'
          ? passes
            ? 'passes AA.'
            : `below the ${floor}:1 AA minimum. Try a darker shade.`
          : passes
            ? `passes the ${floor}:1 chart minimum.`
            : `below the ${floor}:1 chart minimum. Try a darker shade.`}
      </span>
    </span>
  );
}

interface FieldMessage {
  tone: 'error' | 'warning';
  text: string;
  /** The logo the message is about; it goes when that logo does. */
  forLogo: string | null;
}

function LogoField({
  logo,
  company,
  info,
}: {
  logo: string | null;
  company: string;
  /** What the logo does on the report in view: its info tooltip. */
  info?: string;
}) {
  const resetRef = useRef<() => void>(null);
  const uploadRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<FieldMessage | null>(null);

  const choose = async (file: File | null) => {
    // Clear the input, so choosing the same file again still fires.
    resetRef.current?.();
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const prepared = await prepareLogo(file);
      editBranding({ logo: prepared.src });
      if (prepared.wide) {
        setMessage({
          tone: 'warning',
          text: 'This logo is wider than the logo space, so it is scaled down to fit and prints below full height. A stacked version of the logo will fill the height.',
          forLogo: prepared.src,
        });
      } else if (prepared.soft) {
        setMessage({
          tone: 'warning',
          text: 'The logo in this image is small, so it is enlarged to the letterhead’s height and may print soft. A larger PNG or an SVG will be sharper.',
          forLogo: prepared.src,
        });
      }
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof LogoError ? error.message : 'That file could not be opened as an image.',
        forLogo: logo,
      });
    } finally {
      setBusy(false);
    }
  };

  /* The Remove button goes with the logo, so focus moves to the upload
     button beside it rather than falling back to the top of the drawer. */
  const remove = () => {
    editBranding({ logo: null });
    uploadRef.current?.focus();
  };

  const shown = message && message.forLogo === logo ? message : null;

  return (
    <Field label="Company logo" info={info} labelAs="div" group>
      {({ infoId }) => (
        <>
          <div className={classes.logoRow}>
            {logo && (
              <span className={classes.logoPreview} style={{ background: PLATE }}>
                <img src={logo} alt={`Current logo: ${customLogoAlt(company)}`} />
              </span>
            )}
            {/* Upload alone takes the full width; Replace and Remove share it. */}
            <div className={classes.pair}>
              <FileButton onChange={choose} accept={LOGO_ACCEPT} resetRef={resetRef}>
                {(props) => (
                  <Button
                    {...props}
                    ref={uploadRef}
                    variant="default"
                    fullWidth
                    aria-describedby={infoId}
                    aria-busy={busy || undefined}
                    leftSection={busy ? <Loader size="xs" /> : undefined}
                  >
                    {logo ? 'Replace logo' : 'Upload logo'}
                  </Button>
                )}
              </FileButton>
              {logo && (
                <Button variant="default" fullWidth onClick={remove}>
                  Remove logo
                </Button>
              )}
            </div>
          </div>
          {shown && (
            <p className={classes.message} data-tone={shown.tone} role="alert">
              <span className={classes.icon}>
                <Icons.warning size="xs" />
              </span>
              <span>{shown.text}</span>
            </p>
          )}
        </>
      )}
    </Field>
  );
}

const failureText = (result: Exclude<ApplyResult, { ok: true }>) =>
  result.failed === 'logo'
    ? 'Everything else is applied, but this browser has no room left for the logo, so the logo is not applied. A smaller file will fit.'
    : 'This browser would not keep the settings, so nothing was applied. A private window or blocked site data can cause this.';

/*
 * THE APPLY BAR. Sticks to the foot of the drawer while the Report style is
 * in view, so Apply is always one reach away however far down the fields go.
 * Apply and Discard stay focusable when there is nothing to apply (styled
 * disabled, announced as disabled): a truly disabled button would drop focus
 * to the page the moment it was pressed. The status line is a live region,
 * so "Applied" is heard as well as seen.
 *
 * When the drawer is asked to close with changes pending (`closeHeld`), the
 * bar asks what to do with them, and focus moves to its first answer.
 */
function ApplyBar({
  dirty,
  closeHeld,
  onDone,
}: {
  dirty: boolean;
  closeHeld: boolean;
  onDone: () => void;
}) {
  const answerRef = useRef<HTMLButtonElement>(null);
  const [applied, setApplied] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (closeHeld) answerRef.current?.focus();
  }, [closeHeld]);

  const apply = () => {
    const result = applyBranding();
    setApplied(result.ok);
    setFailure(result.ok ? null : failureText(result));
    return result.ok;
  };

  const discard = () => {
    discardBranding();
    setApplied(false);
    setFailure(null);
  };

  const unlessIdle = (action: () => void) => (event: MouseEvent) => {
    if (!dirty) {
      event.preventDefault();
      return;
    }
    action();
  };

  const status = dirty
    ? 'Not applied yet. The report is showing a preview.'
    : applied
      ? 'Applied. This style stays after a refresh.'
      : 'Changes preview on the report. Apply keeps them on this device.';

  return (
    <div className={classes.applyBar} data-held={closeHeld || undefined}>
      {closeHeld ? (
        <>
          <p className={classes.prompt} role="alert">
            These changes are not applied yet. Keep them?
          </p>
          <div className={classes.pair}>
            <Button
              ref={answerRef}
              variant="filled"
              fullWidth
              onClick={() => {
                if (apply()) onDone();
              }}
            >
              Apply and close
            </Button>
            <Button
              variant="default"
              fullWidth
              onClick={() => {
                discard();
                onDone();
              }}
            >
              Discard and close
            </Button>
          </div>
        </>
      ) : (
        <div className={classes.pair}>
          <Button
            variant="filled"
            fullWidth
            aria-disabled={!dirty || undefined}
            data-disabled={!dirty || undefined}
            onClick={unlessIdle(apply)}
          >
            Apply
          </Button>
          <Button
            variant="default"
            fullWidth
            aria-disabled={!dirty || undefined}
            data-disabled={!dirty || undefined}
            onClick={unlessIdle(discard)}
          >
            Discard changes
          </Button>
        </div>
      )}
      <p className={classes.status} role="status" data-state={dirty ? 'pending' : applied ? 'applied' : 'idle'}>
        {!dirty && applied && (
          <span className={classes.icon}>
            <Icons.check size="xs" />
          </span>
        )}
        <span>{status}</span>
      </p>
      {failure && (
        <p className={classes.message} data-tone="error" role="alert">
          <span className={classes.icon}>
            <Icons.warning size="xs" />
          </span>
          <span>{failure}</span>
        </p>
      )}
    </div>
  );
}

export function ReportStyleSettings({
  publication,
  closeHeld = false,
  onDone,
}: {
  /** The publication in view, whose sheet the descriptions describe. */
  publication?: string | null;
  /** The drawer was asked to close while changes are pending. */
  closeHeld?: boolean;
  /** Close the drawer: called once the pending changes are applied or discarded. */
  onDone: () => void;
}) {
  const { branding, dirty } = useBranding();
  const face = fontById(branding.font).stack ?? undefined;
  const where = placementFor(publication);
  const offers = (setting: StyleSetting) => where.offers.has(setting);
  /** What the setting does on the report in view: its info tooltip. */
  const explain = (setting: StyleSetting) => where.describe[setting];

  return (
    <SettingsSection label="Report style" hint="Applies to every report and its downloads." stretch>
      <div className={classes.fields}>
        <FieldGroup title="Table">
          {offers('size') && (
            <Field label="Table text size" info={explain('size')} labelAs="div">
              {({ labelId, infoId }) => (
                <SegmentedControl<ReportSize>
                  className={chrome.root}
                  aria-labelledby={labelId}
                  aria-describedby={infoId}
                  fullWidth
                  data={SIZE_OPTIONS}
                  value={branding.size}
                  onChange={(size) => editBranding({ size })}
                />
              )}
            </Field>
          )}

          {offers('logo') && <LogoField logo={branding.logo} company={branding.company} info={explain('logo')} />}

          {offers('company') && (
            <Field label="Company name" info={explain('company')}>
              {({ id, info }) => (
                <TextInput
                  id={id}
                  description={info}
                  classNames={HIDDEN_DESCRIPTION}
                  placeholder={PUBLISHER.name}
                  value={branding.company}
                  maxLength={COMPANY_MAX_LENGTH}
                  autoComplete="organization"
                  onChange={(event) => editBranding({ company: event.currentTarget.value })}
                />
              )}
            </Field>
          )}

          {offers('font') && (
            <Field label="Font" info={explain('font')}>
              {({ id, info }) => (
                <Select
                  id={id}
                  description={info}
                  classNames={HIDDEN_DESCRIPTION}
                  data={FONT_OPTIONS}
                  value={branding.font}
                  allowDeselect={false}
                  onChange={(value) => value && editBranding({ font: value as ReportFontId })}
                  /* Each typeface is shown in itself, and so is the choice. */
                  renderOption={({ option }) => (
                    <span style={{ fontFamily: fontById(option.value as ReportFontId).stack ?? undefined }}>
                      {option.label}
                    </span>
                  )}
                  styles={{ input: { fontFamily: face } }}
                />
              )}
            </Field>
          )}

          {offers('rule') && (
            <ColourField
              label="Border colour"
              info={explain('rule')}
              fallback={color['border-brand']}
              fallbackName="brand blue"
              value={branding.rule}
              swatches={RULE_SWATCHES}
              onChange={(rule) => editBranding({ rule })}
            />
          )}

          {offers('fill') && (
            <ColourField
              label="Fill colour"
              info={explain('fill')}
              readout="fill"
              fallback={color['bg-brand-subtle']}
              fallbackName="brand tint"
              value={branding.fill}
              swatches={FILL_SWATCHES}
              onChange={(fill) => editBranding({ fill })}
            />
          )}

          {offers('highlight') && (
            <ColourField
              label="Highlight colour"
              info={explain('highlight')}
              readout="fill"
              /* Empty follows the fill, so the placeholder names whichever
                 colour that is now. */
              fallback={branding.fill ?? color['bg-brand-subtle']}
              fallbackName={branding.fill ? 'the fill colour' : 'brand tint'}
              value={branding.highlight}
              swatches={FILL_SWATCHES}
              onChange={(highlight) => editBranding({ highlight })}
            />
          )}

          {offers('negative') && (
            <ColourField
              label="Negative figures colour"
              info={explain('negative')}
              readout="text"
              fallback={color['negative-text']}
              fallbackName="negative red"
              value={branding.negative}
              swatches={NEGATIVE_SWATCHES}
              onChange={(negative) => editBranding({ negative })}
            />
          )}

          {offers('source') && (
            <Field label="Source" info={explain('source')}>
              {({ id, info }) => (
                <TextInput
                  id={id}
                  description={info}
                  classNames={HIDDEN_DESCRIPTION}
                  placeholder="Each report's own source"
                  value={branding.source}
                  maxLength={SOURCE_MAX_LENGTH}
                  onChange={(event) => editBranding({ source: event.currentTarget.value })}
                />
              )}
            </Field>
          )}
        </FieldGroup>

        {(offers('bar') || offers('line')) && (
          <FieldGroup title="Chart">
            {offers('bar') && (
              <ColourField
                label="Bar colour"
                info={explain('bar')}
                readout="mark"
                fallback={CHART_DEFAULTS.bar}
                fallbackName="brand blue"
                value={branding.bar}
                swatches={CHART_SWATCHES}
                onChange={(bar) => editBranding({ bar })}
              />
            )}

            {offers('line') && (
              <ColourField
                label="Line colour"
                info={explain('line')}
                readout="mark"
                fallback={CHART_DEFAULTS.line}
                fallbackName="chart orange"
                value={branding.line}
                swatches={CHART_SWATCHES}
                onChange={(line) => editBranding({ line })}
              />
            )}
          </FieldGroup>
        )}

        <div className={classes.reset}>
          <Button variant="default" fullWidth onClick={() => resetStyle(offeredStyle(where))}>
            Reset style
          </Button>
          <span className={classes.resetHint}>
            {offers('company') ? 'Keeps your company name and logo.' : 'Keeps your logo.'}
          </span>
        </div>

        <ApplyBar dirty={dirty} closeHeld={closeHeld && dirty} onDone={onDone} />
      </div>
    </SettingsSection>
  );
}
