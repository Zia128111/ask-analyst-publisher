import { tokens } from '@akseer/ask-analyst-design-system/tokens';

/* ============================================================================
 * REPORT STYLE — the white-label settings
 * ============================================================================
 * What a publisher can change about how its reports look, from the account
 * drawer: the typeface, the size of the table's text, the colour of the
 * rules, of the tinted fills and of negative figures, a chart's colours, the
 * source line, and a company logo the masthead toggle can print the sheet
 * under.
 *
 * Every setting has a design-system default, and `null` or '' means "use
 * it", so a sheet nobody has styled renders exactly as before and follows
 * the colour scheme through the system's semantic tokens. A chosen colour is
 * the publisher's brand colour and stays the same in both schemes.
 * ========================================================================= */

export type ReportFontId =
  | 'lato'
  | 'inter'
  | 'roboto'
  | 'open-sans'
  | 'source-sans'
  | 'ibm-plex-sans'
  | 'source-serif';

export interface ReportFont {
  id: ReportFontId;
  label: string;
  /** CSS font-family for the sheet. Null keeps the design system's Lato. */
  stack: string | null;
  /** The name written into the Excel workbook. */
  excelName: string;
  /** OOXML font family class: 2 is sans-serif (swiss), 1 is serif (roman). */
  excelFamily: 1 | 2;
}

/*
 * Self-hosted, OFL-1.1, loaded in src/branding/fonts.ts. Each has real
 * italics — the design system turns synthesis off, so a missing italic would
 * print the source line upright — and tabular figures, which every numeric
 * column needs. Lato stays in each stack as the fallback, so a face that
 * fails to load degrades to the system's own type, not to a browser default.
 * The PNG and PDF embed the same files, so a download matches the screen.
 */
export const REPORT_FONTS: readonly ReportFont[] = [
  { id: 'lato', label: 'Lato', stack: null, excelName: 'Lato', excelFamily: 2 },
  {
    id: 'inter',
    label: 'Inter',
    stack: "'Inter Variable', 'Lato', sans-serif",
    excelName: 'Inter',
    excelFamily: 2,
  },
  {
    id: 'roboto',
    label: 'Roboto',
    stack: "'Roboto Variable', 'Lato', sans-serif",
    excelName: 'Roboto',
    excelFamily: 2,
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    stack: "'Open Sans Variable', 'Lato', sans-serif",
    excelName: 'Open Sans',
    excelFamily: 2,
  },
  {
    id: 'source-sans',
    label: 'Source Sans 3',
    stack: "'Source Sans 3 Variable', 'Lato', sans-serif",
    excelName: 'Source Sans 3',
    excelFamily: 2,
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    stack: "'IBM Plex Sans', 'Lato', sans-serif",
    excelName: 'IBM Plex Sans',
    excelFamily: 2,
  },
  {
    id: 'source-serif',
    label: 'Source Serif 4',
    stack: "'Source Serif 4 Variable', 'Lato', serif",
    excelName: 'Source Serif 4',
    excelFamily: 1,
  },
];

export const fontById = (id: ReportFontId): ReportFont =>
  REPORT_FONTS.find((f) => f.id === id) ?? REPORT_FONTS[0];

/**
 * The face's family name alone, for a chart, which takes one name rather than
 * a CSS stack: "'Inter Variable', 'Lato', sans-serif" -> "Inter Variable";
 * Lato when unset.
 */
export const familyName = (id: ReportFontId): string =>
  fontById(id).stack?.split(',')[0].replace(/['"]/g, '').trim() || 'Lato';

export type ReportSize = 'standard' | 'large' | 'larger';

export interface ReportSizeSpec {
  label: string;
  /** The table's text, a step on the design system's type scale. */
  text: string;
  /**
   * Grid columns the sheet spans. Larger figures need wider columns, so the
   * sheet widens by a column per step rather than making its table scroll —
   * and the downloads, made at the sheet's width, keep every column.
   */
  columns: number;
  /** The same step in the workbook: points, row heights, column widths. */
  excel: { size: number; row: number; header: number; widthScale: number };
}

/*
 * 14px is the system's dense-table size and the floor for figures (12px is
 * for labels, never data), so the steps go up from it: 14, 16 and 18px.
 */
export const REPORT_SIZES: Record<ReportSize, ReportSizeSpec> = {
  standard: {
    label: 'Standard',
    text: 'var(--ask-font-xs)',
    columns: 7,
    excel: { size: 11, row: 18, header: 32, widthScale: 1 },
  },
  large: {
    label: 'Large',
    text: 'var(--ask-font-sm)',
    columns: 8,
    excel: { size: 12, row: 20, header: 36, widthScale: 1.1 },
  },
  larger: {
    label: 'Larger',
    text: 'var(--ask-font-md)',
    columns: 9,
    excel: { size: 14, row: 23, header: 40, widthScale: 1.25 },
  },
};

export const REPORT_SIZE_ORDER: readonly ReportSize[] = ['standard', 'large', 'larger'];

export interface Branding {
  font: ReportFontId;
  size: ReportSize;
  /** Table rules, as #rrggbb. Null keeps the design system's brand blue. */
  rule: string | null;
  /** Letterhead bands and table header, as #rrggbb. Null keeps the brand tint. */
  fill: string | null;
  /**
   * The current-period columns of a report that highlights them (Latest
   * Result: the latest quarter and the period to date), as #rrggbb. Null
   * follows the fill.
   */
  highlight: string | null;
  /**
   * Negative figures in a report that colours them (BOP), as #rrggbb. Null
   * keeps the design system's negative red. The parentheses carry the sign
   * either way; the colour is emphasis, never the only signal.
   */
  negative: string | null;
  /** A report chart's bars (BOP), as #rrggbb. Null keeps the chart palette's first colour. */
  bar: string | null;
  /** A report chart's line (BOP: the fiscal year to date), as #rrggbb. Null keeps the palette's second. */
  line: string | null;
  /** Replaces every report's own source line. '' keeps each report's. */
  source: string;
  /**
   * The publishing company. Replaces the publisher's name on the letterhead
   * band and in the downloads, and names the logo: its alt text, its label
   * on the masthead toggle. '' keeps the publisher's own name.
   */
  company: string;
  /** The uploaded logo as a base64 data: URL, or null for none. */
  logo: string | null;
}

export const DEFAULT_BRANDING: Branding = {
  font: 'lato',
  size: 'standard',
  rule: null,
  fill: null,
  highlight: null,
  negative: null,
  bar: null,
  line: null,
  source: '',
  company: '',
  logo: null,
};

/** The settings "Reset style" puts back. The logo and the company name stay. */
export const DEFAULT_STYLE: Pick<
  Branding,
  'font' | 'size' | 'rule' | 'fill' | 'highlight' | 'negative' | 'bar' | 'line' | 'source'
> = {
  font: DEFAULT_BRANDING.font,
  size: DEFAULT_BRANDING.size,
  rule: DEFAULT_BRANDING.rule,
  fill: DEFAULT_BRANDING.fill,
  highlight: DEFAULT_BRANDING.highlight,
  negative: DEFAULT_BRANDING.negative,
  bar: DEFAULT_BRANDING.bar,
  line: DEFAULT_BRANDING.line,
  source: DEFAULT_BRANDING.source,
};

/*
 * What an unset chart colour means: the design system's categorical palette
 * in its fixed order, blue then orange — the pair it also uses as its
 * colour-blind-safe diverging colours. Google Charts takes literal colours,
 * and the palette is the same in both schemes.
 */
export const CHART_DEFAULTS = {
  bar: tokens.chartCategorical[0],
  line: tokens.chartCategorical[1],
} as const;

/*
 * The name sits on the publisher band, 404px of text at 16px bold. A
 * realistic 41-character name measures 293–334px across the seven faces, so
 * 48 characters stays on one line in every face; an unusually wide name (all
 * capitals, say) wraps onto a second line rather than being cut.
 */
export const COMPANY_MAX_LENGTH = 48;
export const SOURCE_MAX_LENGTH = 160;

/** The masthead toggle's label for the uploaded logo. */
export const customMastheadLabel = (company: string): string => company.trim() || 'Your logo';

/** The uploaded logo's alt text. */
export const customLogoAlt = (company: string): string => company.trim() || 'Company logo';
