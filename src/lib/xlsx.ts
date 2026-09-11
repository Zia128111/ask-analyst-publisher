import { strToU8, zipSync } from 'fflate';

/* ============================================================================
 * XLSX WRITER
 * ============================================================================
 * A small, dependency-light writer for Office Open XML workbooks of one
 * sheet or several: the XML parts Excel needs, zipped with fflate. Enough
 * for a published report — typed cells, fonts, fills, rules, number formats,
 * merged title cells, column widths, frozen header rows, an A4 print setup,
 * cells that link out, and native column and line charts drawn from the
 * sheet's own cells — and nothing more.
 *
 * Numbers are written as numbers and dates as Excel date serials, each with a
 * number format, so the workbook computes: a "1,615.29" written as text would
 * look right and sum to nothing.
 *
 * Colours are #rrggbb strings from the design system's tokens or the Report
 * style; the caller passes them in. Point sizes and column widths are Excel's
 * own units. A workbook cannot embed a typeface, so a font is written by
 * name and a reader without it installed sees Excel's substitute; the Normal
 * style stays Calibri 11, which is what column widths are measured in.
 * ========================================================================= */

export type XlsxAlign = 'left' | 'center' | 'right';

export interface XlsxFont {
  /** A typeface name, such as "Lato". Excel's default is Calibri. */
  name?: string;
  /** The OOXML family class: 1 serif (roman), 2 sans-serif (swiss). */
  family?: 1 | 2;
  bold?: boolean;
  italic?: boolean;
  /** A single underline, as a link's text has. */
  underline?: boolean;
  /** Points. Excel's default is 11. */
  size?: number;
  color?: string;
}

export interface XlsxEdge {
  style: 'thin' | 'medium';
  color: string;
}

export interface XlsxStyle {
  font?: XlsxFont;
  /** Solid fill colour. */
  fill?: string;
  top?: XlsxEdge;
  bottom?: XlsxEdge;
  /** An Excel number format code, such as "#,##0.00" or "0.0%". */
  numFmt?: string;
  h?: XlsxAlign;
  v?: 'top' | 'center' | 'bottom';
  wrap?: boolean;
  /** Steps in from the cell's edge, each about three characters wide: a line that details the one above it. */
  indent?: number;
}

/** A Date is written as a date serial and must be UTC midnight of the day. */
export type XlsxValue = string | number | Date | null;

export interface XlsxCell {
  value: XlsxValue;
  /** Index into the workbook's `styles`. */
  style?: number;
}

export interface XlsxRow {
  /** Points. */
  height?: number;
  cells: XlsxCell[];
}

/** A column's run of cells on the sheet, zero-based: column 0 is A, row 0 is 1. */
export interface XlsxRange {
  column: number;
  firstRow: number;
  lastRow: number;
}

/** A value axis's fixed range and step, where Excel must not choose them. */
export interface XlsxAxisScale {
  min: number;
  max: number;
  step: number;
}

/**
 * A second series, drawn as a line: on its own value axis at the chart's
 * other side (a combo — Remittance's total and its change on the year), or
 * on the first series' axis (`axis: 'primary'` — Cement's two regions). The
 * legend then names both series.
 */
export interface XlsxSecondSeries {
  /** Its own axis at the other side (the default), or the first series'. */
  axis?: 'primary' | 'secondary';
  seriesName: string;
  values: XlsxRange;
  cached: (number | null)[];
  /** #rrggbb */
  color: string;
  axisFormat: string;
  /** Fixed, so its gridlines fall on the first axis's. */
  scale?: XlsxAxisScale;
}

/**
 * A chart with one series — columns, or a line — drawn by Excel from the
 * sheet's cells, so it follows any figure the reader changes; optionally a
 * second series, a line on its own axis (`second`). Its categories are its
 * own words (a chart can name a bar more briefly than its table's row does).
 */
export interface XlsxChart {
  /** Columns (the default) or a line. */
  kind?: 'column' | 'line';
  /** The cells it covers, zero-based: from the top-left one to the one past its bottom-right. */
  anchor: { from: { column: number; row: number }; to: { column: number; row: number } };
  /** Its alternative text. */
  description: string;
  /** The series' name, as its legend would show it. */
  seriesName: string;
  categories: string[];
  /** The figures: one cell per category, in order. */
  values: XlsxRange;
  /** The figures as they are now, cached for readers that do not recalculate. */
  cached: (number | null)[];
  /** #rrggbb */
  color: string;
  /** Number format of the labels on the marks; without one the marks carry none. */
  labelFormat?: string;
  /** Number format of the value axis. */
  axisFormat: string;
  axisTitle?: string;
  /** The value axis's range and step, where it must be fixed. */
  scale?: XlsxAxisScale;
  /** A line on a second value axis at the other side. */
  second?: XlsxSecondSeries;
  /** Label every nth category only (Excel's tickLblSkip), where every one would crowd. */
  labelEvery?: number;
  font: { name: string; size: number; color: string };
  /** #rrggbb: the grid lines, the category axis, the chart's ground. */
  gridColor: string;
  axisColor: string;
  background: string;
}

/** A cell that opens a web or mail address when clicked. */
export interface XlsxLink {
  /** "C8" */
  cell: string;
  url: string;
}

/** One worksheet of a workbook. */
export interface XlsxSheet {
  /** The tab's name, at most 31 characters. */
  name: string;
  /** Column widths, in Excel character units. */
  columns: number[];
  rows: XlsxRow[];
  /** Ranges such as "A1:D1". */
  merges?: string[];
  /** Rows kept in view while scrolling, counted from the top. */
  freezeRows?: number;
  showGrid?: boolean;
  /** Printed page orientation; portrait by default. */
  orientation?: 'portrait' | 'landscape';
  charts?: XlsxChart[];
  links?: XlsxLink[];
}

/** A workbook of one sheet: the shape every report's builder used first. */
export interface XlsxWorkbook extends Omit<XlsxSheet, 'name' | 'links'> {
  title: string;
  author: string;
  sheetName: string;
  styles: XlsxStyle[];
}

/** A workbook of several sheets, sharing one style list. */
export interface XlsxBook {
  title: string;
  author: string;
  styles: XlsxStyle[];
  sheets: XlsxSheet[];
}

/**
 * A workbook's style list, built as cells ask for styles: `add` returns a
 * style's index, and a style that repeats is added once.
 */
export function styleRegistry() {
  const list: XlsxStyle[] = [];
  const seen = new Map<string, number>();
  const add = (style: XlsxStyle) => {
    const key = JSON.stringify(style);
    let index = seen.get(key);
    if (index === undefined) {
      index = list.push(style) - 1;
      seen.set(key, index);
    }
    return index;
  };
  return { list, add };
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_CHART = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
const NS_DRAWING = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_SHEET_DRAWING = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** XML 1.0 allows tab, line feed and carriage return below U+0020, and nothing else. */
function xmlAllowed(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 32 || code === 9 || code === 10 || code === 13;
}

/** XML-escape text, dropping the control characters XML 1.0 forbids. */
function esc(text: string): string {
  return [...text]
    .filter(xmlAllowed)
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function argb(hex: string): string {
  const digits = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(digits)) throw new Error(`Expected a #rrggbb colour, got ${hex}`);
  return `FF${digits.toUpperCase()}`;
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

/** Excel counts days from 30 December 1899 (its 1900 leap-year quirk). */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

function dateSerial(date: Date): number {
  return (
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - EXCEL_EPOCH) / DAY_MS
  );
}

/** Built-in format ids, so a common format is not redeclared as a custom one. */
const BUILT_IN_FORMATS: Record<string, number> = {
  '0': 1,
  '0.00': 2,
  '#,##0': 3,
  '#,##0.00': 4,
  '0%': 9,
  '0.00%': 10,
};
const FIRST_CUSTOM_FORMAT = 164;

function stylesXml(styles: XlsxStyle[]): string {
  const fonts = ['<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>'];
  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ];
  const borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
  const customFormats: string[] = [];
  const indexOf = (list: string[], xml: string) => {
    const found = list.indexOf(xml);
    if (found >= 0) return found;
    list.push(xml);
    return list.length - 1;
  };
  const edge = (side: 'top' | 'bottom', e?: XlsxEdge) =>
    e ? `<${side} style="${e.style}"><color rgb="${argb(e.color)}"/></${side}>` : `<${side}/>`;

  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  for (const s of styles) {
    const f = s.font;
    const fontId = f
      ? indexOf(
          fonts,
          /* The schema's order: b, i, … u, … sz, color, name, family. */
          `<font>${f.bold ? '<b/>' : ''}${f.italic ? '<i/>' : ''}${f.underline ? '<u/>' : ''}<sz val="${f.size ?? 11}"/>` +
            `${f.color ? `<color rgb="${argb(f.color)}"/>` : ''}` +
            `<name val="${esc(f.name ?? 'Calibri')}"/><family val="${f.family ?? 2}"/></font>`,
        )
      : 0;
    const fillId = s.fill
      ? indexOf(
          fills,
          `<fill><patternFill patternType="solid"><fgColor rgb="${argb(s.fill)}"/><bgColor indexed="64"/></patternFill></fill>`,
        )
      : 0;
    const borderId =
      s.top || s.bottom
        ? indexOf(borders, `<border><left/><right/>${edge('top', s.top)}${edge('bottom', s.bottom)}<diagonal/></border>`)
        : 0;
    const numFmtId = s.numFmt
      ? (BUILT_IN_FORMATS[s.numFmt] ?? FIRST_CUSTOM_FORMAT + indexOf(customFormats, s.numFmt))
      : 0;
    const alignment =
      s.h || s.v || s.wrap || s.indent
        ? `<alignment${s.h ? ` horizontal="${s.h}"` : ''}${s.v ? ` vertical="${s.v}"` : ''}` +
          `${s.wrap ? ' wrapText="1"' : ''}${s.indent ? ` indent="${s.indent}"` : ''}/>`
        : '';
    const applied =
      `${numFmtId ? ' applyNumberFormat="1"' : ''}${fontId ? ' applyFont="1"' : ''}` +
      `${fillId ? ' applyFill="1"' : ''}${borderId ? ' applyBorder="1"' : ''}${alignment ? ' applyAlignment="1"' : ''}`;
    const open = `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"${applied}`;
    xfs.push(alignment ? `${open}>${alignment}</xf>` : `${open}/>`);
  }

  const numFmts = customFormats.length
    ? `<numFmts count="${customFormats.length}">${customFormats
        .map((code, i) => `<numFmt numFmtId="${FIRST_CUSTOM_FORMAT + i}" formatCode="${esc(code)}"/>`)
        .join('')}</numFmts>`
    : '';

  return (
    `<styleSheet xmlns="${NS_MAIN}">${numFmts}` +
    `<fonts count="${fonts.length}">${fonts.join('')}</fonts>` +
    `<fills count="${fills.length}">${fills.join('')}</fills>` +
    `<borders count="${borders.length}">${borders.join('')}</borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'
  );
}

function cellXml(ref: string, cell: XlsxCell): string {
  const s = cell.style === undefined ? '' : ` s="${cell.style + 1}"`;
  const { value } = cell;
  if (value === null || (typeof value === 'number' && !Number.isFinite(value))) {
    return `<c r="${ref}"${s}/>`;
  }
  if (typeof value === 'number') return `<c r="${ref}"${s}><v>${value}</v></c>`;
  if (value instanceof Date) return `<c r="${ref}"${s}><v>${dateSerial(value)}</v></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

/**
 * A worksheet. Its relationships are numbered as sheetParts numbers them:
 * the drawing first (rId1) when it has charts, then one per link.
 */
function sheetXml(sheet: XlsxSheet, first: boolean): string {
  const lastColumn = columnName(Math.max(sheet.columns.length, ...sheet.rows.map((r) => r.cells.length)) - 1);
  const freeze = sheet.freezeRows
    ? `<pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>` +
      `<selection pane="bottomLeft" activeCell="A${sheet.freezeRows + 1}" sqref="A${sheet.freezeRows + 1}"/>`
    : '';
  const rows = sheet.rows
    .map((row, i) => {
      const r = i + 1;
      const cells = row.cells
        .map((cell, c) => (cell.value === null && cell.style === undefined ? '' : cellXml(`${columnName(c)}${r}`, cell)))
        .join('');
      if (!cells && !row.height) return '';
      const height = row.height ? ` ht="${row.height}" customHeight="1"` : '';
      return cells ? `<row r="${r}"${height}>${cells}</row>` : `<row r="${r}"${height}/>`;
    })
    .join('');
  const merges = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : '';
  const firstLink = sheet.charts?.length ? 2 : 1;
  const links = sheet.links?.length
    ? `<hyperlinks>${sheet.links.map((l, i) => `<hyperlink ref="${l.cell}" r:id="rId${firstLink + i}"/>`).join('')}</hyperlinks>`
    : '';

  return (
    `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    `<dimension ref="A1:${lastColumn}${sheet.rows.length}"/>` +
    `<sheetViews><sheetView${first ? ' tabSelected="1"' : ''} workbookViewId="0"${sheet.showGrid === false ? ' showGridLines="0"' : ''}>${freeze}</sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    `<cols>${sheet.columns.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` +
    `<sheetData>${rows}</sheetData>` +
    merges +
    /* The schema's order: merges, hyperlinks, margins, page setup, drawing. */
    links +
    '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    `<pageSetup paperSize="9" orientation="${sheet.orientation ?? 'portrait'}" fitToWidth="1" fitToHeight="0"/>` +
    (sheet.charts?.length ? '<drawing r:id="rId1"/>' : '') +
    '</worksheet>'
  );
}

/* ----------------------------------------------------------------------------
 * CHARTS — DrawingML, in the element order the schema requires (Excel
 * refuses a chart whose children are out of order, without saying which).
 * ------------------------------------------------------------------------- */

/** A reference to a column's cells, absolute and sheet-qualified: 'FIPI LIPI'!$D$32:$D$40. */
function rangeRef(sheetName: string, range: XlsxRange): string {
  const column = columnName(range.column);
  return `'${sheetName.replace(/'/g, "''")}'!$${column}$${range.firstRow + 1}:$${column}$${range.lastRow + 1}`;
}

/** DrawingML measures lines in EMUs: 12,700 to the point. A hairline is 0.75pt; a series line 2pt. */
const HAIRLINE_EMU = 9525;
const SERIES_LINE_EMU = 25400;
/** The axes' ids, which tie each axis to the chart and to the other; a second series has its own pair. */
const CATEGORY_AXIS = 500100;
const VALUE_AXIS = 500200;
const SECOND_CATEGORY_AXIS = 500300;
const SECOND_VALUE_AXIS = 500400;

/** An axis's scaling: Excel's choice, or a fixed range. The schema puts max before min. */
const scaling = (scale?: XlsxAxisScale) =>
  '<c:scaling><c:orientation val="minMax"/>' +
  (scale ? `<c:max val="${scale.max}"/><c:min val="${scale.min}"/>` : '') +
  '</c:scaling>';
const majorUnit = (scale?: XlsxAxisScale) => (scale ? `<c:majorUnit val="${scale.step}"/>` : '');

function chartXml(sheetName: string, chart: XlsxChart): string {
  const rgb = (hex: string) => argb(hex).slice(2);
  const solid = (hex: string) => `<a:solidFill><a:srgbClr val="${rgb(hex)}"/></a:solidFill>`;
  const hairline = (hex: string) => `<a:ln w="${HAIRLINE_EMU}">${solid(hex)}</a:ln>`;
  const noLine = '<a:ln><a:noFill/></a:ln>';
  const { font } = chart;
  /* Text sizes are hundredths of a point. */
  const face = `sz="${Math.round(font.size * 100)}" b="0">${solid(font.color)}<a:latin typeface="${esc(font.name)}"/>`;
  const text = `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr ${face}</a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>`;
  const count = chart.categories.length;

  const axisTitle = chart.axisTitle
    ? '<c:title><c:tx><c:rich><a:bodyPr rot="-5400000" vert="horz"/><a:lstStyle/>' +
      `<a:p><a:pPr><a:defRPr ${face}</a:defRPr></a:pPr><a:r><a:rPr lang="en-US" ${face}</a:rPr><a:t>${esc(chart.axisTitle)}</a:t></a:r></a:p>` +
      '</c:rich></c:tx><c:overlay val="0"/></c:title>'
    : '';

  const categories =
    `<c:cat><c:strLit><c:ptCount val="${count}"/>` +
    chart.categories.map((label, i) => `<c:pt idx="${i}"><c:v>${esc(label)}</c:v></c:pt>`).join('') +
    '</c:strLit></c:cat>';

  const valuesOf = (range: XlsxRange, cached: (number | null)[]) =>
    `<c:val><c:numRef><c:f>${esc(rangeRef(sheetName, range))}</c:f>` +
    `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${count}"/>` +
    cached.map((v, i) => (v === null ? '' : `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`)).join('') +
    '</c:numCache></c:numRef></c:val>';
  const values = valuesOf(chart.values, chart.cached);
  const { second } = chart;

  const line = chart.kind === 'line';

  /* A line's labels sit over its points; a column's past its end. */
  const labels = chart.labelFormat
    ? `<c:dLbls><c:numFmt formatCode="${esc(chart.labelFormat)}" sourceLinked="0"/>` +
      `<c:spPr><a:noFill/>${noLine}</c:spPr>${text}<c:dLblPos val="${line ? 't' : 'outEnd'}"/>` +
      '<c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/>' +
      '<c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
    : '';

  const name = `<c:tx><c:v>${esc(chart.seriesName)}</c:v></c:tx>`;
  const axes = `<c:axId val="${CATEGORY_AXIS}"/><c:axId val="${VALUE_AXIS}"/>`;

  /* The second series, always a line; on the first's axis, or its own. */
  const onFirstAxis = second?.axis === 'primary';
  const secondSeries = second
    ? '<c:ser><c:idx val="1"/><c:order val="1"/>' +
      `<c:tx><c:v>${esc(second.seriesName)}</c:v></c:tx>` +
      `<c:spPr><a:ln w="${SERIES_LINE_EMU}" cap="rnd">${solid(second.color)}<a:round/></a:ln></c:spPr>` +
      '<c:marker><c:symbol val="none"/></c:marker>' +
      categories +
      valuesOf(second.values, second.cached) +
      '<c:smooth val="0"/></c:ser>'
    : '';
  /* Two lines on one axis share the line group; otherwise it has its own. */
  const secondInPlot = line && onFirstAxis;

  const plot = line
    ? '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' +
      '<c:ser><c:idx val="0"/><c:order val="0"/>' +
      name +
      `<c:spPr><a:ln w="${SERIES_LINE_EMU}" cap="rnd">${solid(chart.color)}<a:round/></a:ln></c:spPr>` +
      '<c:marker><c:symbol val="none"/></c:marker>' +
      labels +
      categories +
      values +
      '<c:smooth val="0"/></c:ser>' +
      (secondInPlot ? secondSeries : '') +
      `<c:marker val="1"/>${axes}</c:lineChart>`
    : '<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>' +
      '<c:ser><c:idx val="0"/><c:order val="0"/>' +
      name +
      `<c:spPr>${solid(chart.color)}${noLine}</c:spPr><c:invertIfNegative val="0"/>` +
      labels +
      categories +
      values +
      '</c:ser>' +
      `<c:gapWidth val="80"/>${axes}</c:barChart>`;

  /* Otherwise the second series is a line group of its own: over the
     columns on their axes, or on its own pair — the category axis hidden
     (it is the first's), the value axis at the right, crossing at the
     categories' far end. */
  const secondPlot =
    second && !secondInPlot
      ? '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' +
        secondSeries +
        '<c:marker val="1"/>' +
        (onFirstAxis ? axes : `<c:axId val="${SECOND_CATEGORY_AXIS}"/><c:axId val="${SECOND_VALUE_AXIS}"/>`) +
        '</c:lineChart>'
      : '';
  const secondAxes =
    second && !onFirstAxis
      ? `<c:catAx><c:axId val="${SECOND_CATEGORY_AXIS}"/>${scaling()}<c:delete val="1"/>` +
      '<c:axPos val="b"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>' +
      `<c:crossAx val="${SECOND_VALUE_AXIS}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/>` +
      '<c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>' +
      `<c:valAx><c:axId val="${SECOND_VALUE_AXIS}"/>${scaling(second.scale)}<c:delete val="0"/>` +
      `<c:axPos val="r"/><c:numFmt formatCode="${esc(second.axisFormat)}" sourceLinked="0"/>` +
      '<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>' +
      `<c:spPr>${noLine}</c:spPr>${text}` +
      `<c:crossAx val="${SECOND_CATEGORY_AXIS}"/><c:crosses val="max"/><c:crossBetween val="between"/>` +
      `${majorUnit(second.scale)}</c:valAx>`
    : '';
  /* Two series want naming: the legend under the plot, as on the sheet. */
  const legend = second ? `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${text}</c:legend>` : '';

  return (
    `<c:chartSpace xmlns:c="${NS_CHART}" xmlns:a="${NS_DRAWING}" xmlns:r="${NS_REL}">` +
    '<c:roundedCorners val="0"/>' +
    '<c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout/>' +
    plot +
    secondPlot +
    /* The categories along the foot, under negative bars too ("low"). */
    `<c:catAx><c:axId val="${CATEGORY_AXIS}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/>` +
    '<c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/>' +
    '<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/>' +
    `<c:spPr>${hairline(chart.axisColor)}</c:spPr>${text}` +
    `<c:crossAx val="${VALUE_AXIS}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/>` +
    `<c:lblOffset val="100"/>${chart.labelEvery ? `<c:tickLblSkip val="${chart.labelEvery}"/>` : ''}` +
    '<c:noMultiLvlLbl val="0"/></c:catAx>' +
    `<c:valAx><c:axId val="${VALUE_AXIS}"/>${scaling(chart.scale)}<c:delete val="0"/>` +
    `<c:axPos val="l"/><c:majorGridlines><c:spPr>${hairline(chart.gridColor)}</c:spPr></c:majorGridlines>` +
    axisTitle +
    `<c:numFmt formatCode="${esc(chart.axisFormat)}" sourceLinked="0"/>` +
    '<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>' +
    `<c:spPr>${noLine}</c:spPr>${text}` +
    `<c:crossAx val="${CATEGORY_AXIS}"/><c:crosses val="autoZero"/><c:crossBetween val="between"/>` +
    `${majorUnit(chart.scale)}</c:valAx>` +
    secondAxes +
    `<c:spPr><a:noFill/>${noLine}</c:spPr>` +
    `</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>` +
    `<c:spPr>${solid(chart.background)}${noLine}</c:spPr>` +
    text +
    '</c:chartSpace>'
  );
}

/** The sheet's drawing: each chart in the cells it covers, moving with them. */
function drawingXml(charts: XlsxChart[]): string {
  const at = (tag: 'from' | 'to', { column, row }: { column: number; row: number }) =>
    `<xdr:${tag}><xdr:col>${column}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:${tag}>`;
  return (
    `<xdr:wsDr xmlns:xdr="${NS_SHEET_DRAWING}" xmlns:a="${NS_DRAWING}">` +
    charts
      .map(
        (chart, i) =>
          '<xdr:twoCellAnchor>' +
          at('from', chart.anchor.from) +
          at('to', chart.anchor.to) +
          '<xdr:graphicFrame macro="">' +
          `<xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Chart ${i + 1}" descr="${esc(chart.description)}"/>` +
          '<xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>' +
          '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>' +
          `<a:graphic><a:graphicData uri="${NS_CHART}">` +
          `<c:chart xmlns:c="${NS_CHART}" xmlns:r="${NS_REL}" r:id="rId${i + 1}"/>` +
          '</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>',
      )
      .join('') +
    '</xdr:wsDr>'
  );
}

const CONTENT_TYPE = {
  worksheet: 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
  drawing: 'application/vnd.openxmlformats-officedocument.drawing+xml',
  chart: 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
} as const;

/**
 * The parts sheet `n` writes: the sheet, and where it has charts or links
 * its relationships — the drawing first (rId1), then one per link, each an
 * external target — its drawing and the drawing's charts, numbered on from
 * `firstChart` across the workbook.
 */
function sheetParts(sheet: XlsxSheet, n: number, firstChart: number): { parts: Record<string, string>; types: string } {
  const charts = sheet.charts ?? [];
  const links = sheet.links ?? [];
  const parts: Record<string, string> = { [`xl/worksheets/sheet${n}.xml`]: sheetXml(sheet, n === 1) };
  let types = `<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="${CONTENT_TYPE.worksheet}"/>`;

  const relationships = [
    ...(charts.length ? [`<Relationship Id="rId1" Type="${REL_TYPE}/drawing" Target="../drawings/drawing${n}.xml"/>`] : []),
    ...links.map(
      (l, i) =>
        `<Relationship Id="rId${(charts.length ? 2 : 1) + i}" Type="${REL_TYPE}/hyperlink" ` +
        `Target="${esc(l.url)}" TargetMode="External"/>`,
    ),
  ];
  if (relationships.length) {
    parts[`xl/worksheets/_rels/sheet${n}.xml.rels`] = `<Relationships xmlns="${NS_PKG_REL}">${relationships.join('')}</Relationships>`;
  }

  if (charts.length) {
    parts[`xl/drawings/drawing${n}.xml`] = drawingXml(charts);
    parts[`xl/drawings/_rels/drawing${n}.xml.rels`] =
      `<Relationships xmlns="${NS_PKG_REL}">` +
      charts
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL_TYPE}/chart" Target="../charts/chart${firstChart + i}.xml"/>`)
        .join('') +
      '</Relationships>';
    types += `<Override PartName="/xl/drawings/drawing${n}.xml" ContentType="${CONTENT_TYPE.drawing}"/>`;
    charts.forEach((chart, i) => {
      parts[`xl/charts/chart${firstChart + i}.xml`] = chartXml(sheet.name, chart);
      types += `<Override PartName="/xl/charts/chart${firstChart + i}.xml" ContentType="${CONTENT_TYPE.chart}"/>`;
    });
  }
  return { parts, types };
}

/** A one-sheet workbook's sheet, as the several-sheet shape has it. */
const sheetsOf = (book: XlsxWorkbook | XlsxBook): XlsxSheet[] =>
  'sheets' in book
    ? book.sheets
    : [
        {
          name: book.sheetName,
          columns: book.columns,
          rows: book.rows,
          merges: book.merges,
          freezeRows: book.freezeRows,
          showGrid: book.showGrid,
          orientation: book.orientation,
          charts: book.charts,
        },
      ];

/** The workbook as .xlsx bytes. Wrap in a Blob with XLSX_MIME to save it. */
export function buildXlsx(book: XlsxWorkbook | XlsxBook): Uint8Array {
  const created = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const sheets = sheetsOf(book);

  let nextChart = 1;
  const written = sheets.map((sheet, i) => {
    const part = sheetParts(sheet, i + 1, nextChart);
    nextChart += sheet.charts?.length ?? 0;
    return part;
  });

  const parts: Record<string, string> = {
    '[Content_Types].xml':
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      written.map((w) => w.types).join('') +
      '</Types>',
    '_rels/.rels':
      `<Relationships xmlns="${NS_PKG_REL}">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '</Relationships>',
    'docProps/core.xml':
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
      'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      `<dc:title>${esc(book.title)}</dc:title><dc:creator>${esc(book.author)}</dc:creator>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>` +
      '</cp:coreProperties>',
    'xl/workbook.xml':
      `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}"><sheets>` +
      sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
      '</sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      `<Relationships xmlns="${NS_PKG_REL}">` +
      sheets
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL_TYPE}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="${REL_TYPE}/styles" Target="styles.xml"/>` +
      '</Relationships>',
    'xl/styles.xml': stylesXml(book.styles),
    ...Object.assign({}, ...written.map((w) => w.parts)),
  };

  return zipSync(
    Object.fromEntries(Object.entries(parts).map(([path, xml]) => [path, strToU8(XML_DECLARATION + xml)])),
    { level: 6 },
  );
}
