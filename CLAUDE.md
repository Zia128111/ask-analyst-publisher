# Ask Analyst — Publisher

The Publisher module of Ask Analyst: where a research house creates its
account, signs in and (next) manages what it publishes. Built on the Ask
Analyst Design System.

UI follows the design system's rules. They are not style preferences — each one
encodes a mistake that shipped in v1.0.

@./node_modules/@akseer/ask-analyst-design-system/CLAUDE.md

## Architecture

Next.js App Router. `app/` holds the routes; everything reusable is in `src/`.

- `app/layout.tsx` (server) wires Mantine's SSR helpers and the stylesheet
  order. `app/providers.tsx` (client) holds the context providers.
- `app/(auth)/` is a route group. Its `layout.tsx` renders the shared
  `AuthLayout` once, so `/sign-in`, `/sign-up` and `/forgot-password` swap only
  the form and the brand panel persists. Each `page.tsx` is a server component
  that owns its `metadata` and renders a client view from `src/views/auth/`.
- `app/(app)/[edition]/[publication]/` is every inner page: one route for all
  fifteen publications in every edition (`/askanalyst/mts`,
  `/alphacapital/bop`). The `[edition]` layout renders `AppShell` once, so the
  header and tabs persist while the sheet swaps. `generateStaticParams` plus
  `dynamicParams = false` means only catalogue pairs exist; `/ksa/mts` is a
  404 because KSA does not carry MTS. `/askanalyst` redirects to its first
  publication. Sign-in lands on `/askanalyst/mts`.
- `app/page.tsx` redirects to `/sign-in`. Once sessions exist it becomes the
  check that sends a signed-in reader to the inner pages instead.
- **`src/pages/` is a forbidden name.** Next treats it as the Pages Router and
  refuses to build alongside `app/`. Page-level components live in `src/views/`.
- Anything with state, effects or Mantine interactive components needs
  `'use client'`. The design system's bundle already carries its own banner.

## Inner pages (publications)

- **`src/data/` is the only place that knows where data comes from.**
  `publications.ts` is the catalogue (editions, the fifteen publications,
  which are built); `mts.ts` is the MTS fixture, transcribed from the live
  page and checked row for row; `latestResult.ts` the Latest Result fixture,
  `bop.ts` the BOP one, `omc.ts` Oil Marketing's, `tradePbs.ts` and
  `tradeSbp.ts` the two trade sheets', `remittance.ts` Remittance's,
  `centralGovernmentDebt.ts` Central Government Debt's (below), the last six
  on the helpers every MONTHLY feed shares (`monthly.ts`); `portfolio.ts`
  Portfolio Investment's, `settlement.ts` Settlement's, `cement.ts` Cement's,
  `fertilizer.ts` Fertilizer's and `auto.ts` Auto's (on the monthly
  helpers too), `currency.ts` Currency's, and `disclaimer.ts` the legal
  pages and furniture
  the PDFs print. `morningBriefing.ts` is the one accessor that READS ITS
  LIVE FEED (below), with its transcribed copy as the fallback. Accessors are
  `async` and return wire shapes. Numeric fields are `number | null`;
  `null` renders as `NOT_AVAILABLE`.
- **Monthly reports share one table.** BOP, Oil Marketing, Trade-PBS,
  Trade-SBP, Remittance, Central Government Debt and Auto are the same shape
  (the change headings may read "MoM %", "YoY %", "FYTD %" — an FYTD change
  compares with the column before the current one, as MoM does): the month a year ago, last month, this
  month, MoM, YoY, and from August the fiscal year to date then and now and
  its YoY (Auto's feed has no year to date at all). A new monthly feed may
  well be too — check it before reusing. They
  share `MonthlyReport`/`MonthlyColumn`/`MonthlyRow` (types.ts),
  `monthlyColumns` (kinds, current columns and what each change compares,
  from the headings alone), `parseFigure` ("1,300", "-16%", "NM", "-") and
  `groupLines` (monthly.ts) — or `outlineLines`, for a feed that indents
  its lines and bolds for emphasis (the trade feeds) — and for the `msg/`
  feeds (msg/bop, msg/pbs, msg/trade …) `msgHeadings` (the year to date
  left out in July) and `feedDate`, and for outlined rows `outlineRow` (a
  line's indent from its `step`, a heading or a spacer from blank cells;
  labels verbatim — Trade-PBS alone capitalises its "knitwear"), with
  `msgRows` (a fixture's lines) and `msgRow` for msg/pbs's row keys; `MonthlyTable` + `monthlyCaption`, and
  `buildMonthlyWorkbook`. A row may be a step in (`indent`), a section's
  name with no figures (`heading`) or a blank line between sections
  (`spacer`: drawn, hidden from screen readers); a report may publish its
  changes to one decimal (`changeDecimals`). What a sheet sets off follows
  its benchmark, in one `MonthlyLook` for the table and the workbook
  (`monthlyLook.ts`): BOP and Oil Marketing tint the current columns and
  colour negative amounts (`MONTHLY_LOOK`); the sheets `MonthlyView` lays
  out (Trade-PBS, Trade-SBP, Central Government Debt, Fertilizer, Auto) set theirs in its
  `SHEETS`, with each one's grid width and, where the title names the
  table's month, its title — labels on one line, negatives in ink,
  Trade-PBS tinting nothing, the others the current columns, Trade-SBP
  leaving the heading over the labels blank because its title carries the
  unit (`unitsInTitle`). A new table-only monthly tab = its fixture on
  these, an entry in `MonthlyView`'s `SHEETS` and the route's
  `MONTHLY_SHEETS`, and a placement entry.
  The live site's other feeds are listed in memory
  (`reference-askanalyst-api`).
- **Adding a publication** = a fixture in `src/data/`, a view in `src/views/`,
  its slug in `BUILT_PUBLICATIONS` (and `PENDING_IN_EDITION` for an edition
  whose report of that name is a different one — `isBuilt(edition, slug)`:
  KSA's Morning Briefing), and a branch in the route's `page.tsx`;
  an entry in `src/branding/placement.ts` if its sheet offers different
  Report style settings from MTS. Views share `useMasthead` (which logo,
  who publishes) and `sheetDownloads` (the three formats). Until then its
  tab opens `PendingPublicationView`, never a 404.
- **Three navigations, three jobs.** Header links = editions (URL segment);
  underline tabs = publications (URL segment, links in a `<nav>`, NOT the
  Tabs component, because each is its own page); the toggle above the sheet
  = masthead (local state, swaps only the logo). Switching edition keeps the
  reader on the same publication when the other edition carries it.
- **The tabs are one row** and fit from a 1280px screen up (12px semibold,
  the design system's nav-item type; padding closes one step below 1440px).
  Narrower, they scroll with a visible thin scrollbar on desktop and a swipe
  on phones, and the current tab scrolls into view. A sixteenth tab will not
  fit at 1280 — re-measure if one is added.
- **`ReportSheet` is the letterhead for every publication**: publisher band,
  date, title band (the page's one `<h1>`), masthead logo, body, italic
  source line. No card frame, as in the benchmark. Seven grid columns wide
  (750px), derived from the grid tokens; the Report style's larger text sizes
  widen it to eight and nine (`--report-columns`). A report about one
  company passes its own `letterhead` instead of the bands
  (`CompanyLetterhead`): same sheet, measure, typeface and source line.
- **The MTS page fits one screen** (the sheet ends at 883px in a 1920×960
  pane): the table uses the design system's `data-density="compact"`, and
  where `text-box` is supported, cap-trimmed cells with 8px padding (27px
  rows). Adding rows or letterhead height means re-measuring.
- **The MTS table copies the benchmark exactly** at the user's request: tinted
  header between two blue rules, two-line labels, figures centred, the
  trailing "Symbol" column whose every value is "A" carried verbatim
  (`trailingSymbol`; its meaning is unconfirmed). Design-system rules it still
  keeps: tabular figures, the formatters, 14px body type, bidi isolation, the
  two "Value (PKR Mn)" headings aria-labelled by group. Centred figures are a
  deliberate departure from the system's end-aligned numeric columns.
- **Masthead logos**: Alpha Capital = `public/brand/alpha-akseer-ren.svg`,
  the supplied file, byte-identical, which draws both SECP registrations
  (Alpha Capital REP-004, Akseer REP-400 R) as paths; the alt text carries
  them. `alpha-akseer-ren-dark.svg` is DERIVED (black and navy fills set to
  white) because no dark variant was supplied — replace it when one is. Ask
  Analyst = the design system's `Logo`.
- **Download is a menu: PNG, PDF, Excel** (`DownloadMenu`). PNG and PDF are
  pictures of the sheet rendered from `ExportStage` — an off-screen copy
  mounted only while exporting, always full width (the sheet's measure plus a
  16px margin: 782px at seven columns) and always LIGHT (every semantic token
  overridden inline), so exports from dark mode are white reports and nothing
  on screen moves. PNG is 2×; PDF is one A4
  page at 3× via `jspdf` (image PDF: figures not selectable). Excel is built
  from the DATA by `src/exports/mtsWorkbook.ts` on the small OOXML writer in
  `src/lib/xlsx.ts` (fflate): real numbers with the sheet's precision as number
  formats, rate stored as a fraction, frozen header, gridlines off. It imports
  only the DS `/tokens` entry so it runs in Node; it was validated by opening
  the output in Excel 16 and reading values, formats, fills, merges back.
  The writer also draws native charts from the sheet's own cells (`charts`:
  columns for Portfolio Investment; columns with a line on a second axis,
  `second`, and fixed `scale`s for Remittance; two lines on one axis,
  `second.axis: 'primary'`, for Cement), writes several sheets
  (`XlsxBook`) and cells that link out (`links`, the Morning Briefing's
  stories). All three libraries load only when their format is chosen. A
  sheet with a chart INSIDE it (Remittance) draws it again in the export
  copy; the picture waits until every `[data-chart]` frame there says
  `data-ready` (Google's ready event), up to 8s. `sheetDownloads` takes
  extensions for reports that export more than one sheet: `morePictures`
  (further PNG files from the one PNG choice), `buildPdf` (a PDF laid out
  round the sheet's picture) and `pdfStage` (a copy laid out for the PDF's
  page). `capturePng` returns the picture's link boxes (`links`), so a PDF
  can keep them clickable.
- **Masthead logos span the letterhead exactly**: `--letterhead-block` in
  `ReportSheet.module.css` is the text block's height from tokens (band
  28px + date line + title band 32px + gaps = 84.8px); every logo takes it.
  Change a band and the logo follows. The sheet is a size container, so the
  letterhead responds to the sheet's width (the export copy never stacks).
- **The logo box — the user's rules, stated three times**: every logo,
  built-in or uploaded, lives in one closed box beside the bands, 84.8px
  tall and at most three grid columns (310px) wide (`Masthead.module.css`).
  HEIGHT is the fixed dimension: a logo is drawn at full height and its
  width follows its proportions; only a logo wider than the box at that
  height (over about 3.7:1) is scaled down to the box's width, proportions
  intact. Never stretch a logo, never let it leave the box on the desktop
  sheet, and NEVER squeeze the text on the left for it: the bands keep their
  four columns (`flex: 0 0`), the box never shrinks (`flex: none`). On a
  sheet too narrow for both, the letterhead wraps the logo ABOVE the bands
  (`wrap-reverse`) at full height; below 640px it stacks. The cap sits on the
  box as well as the image — a flex item sizes from its content and ignores
  the image's percentage max-width, so a wide logo once made the box claim
  1,000px and crushed the bands.
- **Optical centring**: Lato's metrics put capitals ~1–2px high in any line
  box (measured). Bands, table cells, header cells, the toggle and the
  Download label use `text-box: trim-both cap alphabetic` with even padding;
  measured 8.5/8.5px in rows. Table padding changes only under
  `@supports`, so unsupported browsers keep the compact rows. The design
  system fixed Lato itself in v1.3.4, but keep the trim: it centres whatever
  face the Report style picks, and those faces have their own metrics.
- **Account drawer** (`AccountMenu`) holds the colour-scheme toggle behind the
  avatar, the same drawer pattern as the auth pages' burger, and the Report
  style below it. `AppShell` passes it the publication in view, which sets
  what the Report style offers (below).

## Latest Result

One listed company's last published P&L summary (`LatestResultView`),
recreated from the user's LUCK benchmark:

- **The company is in the URL**: `?company=EFERT`. The route reads it only in
  the latest-result branch, so those two pages render per request (`ƒ` in
  the build) while every other publication stays prerendered; the result is
  fetched on the server and the figures are in the HTML. The search does
  `router.replace` in a transition: it shows the new company at once, its
  icon turns to a spinner, the sheet is `aria-busy`, and a status line says
  "Showing …". No parameter = LUCK; an unlisted ticker redirects to the page
  without one. The tab title names the ticker.
- **Data** (`src/data/latestResult.ts`): TEN companies transcribed on 10 Sep
  2026 from what the live page loads — `api.askanalyst.com.pk/api/
  companylistwithids` (361 companies there), `/api/result/{id}` (rows of
  label, bold flag, ten `{year, value}` cells, values as strings) and the
  share price its letterhead prints (`/api/shareprice` answers a plain GET
  with HTML). The feed's shape is kept, one `label|bold|values` line per
  row, and normalised in that file only. Rows and columns are the
  company's own: a bank has mark-up and provisions (Meezan, 23 rows, with
  " - " sub-items as published), June year-ends report 4QFY26/FY26,
  calendar years 2QCY26/1HCY26, PSO 3QFY26/9MFY26. Every price is down on
  the day, so the up colour is untested with real data.
- **Search** (`CompanySearch`): Mantine Select, searchable, every company in
  a list that scrolls (about 5½ options tall), ticker over name, check on the
  chosen one; matches ticker or name, ticker-prefix matches first;
  "No companies found". A visible "Company" label (§8.5: never placeholder
  alone), above the field — the user liked that spacing and uses it as the
  drawer's label-to-field gap. The live page's company logos in the options
  are not copied (third-party artwork, not supplied).
- **Letterhead** (`CompanyLetterhead`): ticker and name as the `<h1>` (read
  "Latest Result: LUCK, Lucky Cement Ltd"), units line; price block on the
  fourth grid column: close, change with the design system's arrow +
  direction colour + hidden word, date. Logo box = the text block
  (`--letterhead-block` 57.6px), same box rules.
- **Table** (`ResultTable`): thin rules (header included, unlike MTS),
  tinted header, current quarter and period to date tinted down the table
  (`current` columns), totals bold, labels start and figures end, flush with
  the sheet's edges. Negatives in parentheses need `signStyle: 'parens'`:
  the DS `formatNumber` defaults to a minus despite its comment. Precision
  is a RULE (`src/data/resultPrecision.ts`): amounts 0, changes 1, EPS 2 a
  quarter / 1 to date (the feed rounds FY EPS), DPS 2 — because the feed
  sometimes drops zeros ("1.9" beside "1.81") and the live page drops them
  all ("10", "4"). Change headings carry aria-labels ("4QFY26 on 4QFY25, %
  change"). DPS QoQ after a zero quarter shows 0.0, as the feed publishes
  it (the change is really undefined) — carried, not corrected.
- **Full grid**: the sheet is 12 columns (1300px, `--report-columns: 12` on
  the view), so text sizes wrap labels instead of widening it. LUCK ends at
  862px; Meezan's 23 rows run past one screen and the user said that is
  fine — do NOT squeeze the layout to make long statements fit. Spacing
  after the benchmark (`.roomy`): 24px search → switch row, 16px → sheet;
  MTS keeps its 8px (its largest text size fills 960px to within 8px).
- **Downloads**: PNG 2× (2664px wide); PDF A4 LANDSCAPE (`imageToPdf`'s
  orientation), where 14px figures print ~8pt; Excel from the data
  (`src/exports/resultWorkbook.ts`): the price as numbers ("PKR " format
  merged across B:C — one column showed "####"), change and change % signed
  in the direction colour, the sheet's precision as `#,##0;(#,##0)`-style
  formats, current columns filled, totals bold, header frozen. Checked by
  opening it in Excel and reading the cell text back.
- **Deviations from the benchmark, each for a rule**: the Download menu
  (the user's own choice on MTS) instead of three icons; the "Company"
  label; 14px type (13px there); dates via `formatDate` ("Sep 10, 2026");
  consistent precision ("10.0", "4.00" where the live page shows "10", "4").

## BOP (External Account Highlights)

The month's balance of payments beside a chart of the current account
(`BopView`), recreated from the user's benchmark (the live /bop page):

- **Data** (`src/data/bop.ts`): transcribed on 11 Sep 2026 from what the
  live page loads, `api.askanalyst.com.pk/api/msg/bop` — `head` (Jul-25,
  Jun-26, Jul-26, MoM, YoY), `msg` (16 rows: amounts as strings in USD mn,
  changes "-60%" or "NM") and `chart`. From the second month of a fiscal
  year the feed adds the year to date then and now and its change (fy1,
  fy2, fy); the live page hides them in July (`month` 07) and so does the
  normaliser. Bold rows are the balances, named by label as the live page
  names them. The title band reads "External Account Highlights", the
  sheet's own title (the catalogue's `title`).
- **The chart's history is ONE month today** (Jul-26, its value sent as
  "-328%" — a stray "%", it is USD mn). The USER will provide longer
  history (asked 2026-09-11); `history` takes any number of months and
  everything downstream follows. Don't invent months.
- **Layout**: the benchmark's 7:5 split on the 12-column grid — the sheet
  (ReportSheet with the MTS bands) at 7 columns, the chart at 5, 1300px, the
  toolbar across both, the chart centred against the sheet
  (`BopView.module.css`). A size container: under 1300px of room the chart
  goes under the sheet at the sheet's measure (1024px measured), and on a
  phone the table scrolls in its region. The sheet stays 7 columns at every
  text size (labels wrap): the view holds `--report-columns` at 7, which
  sizes the sheet and the export stage, and the toolbar and report take the
  1300px from `BopView.module.css`. The report fits one 1920×960 screen
  (ends at 764px).
- **Table** (`MonthlyTable`, shared with Oil Marketing): as the Latest Result table (thin rules, tinted
  header and current month) with NEGATIVE AMOUNTS in parentheses and the
  negative colour, as on the live page where they print red; changes as
  published, "-60%" (`formatPercent` with `signStyle: 'minus'` — its default
  is parentheses), in the text colour, as there; "NM" kept, spelled out in
  the caption. On a chosen highlight a negative falls back to the
  highlight's own ink or white where it would not read
  (`--report-negative-on-highlight`, `readableOn`).
- **Chart** (`BopChart`): a Google Charts ComboChart, as the user asked,
  on the design system's bar preset (`barChartOptions`, `mirrorValueAxis`,
  `mergeChartOptions` — its `AskChart` has no combo kind). BARS = the month's
  current account balance; LINE = its running total for the fiscal year
  from July (the user's choice; `src/data/fiscalYear.ts`), one line series
  per fiscal year so no stroke joins June to July, dots at each month so a
  one-month line still shows its colour. One axis (both USD mn), zero always
  on it, "USD mn" title, `#,##0;(#,##0)` labels, a legend naming both.
  Chart colours are literals (Google cannot read CSS): the Report style's,
  or the palette's blue and orange (`CHART_DEFAULTS`). The picture is
  aria-hidden; a hidden table carries the figures — inside a `div.sr-only`,
  because `sr-only` on the table itself widened the page (finding 8).
  "Powered by" + the DS `Logo` under it, as the benchmark.
- **Downloads are the TABLE PART ONLY** (the user's call, 2026-09-11): the
  letterheaded sheet — bands, logo, table, source — never the chart. PNG and
  PDF picture the sheet's off-screen copy, 782px as on MTS (PNG 1564px
  wide), so the PDF prints A4 PORTRAIT as MTS does. `capturePng` sets aside
  cross-origin stylesheets for the moment of the capture: the chart on the
  page makes Google inject three from gstatic.com that html-to-image cannot
  read, which logged nine console errors per export. Excel
  (`src/exports/monthlyWorkbook.ts`, shared): the table as numbers
  (negatives coloured per cell, changes as fractions "0%", "NM" as text,
  this month filled), A1:F23. Read back in Excel.
- **Deviations from the benchmark**: the Download menu; 14px type; dates via
  `formatDate`; the negative red is the system's #B91C1C (6.5:1), not pure
  red (4:1); the chart is the user's combo with a legend (the live one is a
  single-series bar chart, empty because of the one-month feed).

## Oil Marketing (OMCs Cumulative Sales)

The month's sales of the oil marketing companies (`OmcView`), recreated from
the user's screenshot of the live /omc page:

- **Data** (`src/data/omc.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/omc` — `head` (eight headings: Aug-2025,
  Jul-2026, Aug-2026, MoM, YoY, 2MFY26, 2MFY27, YoY), `data` (25 rows keyed
  "industry", "pso", "pso_ms" …; a key without a product suffix is a total,
  bold) and `month`. Volumes in thousand tonnes ("K Tonnes"), strings with
  commas; "-" is no figure (Shell's FO) and renders as the system's em dash
  — a rule, where the benchmark prints a hyphen; "NM" kept. The feed has
  NO DATE: the live page stamps the day it is viewed; the fixture uses the
  transcription day, and a connected accessor should stamp the server's day
  in Karachi. The live page prints however many headings arrive (July's
  feed will have its own).
- **Layout**: MTS's letterhead and toolbar, the `.roomy` spacing, nine
  columns in the sheet's 7/8/9-column measure — measured to fit with no
  scroll and no wrapped label at all three text sizes (750/860/970px). 25
  rows end at 1008px on a 1920×960 screen; the user accepts long tables
  scrolling. The current month and year to date are tinted, as live.
- **Rows under a total** ("MS" under PSO, under Shell …) are read with it
  first, "PSO, MS" (`MonthlyRow.group`, a hidden prefix); BOP's "Exports"
  likewise gets its balance.
- **Drawer, decided by the screen** (the user: "do drawer elements
  according to screen requirements"): what the sheet shows — company name
  (the band), logo, font, text size, border, fill, highlight (the tinted
  columns) and source (its line names the publisher: "OCAC, Akseer
  Research"). No negative colour (volumes are never negative; the live page
  colours no change) and no chart group.
- **Downloads**: the sheet, as MTS — PNG 1564×1710, PDF A4 portrait, Excel
  sheet "OMC" A1:I32 (bands merged over enough columns to hold a 48-char
  company name). Read back in Excel.

## Portfolio Investment (FIPI / LIPI Daily Movement)

The day's portfolio flows of local (LIPI) and foreign (FIPI) investors
(`PortfolioView`), recreated from the user's screenshot of the live
/portfolio-investment page and the day's published PDF ("FIPI LIPI
09102026.pdf", supplied 2026-09-11):

- **Data** (`src/data/portfolio.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/investment` — `lipi` and `fipi` (each: buy,
  sell, net, the net in eleven sectors, and `sector`, which is really the
  investor TYPES: eight local, three foreign), `wtd`/`mtd`/`cy`/`fy` (the
  foreign and local totals to date; the page prints the FOREIGN ones as the
  WTD, MTD, CYTD and FYTD rows), `date`, `pdf`. USD millions as numbers at
  full precision, sales negative. The live page renames two types in its
  second table and chart ("Others"; "Broker Proprietary trading", "Broker"),
  and so does the normaliser. The title band reads "FIPI / LIPI Daily
  Movement", the PDF's title (the catalogue's `title`); "Portfolio
  Investment" heads the tables.
- **Layout**: MTS's letterhead across the FULL grid (12 columns, 1300px, as
  Latest Result) over the main table, fifteen columns: label, Buy, Sell,
  Net and eleven sectors. Under it, the second table at four grid columns
  beside the chart at eight (the live page's 397 / 793px); a size container
  puts the chart under the table below 970px of room. At 1920×960 the sheet
  ends at 817px and the page is 1375px long.
- **Tables** (`FlowTable`, both): a two-row header — the band naming the
  table and its parts ("Portfolio Investment"; "(Figures in USD mn)" over
  Buy/Sell/Net and "Sector Wise Investment" over the sectors, as
  column-group headers) and the column headings — tinted between two rules;
  lines close on rules; LIPI Net and FIPI Net bold; the main table's Net
  column tinted (the highlight). Two decimals, negatives in parentheses in
  the TEXT colour (black on the live page); a figure that rounds to zero
  prints 0.00, never "(0.00)" (`flowFigure`: the DS formatter signs the
  unrounded value, and -0.000396 is on the page). The periods to date are
  read "FIPI, WTD". **The colours are every sheet's** — tint header, the
  highlight following the fill, blue rules — NOT the live page's dark blue
  bands and grey headings: the user's call ("The default colors are wrong
  in table use like previous screens", 2026-09-11) after a first build gave
  this page the benchmark's colours as its own defaults. **Every line is one
  line** — labels and the band's "Portfolio Investment" never wrap (the
  user's call: two-line labels "make the table weird"). Measured: every face
  at every size fits 1300px except Inter at 18px, 64px over, which scrolls
  in its region on screen and widens its PICTURE by that much (below).
  Letting the name wrap instead was tried and broke the PNG/PDF at 14px: the
  export copy (html-to-image) lays the table out again at 13.9px with every
  cell's width fixed, the columns rebalanced, the labels wrapped, the rows
  outgrew the region's copied height and the source line printed over the
  last rows (the user's screenshot). With no wrap the copy cannot rebalance.
- **Chart** (`PortfolioChart`): a Google ColumnChart on the DS bar preset —
  FIPI's net, then each local type's; "(0.29)" at each bar's end, as the
  table prints it; "USD mn" axis, zero always on it; bars in the Report
  style's bar colour or the palette's blue. Under 560px wide the names
  stand upright, as the benchmark prints them, and the bars carry no
  figures (at 343px they ran into each other; the table above has them).
  Hidden caption and table for screen readers; "Powered by" + the DS Logo.
  Its stylesheet, `ReportChart.module.css`, is shared with BOP's chart.
- **Drawer, decided by the screen** (the user: "Create drawer according to
  page's requirement"): under Table, company name, logo, font, text size,
  border, fill (the bands and both tables' headers), highlight (the main
  table's Net column), source (it names NCCPL, Akseer Research); under
  Chart, the bar colour. No negative colour (negatives print black) and no
  line colour (the chart has no line).
- **Downloads, the user's spec**:
  - PNG is TWO FILES from one choice (`morePictures`): the main table's
    sheet (2664×1328) and the second table's on its own seven-column sheet
    with the letterhead and source (1564×1058),
    `portfolio-investment-{brand}-{date}.png` and
    `portfolio-investment-by-investor-{brand}-{date}.png`, saved 400ms apart.
    The browser may ask once to allow several downloads. Both stages are
    `fit` (ExportStage): when a table is wider than its sheet, the capture
    sets `--sheet-grow` to the overflow, which widens the stage and the
    sheet (`ReportSheet.module.css` adds it to the measure), so the letterhead
    spans the table and no column is cut (Inter at 18px: 2792px wide). A
    table that fits sets nothing; other reports' stages are not `fit`.
  - PDF is TWO PAGES, A4 landscape (`src/exports/portfolioPdf.ts`,
    `buildPdf`), after the supplied PDF: page 1 the main table's sheet as a
    picture — the sheet, not its white border, meets the margins — the
    research contact at the inline-end, and the footer (page number,
    "Akseer Research (Pvt) Limited" centred in blue 8, www.jamapunji.pk and
    the Jama Punji mark); page 2 the DISCLAIMER set as TEXT in Helvetica
    (the reference's Arial): disclaimer, rights reserved, dissemination
    policy, the two firms' contacts in two columns at the foot, mailto
    links. The words are `src/data/disclaimer.ts`, transcribed from the
    reference (one slip fixed: "investment?-banking"). Checked by rendering
    both pages to PNG (Windows.Data.Pdf).
  - Excel is ONE SHEET with both tables and a NATIVE column chart
    (`src/exports/portfolioWorkbook.ts`): the main table in rows 6–24, the
    second in 27–40, a source line under each, the chart over F27:O42 drawn
    from D32:D40 — the second table's Net cells, so it follows an edited
    figure — with the chart's own names as literal categories and alt text.
    Full precision under `[<=-0.005](#,##0.00);[>=0.005]#,##0.00;0.00`,
    which shows a tiny negative as 0.00 (tested in Excel; the plain
    `#,##0.00;(#,##0.00)` shows "(0.00)"). Landscape, no frozen rows. Read
    back in Excel via COM: values, formats, merges, fills, the series
    formula, and the chart exported to PNG.
- **The Jama Punji mark** (`public/brand/jamapunji.png`, 732×132) is CROPPED
  from a 7500px render of the reference PDF's footer: replace it with SECP's
  own artwork when a copy is supplied.
- **Deviations from the benchmark**: the DS colours (the user's call); the
  Download menu; 14px type (13px live); dates via `formatDate`; the MTS
  letterhead's title band (the live page has only the publisher band); the
  PDF's page 1 is our sheet, bands and logo, rather than the reference's
  letterhead; its footer blue is the DS's blue 8.

## Morning Briefing

The day's briefing — the stories, and the markets of the session before —
(`MorningBriefingView`), recreated from the user's screenshots of the live
/morning-briefing page and the day's PDF ("MB 09112026.pdf", supplied
2026-09-11):

- **Live data** (`src/data/morningBriefing.ts`): the FIRST publication read
  from its feed rather than a fixture (the user: "News will come from api"):
  `api.askanalyst.com.pk/api/morningbriefingchart`, fetched in the route on
  the server with `next: { revalidate: 300 }` and an 8s timeout, so these
  pages are ISR (the build's prerender manifest: revalidate 300 for
  /alphacapital and /askanalyst; everything else stays static). If the feed
  fails or changes shape — every field is checked — the copy transcribed on
  11 Sep 2026 is served and the server logs why. The feed: `date2` (the
  briefing's day), `date` (the markets' session), `news` (title,
  description, link, position …), `net`, `sector` (the live page hides
  Cement and Fertilizer, and so does this), `indices` (hides DOW JONES),
  `commodities`, `currency` ("USD" read "PKR/USD"); `announcement` and `pdf`
  unused. A story's link is kept only if it is http(s).
- **KSA's Morning Briefing is a different report** (feed `api/ksa/msg/mb`:
  topics with a category and a sentiment) and stays pending
  (`isBuilt`); its page offers no link back to itself.
- **Layout**: the FULL grid, 12 columns, in line with the tabs' start and
  end (the user's call) — the stories 8 columns, the tables 4 (420px). Its
  OWN header (`BriefingLetterhead`), exactly the benchmark's at the user's
  request: the date, "11 September, 2026" as the benchmark writes it (the
  one sheet not on `formatDate`), and the logo in a 64px box on one line;
  88px of space (live: 90); "Morning Briefing" 24px bold between two rules.
  No publisher band. The blues are the system's (the user: "use our blue"):
  rules the brand blue, the title and the tables' names the system's text
  blue (#0A6FDB, 4.9:1 — the brand blue fails AA as small text).
- **Stories** (`NewsList`): an ordered list; headline bold one type step
  over the summary (`--briefing-lead`), "Click here for more" in the link
  colour with a hidden ending naming the story and the new tab; 32px apart.
- **Tables** (`MarketTable`), EXACTLY as the benchmark draws them (the
  user's screenshot): the name in blue above; a rule; bold centred
  headings; a rule; striped rows (every other filled with the fill), cells
  parted by 1px lines of the page's colour; figures centred (the theme ends
  numeric cells with `:is(td, th)[data-numeric]`, outweighed); a closing
  rule; 31px rows as live; and NO row highlight on hover (the user asked,
  for this screen only: the theme's `tbody tr:hover` is outweighed in
  `MarketTable.module.css`; every other table keeps it). Unlike every other
  sheet's tables — the user's calls for this screen.
- **Figures** (`briefingFigures.ts`): the live page's precisions — flows 2dp
  with a minus, index levels whole, index changes 1dp signed, prices 2dp,
  price changes 2dp signed, currency rates 4dp (the PDF's; the live code
  prints 3) — and anything that rounds to zero unsigned (0.00%). The live
  page forces a minus onto every currency change (a bug); the PDF's signs
  are followed.
- **The foot** (the user's screenshot): "Akseer Research" and its address
  centred under the tables; then "Akseer Research (Pvt) Limited" centred
  under the stories and www.jamapunji.pk with the Jama Punji mark (the Urdu
  tagline version, on a light plate in dark mode) under the tables. The
  joint venture's furniture, not white-labelled.
- **Drawer, decided by the screen**: logo, font, text size (news and
  tables), border colour (the rules; the title and tables' names too where
  it reads at 4.5:1 on white, else ink: `--briefing-accent`), fill (the
  striped rows). No company name — the header has no band — no highlight,
  negative colour, chart or source.
- **Downloads**:
  - PNG: the screen's sheet (2664px wide).
  - PDF: two A4 PORTRAIT pages (`src/exports/briefingPdf.ts`), on the
    REFERENCE's narrow margins — about 6mm at the sides (space-6), not the
    12.7mm of the other PDFs — after the user asked for the content "a bit
    more like my reference" (it spans 94% of the page's width, the
    reference 95%). Page 1 is a picture of a SEPARATE copy laid out for the
    page (`pdfStage`: 10, 11, 12 grid columns by text size — the page's
    proportions, since the tables' column sets the height), so the text
    prints at about 7.5pt, not the 5.5pt a full-grid picture would; it
    leaves out the sheet's last line,
    which the page footer prints ("1/2 · Akseer Research (Pvt) Limited", as
    the reference). Every link stays a link (13 link areas, from
    `CapturedImage.links`). Page 2 is the briefing's disclaimer as text
    (`BRIEFING_FURNITURE`: disclaimer, valuation methodology, ratings
    criteria with its table, dissemination policy, analyst certification,
    contacts in three columns under logos CROPPED from the reference —
    `akseer.png`, `alpha-capital.png`, `jamapunji-urdu.png`, to replace with
    supplied artwork), headings in the text blue, set a quarter point smaller
    until it fits (fits at 9pt). Rendered and checked page by page.
  - Excel (`src/exports/briefingWorkbook.ts`): TWO sheets — News (No.,
    headline, summary, and a real hyperlink per story; rows sized to their
    text; headings frozen) and Markets (the five tables as drawn: striped,
    centred, rules). Read back in Excel: 8 links, the formats, the fills.
- **Deviations from the benchmark**: the Download menu (the live page shows
  three icons and links the day's published PDF); 14px text (13px); the
  system's colours; the corrected currency signs; no announcements (the
  feed's list was empty and the live page prints none).

## Trade-PBS (Balance of Trade)

The month's trade in goods as the Pakistan Bureau of Statistics counts it
(`MonthlyView`, kind `trade-pbs`), recreated from the user's screenshot of the live
/trade-pbs page (the user: "It's straight forward. Like previous pages."):

- **Data** (`src/data/tradePbs.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/pbs` — msg/bop's shape (`head`, here a
  one-entry array; `msg` rows of previous_year … fy; `date`; `month`) with
  two fields more: `bold` (emphasis, NOT totals — Petroleum among the
  imports is bold) and `step` (2 = a line detailing the one above: Textile's
  cotton cloth, knitwear, bedwear, garments). A section's name ("Exports",
  "Imports") is a row with no figures. Amounts in USD millions, strings, or
  numbers for the deficit; changes to one decimal with the zero dropped
  ("8%"), printed "8.0%" (`changeDecimals: 1`). "knitwear" prints
  "Knitwear". The title band reads "Balance of Trade", the sheet's own.
- **July**: the head has no year-to-date headings, but the rows carry fy1,
  fy2 and fy — the month again — and the live page prints them under three
  EMPTY headings. They are left out in July, as on BOP (`msgHeadings`).
  From August they print; measured with the headings forced: nine columns
  fit the 970px sheet at every face and size.
- **Feed oddities, carried as published, not corrected** (the user was
  told): the trade deficit's changes are the exports' change LESS the
  imports' (MoM 31.5% = 32.1 − 0.6; YoY −8.5% = 10.4 − 18.9), not the
  deficit's own (it narrowed 14.6% on the month); and the year to date's
  change is the wrong way round (exports −9.4% = 2,683 on 2,962, where they
  rose 10.4%) — it will print from August unless the feed is fixed.
- **Layout**: MTS's letterhead and toolbar, the `.roomy` spacing, and NINE
  grid columns (970px) at every text size — the live pages' width (about
  955px), after the user found the 7-column sheet "a bit concise width
  wise" (`columns` in `MonthlyView`'s `SHEETS`, both trade sheets). 21 rows end at
  900px on a 1920×960 screen. Detail lines a step in (space-4); section rows bold with empty
  cells; screen readers hear "Exports, Foods", "Exports, Textile, Cotton
  Cloth" (`outlineLines`) — Foods, Textile, Petroleum and All Other appear
  under both sections.
- **Look, the live page's** (`MonthlyView`'s `SHEETS['trade-pbs']`): no column tinted and the deficit
  in parentheses in the TEXT colour — BOP tints this month and prints
  negatives red because ITS live page does. Figures end-aligned as on every
  monthly sheet (the live page centres them). Labels never wrap (the
  one-line rule) and the export stage is `fit`.
- **Drawer, decided by the screen** (the user: "Adjust drawer filters
  accordingly"): MTS's list — company name, logo, font, text size, border,
  fill, source (its line names PBS and the publisher). No highlight, no
  negative colour, no chart.
- **Downloads**: the sheet — PNG 2004px wide, PDF A4 portrait (the 970px
  sheet across the page, 14px text printing about 7.3pt), Excel sheet
  "Trade-PBS" A1:F28 (changes "0.0%", detail lines indented, header
  frozen). Read back in Excel via COM; the PNG checked at 14px and 18px.
- **Deviations from the benchmark**: the Download menu; 14px text; dates
  via `formatDate`; one decimal throughout; "Knitwear"; the empty-headed
  July columns left out; figures end-aligned; the labels at the theme's
  row-header weight (600, `tbody th[scope="row"]`, which outweighs every
  sheet's own 400 — as on all the other sheets), bold rows 700.

## Trade-SBP (Export of Services break-up)

The month's trade in goods and services as the State Bank counts it
(`MonthlyView`, kind `trade-sbp`), recreated from the user's screenshot of the live
/trade-sbp page ("Now this Trade - SBP tag design."):

- **Data** (`src/data/tradeSbp.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/trade` — msg/pbs's shape (`msgRows`,
  `msgRow`): exports of goods and of services, the services a step in
  (Technology, Other Business Services, Transport, Travel, Others), Total
  Exports; a BLANK LINE (label "", no figures: `spacer`); imports of goods
  and of services, Total Imports. Every line but the breakdown bold. The
  goods and services match BOP's (both are the State Bank's balance of
  payments). The title band reads "Export of Services break-up (USD mn)",
  the sheet's own title, unit included.
- **July**: as Trade-PBS — the three year-to-date columns the live page
  prints under empty headings are left out (`msgHeadings`). This feed's
  year-to-date change runs the right way (unlike msg/pbs's).
- **Feed oddity, carried as published** (the user was told): the Others
  line's changes are the services' change less the listed types' (MoM 6%
  = −1.6 − (0.2 − 1.4 + 7.1 − 13.2); YoY −192%), not its own (105 on 106
  is −0.9%, on 114 −7.9%).
- **Look, the live page's** (`SHEETS['trade-sbp']`): the current month tinted (the
  year to date too, from August) as on BOP; the heading over the labels
  BLANK, as there — the title carries the unit (`unitsInTitle`: the cell
  holds "USD mn" for screen readers only; the Excel cell is empty); the
  blank line drawn as an empty row of a row's height, its rule and the tint
  running through, `aria-hidden` and without hover; labels on one line.
- **Layout**: as Trade-PBS, nine grid columns; 12 rows end at 656px on a
  1920×960 screen. Every face and size fits, with August's nine table
  columns too (at the old 750px, Inter at 14px ran 6px over).
- **Drawer, decided by the screen**: Oil Marketing's list — company name,
  logo, font, text size, border, fill, highlight (the tinted columns),
  source. No negative colour (its amounts are never negative), no chart.
- **Downloads**: PNG, PDF A4 portrait, Excel sheet "Trade-SBP" A1:F19
  (header cell over the labels blank, this month filled, changes "0.0%",
  services indented, the blank line kept). Read back in Excel via COM.
- **Deviations from the benchmark**: as Trade-PBS — the Download menu, 14px
  text, `formatDate`, one decimal throughout ("6.0%", "-192.0%"), the
  empty-headed July columns left out, figures end-aligned (the live page
  centres them).

## Fertilizer (Fertilizer Offtake and Inventory)

The month's fertilizer offtake by product and company (`MonthlyView`, kind
`fertilizer`), recreated from the user's screenshot of the live
/fertilizer page ("Now lets get started on fertilizer tab"):

- **Data** (`src/data/fertilizer.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/fertilizer` — `head` (Jul-25, Jun-26,
  Jul-26, "MoM %", "YoY %", the CALENDAR year to date "7MCY25", "7MCY26",
  its "YoY", and "Inventory", the month-end stock) and `msg`, one entry per
  product (Urea, DAP, CAN) with a row per company and a TOTAL — amounts as
  numbers at full precision in thousand tonnes, changes to one decimal.
  `msg_month` "Jul-26"; `date` "01 July, 2026" is the month's first day,
  not a publishing date — the sheet is stamped with the transcription day,
  as the live page stamps the viewing day.
- **Table**: each product's name a bold row of its own (`heading`), its
  companies under it (read "Urea, FFC" — `outlineLines`), a blank line
  between products (`spacer`), as live; this month and the calendar year
  to date tinted (both `current`); Inventory an amount column at the end;
  the first heading "Period", kept as shown (like CGD's "Label"); TOTAL rows
  regular weight, as live. The live page underlines the product names; not
  copied (underlined text that is not a link reads as one — DS §8.9).
- **Title**: the live page's reads "Fertilizer Jun-25 Offtake and
  Inventory (‘000) tons" while the table is Jul-26 — the sheet names the
  table's month, as on Central Government Debt; the wording otherwise
  verbatim. Catalogue title "Fertilizer Offtake and Inventory".
- **The tab is "Fertilizer"** (slug `fertilizer`), the live site's spelling
  — it had been "Fertiliser" in the catalogue since the first build.
- **Layout**: TEN grid columns (1,080px; the live sheet 1,056px); every face
  and size fits; the sheet ends at 791px.
- **Drawer**: Oil Marketing's list. **Downloads**: PNG 2224px, PDF A4
  portrait, Excel sheet "Fertilizer" A1:J24 (read back via COM).

## Cement (Cement Price History (PKR/bag))

The price of a bag of cement by region (`CementView`), recreated from the
user's screenshot of the live /cement page ("now lets work on cement
tab"):

- **Data** (`src/data/cement.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/cement` — an ARRAY of regions ({label
  "North Region"/"South Region", data [{year "10-Sep-26", value}]}), 51
  weekly prices from 04-Sep-25 (a few weeks skipped by the survey). No date
  and no headings: the sheet is stamped with the transcription day, as Oil
  Marketing's (the live page stamps the viewing day). The table (a
  `CementReport extends MonthlyReport`) is the latest FIVE weeks, as live;
  `series` carries every week for the chart.
- **Layout**: the table, then the chart, then the source, inside the sheet
  (`SheetWithChart.module.css`, shared with Remittance); SEVEN grid columns
  (750px) at every size — the live sheet is 690px and seven is the
  narrowest the letterhead's bands and logo box fit side by side. Table
  look: nothing tinted, the unit in the title (`unitsInTitle`).
- **Chart** (`CementChart`): a Google line chart on the DS line preset
  (value axis 'pretty', not from zero — a price level), smoothed
  (`curve: true`) as the live page draws it, on a DATE axis so skipped
  weeks leave their gap, months named ("Oct 25"), legend under it. No
  title and no "Powered by", as the live page (a hidden caption names it).
  Colours: the DS palette in its fixed order (North blue, South orange)
  where the live page uses navy and grey — the drawer's bar/line colours
  are one each, so the chart is not in the Report style.
- **Drawer**: MTS's list. No highlight, negative colour or Chart group.
- **Downloads**: the whole sheet, chart included (PNG 1564px wide, PDF A4
  portrait; the copy waits for the chart); Excel (`cementWorkbook.ts`) =
  "Cement" (the table, `monthlySheet`) + "History" (every week, date
  "dd-mmm-yy", each region's price) with a native LINE chart, both regions
  on one axis (straight lines: the data points, not a smoothing). Read
  back in Excel via COM and its chart exported.

## Central Government Debt

The central government's debt by kind (`MonthlyView`, kind
`central-government-debt`), recreated from the user's screenshot of the
live /central-government-debt page ("Now start working on Central
Government Debt tab"):

- **Data** (`src/data/centralGovernmentDebt.ts`): transcribed on 11 Sep
  2026 from `api.askanalyst.com.pk/api/msg/cgd` — `head` (`previous_year`
  Jul-25, `fiscal_year` Jun-26 = the fiscal year's close, `current` Jul-26,
  "YoY %"), and nine rows with `step` 1–3, `bold`, the three amounts, `yoy`
  and `fy`. Its own row keys, so it uses `outlineRow` directly. Debt is a
  stock: the table compares with a year before and with the fiscal year's
  close, not last month.
- **Three live-page quirks, each handled and told to the user**: (1) the
  last column (`fy`, the change since the fiscal year closed; in July also
  the month's) has NO heading on the live page — the sheet heads it
  "FYTD %", the remittances feed's name for the same figure; (2) the live
  title reads "Central Government Debt Apr-25 (PKR bn)" while the table is
  Jul-26 — the sheet's title names the table's month
  (`SHEETS[...].title`, from the current column: "…Jul-26 (PKR bn)"); the
  catalogue title stays "Central Government Debt" (tab, document title);
  (3) the first heading reads "Label" — KEPT, as shown (memory: build odd
  benchmark details as shown and ask).
- **Table**: three indent levels (16px a step; Excel indent 1–2), the
  domestic, external and total debt bold, this month tinted, changes to
  one decimal, labels verbatim ("a. Long Term", "ii Unfunded Debt" — the
  outline markers stay lower-case; an earlier capitalising rule meant for
  Trade-PBS's "knitwear" had turned them into "A." and "Ii", fixed by
  moving it into tradePbs.ts).
- **Layout**: TEN grid columns (1,080px) at every size — the live sheet is
  ~1,090px (the width rule). Every face and size fits; the sheet ends at
  575px on a 1920×960 screen.
- **Drawer**: Oil Marketing's list (company name, logo, font, size, border,
  fill, highlight, source).
- **Downloads**: PNG 2224px wide, PDF A4 portrait, Excel sheet "Central
  Govt Debt" A1:F16. Read back in Excel via COM.

## Remittance (Workers' Remittances (USD Mn))

The month's workers' remittances by the country they are sent from, and
the months before them in a chart (`RemittanceView`), recreated from the
user's screenshot of the live /remittance page ("Now build remittances
page."):

- **Data** (`src/data/remittance.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/remittances` — `head` (note: last month
  is `fiscal_year`, mapped to previous_month; "MoM %", "YoY %", and "FYTD %"
  with no amount headings, so the five month columns only, as live), `msg`
  (seven countries and Total, msg/pbs's row shape through `msgRow`; `bold`
  false even for Total — bolded by label, as the live page does), and
  `chart`: EVERY month from Aug-16 (`bar` the total, `line` the YoY %, 0
  where there is no year before — read as no figure). The chart draws the
  latest 43 months (Feb-23 → Aug-26), the live chart's span.
- **Live-page bug corrected**: the live table prints each country's YoY
  change under "MoM %" and its MoM under "YoY %" (USA's 15.7% is 267 → 309,
  on the year); the sheet prints each under its own heading. **Feed
  oddities carried as published** (the user was told): Other Countries'
  MoM −14.5% and YoY −12.5% (its amounts give +8.4% and +15.8%) and its
  year to date ("8%" for the amounts; not shown).
- **Table**: `MonthlyTable` with a `LOOK` in the view — this month tinted
  (as live), the unit in the title so the heading over the countries is
  blank (`unitsInTitle`), labels on one line; changes to one decimal.
- **Chart** (`RemittanceChart`): ONE Google ComboChart as the benchmark —
  the total as bars on a USD axis, its YoY change as a line on a % axis,
  legend under it ("Total", "YoY Change"), "USD mn" and "%" over the two
  axes, months upright every other one, "Powered by Ask Analyst". **The one
  exception to the design system's single-axis rule** (`assertSingleAxis`),
  the USER'S CALL (2026-09-11: offered two panels or a single-unit chart,
  chose "One chart, two axes"). Kept from the system: the bars count from
  zero (the live axis starts at 1,500), and the two axes share their
  gridlines — `remittanceAxes` picks the total's thousands and the
  smallest round % step that fits in as many intervals, zero on a
  gridline (today 0–5,000 and −40%–60%). In the Arabic build the bars'
  axis moves to the right. Colours: the Report style's bar and line, or
  the palette's blue and orange (BOP's defaults), not the live page's.
- **Layout**: the table, then the chart inside the sheet, then the source
  line — as the benchmark; nine grid columns (970px) at every size. Every
  face and size fits; 375px checked (the table scrolls, the chart fits).
- **Drawer, decided by the screen**: Oil Marketing's list (company name,
  logo, font, size, border, fill, highlight, source) and under Chart the
  bar and line colours. No negative colour (amounts are never negative).
- **Downloads are the whole sheet, chart included** (it sits above the
  source line in the benchmark — unlike BOP's side panel, which the user
  kept out of BOP's downloads): PNG 2004px wide and PDF A4 portrait picture
  the light copy, which WAITS for its chart to draw (about 4–5s); Excel
  (`remittanceWorkbook.ts`) has two sheets — "Remittances" (the table, via
  `monthlySheet`, which `buildMonthlyWorkbook` now wraps) and "History"
  (the 43 months: date "mmm-yy", total, YoY as a fraction) with ONE native
  combination chart (columns + a line on a secondary axis, both scales
  fixed to the page's, legend at the foot). Read back in Excel via COM
  (2 series, axis groups 1 and 2, 0..5000 and −0.4..0.6) and its chart
  exported to PNG.

## Settlement (Settlement of top 10 traded stocks)

The day's ten most traded stocks by volume and how their trades settled
(`SettlementView`), recreated from the user's screenshot of the live
/settlement page ("Now lets do settlement tab"):

- **Data** (`src/data/settlement.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/settlement` — `date` (the trading day,
  "10 September, 2026": a day before the other sheets) and `msg`, ten rows
  of `symbol`, `trade_volume` (mn shares) and `trade_value` (PKR mn) as
  numbers at full precision, and two settlement percentages as strings to
  two decimals: `uni_percentage_volume` (the live page's "UIN") and
  `percentage_value` ("CM"). Every figure prints to one decimal, as live;
  the workbook keeps full precision under "#,##0.0". The title band reads
  "Settlement of top 10 traded stocks", the sheet's own; source "NCCPL,
  Akseer Research".
- **Table** (`SettlementTable`, its own component): a two-row header —
  "Symbol" down both rows (`rowSpan`), "Trade" over Volume (mn shares) and
  Value (PKR mn), "Settlement (%)" over UIN and CM (column-group headers,
  `scope="colgroup"`) — tinted between two rules. THE USER'S CALLS while it
  was built (2026-09-11): each group's name on its OWN rule, broken between
  the groups ("visually break the table like under trade comes volume and
  value and under settlement comes uin and cm"); the column headings
  centred under their rule; then the figures centred too ("numbers should
  be center allign"). Symbols centred and in the figures' weight (400, as
  the benchmark; the theme sets row headers 600).
- **The group rules are a background layer** sized in percent of their own
  cell (`calc(100% - 2 × space-4)`, centred), not a border (it would run
  on into the next group's) nor a positioned `::after` (html-to-image fixed
  its width in pixels while the export copy laid the columns out a little
  differently, so the PNG's Trade rule stopped short — seen, then fixed).
  Centred, so it mirrors in the Arabic build.
- **Layout**: MTS's letterhead and toolbar, `.roomy` spacing, NINE grid
  columns (970px) at every text size — the live sheet's width (~960px),
  per the width rule the user set on the trade sheets. Every face and size
  fits on one line; the sheet ends at 618–665px on a 1920×960 screen.
- **Drawer, decided by the screen**: MTS's list (company name, logo, font,
  text size, border, fill, source). No highlight (nothing tinted), no
  negative colour, no chart.
- **Downloads**: PNG 2004px wide, PDF A4 portrait, Excel
  (`src/exports/settlementWorkbook.ts`) sheet "Settlement" A1:F18: "Symbol"
  merged A6:A7, "Trade" B6:C6, "Settlement (%)" E6:F6, a narrow blank
  column D between the groups so their rules break as on the sheet (a
  cell border cannot be trimmed), everything centred, header frozen. Read
  back in Excel via COM; the PNG and PDF looked at.
- **Deviations from the benchmark**: the Download menu; 14px text;
  `formatDate`; the group rules broken and headings/figures centred (the
  user's calls; the live page's rule is continuous and its figures end).

## Currency (Weighted Average Exchange Rates)

The State Bank's weighted average exchange rates for six currencies
(`CurrencyView`), recreated from the user's screenshot of the live
/currency page ("Now finish currency tab"):

- **Data** (`src/data/currency.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/currency` — `msg`, three parts ("Current
  Date", "Previous Date", "Change"), each a Buying and a Selling row of
  `{symbol, value}` per currency (CNY, EUR, GBP, JPY, SAR, USD): rates as
  strings to four decimals with trailing zeros dropped ("39.214"), changes
  in rupees to two — and `date`, "22 August, 2025". **The feed has not
  moved since 22 Aug 2025**; the live page prints that date and so does the
  sheet (`asOf` 2025-08-22), a year old the day it was built. A part is a
  change when its label says so (`RatesSection.kind`). Rates print to four
  decimals ("39.2140"), changes to two, a change that rounds to zero as
  0.00 unsigned. Source "SBP, Akseer Research".
- **Table** (`RatesTable`, its own component): one header row — "Currency"
  and the six symbols — tinted between two rules; each part's name a bold
  row with no figures, its Buying and Selling a step in (read "Current
  Date, Buying"); every line on a rule; the USD column tinted from the
  header down (the highlight), as live. THE USER'S CALLS (2026-09-11):
  every heading centred — the symbols over their figures, and "Currency"
  in its column too ("labels are center allign…", "Currency label is also
  center alligned") — and the figures centred; the row labels start. The
  theme ends `[data-numeric]` cells and first outweighed the header rule,
  so check the computed alignment, not the stylesheet.
- **Layout**: MTS's letterhead and toolbar, `.roomy`, NINE grid columns
  (970px) at every size — the live sheet is ~960px. Every face and size
  fits on one line; at 18px the table ends at 569–580px on a 1920×960
  screen. On a phone the table (512px) scrolls in its region, labels pinned.
- **Drawer**: MTS's list and the highlight ("Fills the USD column."). No
  negative colour (the changes print in ink, as live) and no chart.
- **Downloads**: PNG 2004px wide, PDF A4 portrait, Excel
  (`src/exports/currencyWorkbook.ts`) sheet "Currency" A1:G16: rates under
  `#,##0.0000`, changes under `#,##0.00` (a change under 0.005 written as
  0), part names bold, Buying and Selling indented, every heading centred,
  the USD column filled with the highlight (or the fill), header frozen at
  row 6. Read back via COM, with a draft highlight too.
- **Deviations from the benchmark**: the Download menu; 14px text;
  `formatDate` ("Aug 22, 2025"); labels flush with the sheet's edge (the
  live page indents "Currency" and the rows 20px); rates at a steady four
  decimals (the live page prints the feed's strings, "39.214", "1.895").

## Auto (Auto Sales Volumes)

The month's vehicle sales by maker and model, then by kind of vehicle
(`MonthlyView`, kind `auto`), recreated from the user's screenshot of the
live /auto page ("Lets finish off with autos tab") — the last tab:

- **Data** (`src/data/auto.ts`): transcribed on 11 Sep 2026 from
  `api.askanalyst.com.pk/api/msg/autos` — msg/pbs's shape without the year
  to date: `head` (Jul-25, Jun-26, Jul-26, "MoM", "YoY"), `msg` (33 rows of
  `label`, `bold`, `step` — always 1 — and the five cells: units sold as
  numbers or strings, changes to one decimal with the zero dropped, "-6%",
  printed "-6.0%" by `changeDecimals: 1`), `date` "11 September, 2026",
  `month` "07". Every change matches its amounts except WagonR's and Ravi
  + Bolan's YoY, "NM" where sales fell to nothing (−100%) — carried as
  published; "-" (none sold either month, so no MoM) prints the em dash.
  Labels verbatim ("Civic +City", "Santa FE"). Source "PAMA, Akseer
  Research".
- **Rows**: each maker bold — INDU, HCAR, PSMC and Hyundai with their
  models under them, then Sazgar - Haval, MTL, AGTL, GAL and GHNI alone —
  then cars by engine size, Total Passenger Cars bold, the other vehicles,
  Industry bold; no indentation, as live. A model is read with its maker
  ("PSMC, Alto"): the feed marks makers and totals alike only as bold, so
  `makersModels` takes the lines after a bold one as its models only where
  they ADD UP to it in every month — the engine sizes after GHNI and the
  vehicles after Total Passenger Cars do not, and get no group.
- **Title**: the live page's reads "Auto Sales Volumes (August-25)",
  HARD-CODED in its script (checked), while the table is Jul-26. The sheet
  names the table's month in the live form, "Auto Sales Volumes (July-26)"
  (`longMonth`), as Central Government Debt and Fertilizer name theirs.
  Catalogue title "Auto Sales Volumes".
- **Look, the live page's**: this month tinted; the heading over the labels
  blank (`unitsInTitle`: "Units" for screen readers only, an empty Excel
  cell); headings and figures end-aligned, as live (for once the live page
  does too); falls in the text colour.
- **Layout**: NINE grid columns (970px; the live table 953px). Every face
  and size fits on one line with a one-line title; the 33 rows end at
  1,171–1,302px on a 1920×960 screen — past one screen, as live. On a
  phone the table (458px) scrolls in its region, the labels pinned.
- **Drawer**: Oil Marketing's list (company name, logo, font, size,
  border, fill, highlight — the Jul-26 column — and source).
- **Downloads**: PNG 2004px wide (all 33 rows and the source), PDF one A4
  portrait page, Excel sheet "Auto" A1:F40 (the header cell over the labels
  blank, Jul-26 filled, changes as fractions under "0.0%", "NM" as text, a
  dash as an empty cell). Read back via COM.
- **Deviations from the benchmark**: the Download menu; 14px text;
  `formatDate` ("Sep 11, 2026"); one decimal throughout ("3.0%"); the
  title's month.

## Report style (white label)

The account drawer's **Report style** changes how every report looks. Each
control previews live behind the drawer and all three downloads follow, but
**nothing is kept until Apply** (the user asked for an Apply button so a
refresh keeps their choice):

- **Each report offers its own settings** (`src/branding/placement.ts`, the
  user's lists). MTS offers all of them. Latest Result offers only the logo,
  the border colour, the row fills (Fill colour = its header row, Highlight
  colour = the latest quarter and period to date in every row), the font
  and the text size. BOP offers Latest Result's list plus the company name
  (it has MTS's publisher band; the user asked for it there), the negative
  figures colour and the chart's bar and line colours (its fill is the
  bands and header, as on MTS). Oil Marketing offers what its sheet shows:
  MTS's list plus the highlight. Portfolio Investment likewise: MTS's list,
  the highlight (its main table's Net column) and the bar colour. The
  Morning Briefing: logo, font, size, border and fill (no company name: its
  header has no band). Trade-PBS: MTS's list (its table tints and colours
  nothing beyond the header), and Settlement and Cement the same. Trade-SBP: Oil Marketing's list (MTS's and
  the highlight on its tinted columns), and Central Government Debt, Fertilizer, Auto and Currency (its USD column) the same. Remittance: Oil Marketing's list and, under Chart, the bar
  and line colours. The drawer shows only what the report in view offers;
  the report APPLIES only those (`styleOnReport`: a border or source set on
  MTS never reaches the Latest Result sheet unless offered there); Reset
  style resets only those ("Keeps your logo." when the company name is not
  offered). The settings are still kept once for the account.
- **Explainers are tooltips** behind an "i" button on every field
  (`Field` in `ReportStyleSettings.tsx`, the user's requests): the drawer
  reads as labels and controls. The button sits at the END of the label's
  line, the field's top corner, held 4px in so its icon stands over the
  fields' own end icons (the font chevron and colour eyedroppers centre
  18px from the edge). Each explainer is ONE plain line saying what the
  setting does ("Colours the lines in the table."), from `describe` in
  `placement.ts`: no how, no jargon — the user cut paragraphs down to
  that. Keep new ones under ~45 characters, one line of the tooltip. The
  tooltip follows the colour scheme — white with a grey edge in light
  mode, slate in dark — on the design system's chart-tooltip tokens
  (finding 5); Mantine's own is inverted, which the user called wrong.
  The button is outside the `<label>` (a button in a label is invalid and
  would focus the field); it keeps its 28px target but lends 4px above and
  below to the label's line, so a heading with a button sits where one
  without does. Every control sits 4px (`--mantine-spacing-xs`) under its
  label — the gap under the Latest Result page's "Company" label, which
  the user asked the drawer to copy. The explainer is also the control's
  hidden description for screen readers: `aria-describedby` for the switch
  and the logo button, Mantine's own `description` prop with the global
  `sr-only` class for Mantine inputs (Mantine spreads its wrapper's
  `aria-describedby` AFTER passed props, so a passed one is overwritten
  with undefined). The fills' contrast readout stays visible under the
  field, as a polite status.
- **Groups, order and buttons, the user's**: the fields sit under two
  headings (`FieldGroup`, a named group): **Table** — text size first, then
  the company logo, company name, font, the table's colours, source — and
  **Chart**, the bar and line colours, only where the report has a chart
  (BOP; Portfolio Investment, bars only). A rule and a second step of space set Chart off; Reset style and
  Apply cover both, below them. The colours for text and chart marks show
  how they read on the white report (4.5:1 for text, 3:1 for marks), as
  the fills show the text on them. Buttons span the
  drawer as its fields do: Upload logo and Reset style full width,
  Replace / Remove and Apply / Discard as equal halves (`.pair`: one grid
  column per rendered button, so Upload alone fills the line). Advice
  under a field (a wide or small logo) is grey type with its warning icon
  in colour, like the contrast readout; failures stay red. Idle Apply
  wears the system's disabled look, the same as idle Discard (finding 6).

- The store (`src/branding/store.ts`) holds a SAVED style (read from
  storage, written only by `applyBranding`) and a DRAFT (the drawer's edits,
  or null). Reports render the draft while there is one; Discard drops it;
  an edit that returns to the saved style clears it.
- The Apply bar sticks to the drawer's foot: Apply (filled, the system's
  recorded 3.6:1 deviation — the one axe node while changes are pending),
  Discard changes, and a live status line. Both buttons stay focusable when
  idle (`aria-disabled` + `data-disabled`), so pressing them never drops
  focus. It sits on `--ask-z-raised`: at z-index 1 the SegmentedControl's
  labels (z-index 2) painted through it on a phone.
- A close with changes pending (X, Escape, outside click) is HELD: the bar
  turns amber, asks "Keep them?", focus moves to Apply and close / Discard
  and close. Reloading or leaving with changes pending raises the browser's
  leave prompt (`AccountMenu`). Signing out discards them.
- Testing note: the Browser pane's `key` action sends Enter without the
  character that activates a button, so keyboard activation cannot be
  checked there; click instead. It performs no editing keys either
  (Backspace, Ctrl+A): select a field's text with `input.select()` before
  typing over it. And when the pane's page is hidden
  (`document.visibilityState` "hidden", e.g. the app window is not in
  front), animation frames stop and every Mantine transition freezes: the
  picker and the drawer stay mid-fade, and axe reads intermediate colours.
  Judge state from attributes (`data-mantine-stop-propagation` on a colour
  field while its picker is open), not from what is mounted. Downloads can be
  checked without writing files: override `HTMLAnchorElement.prototype.
  click` in the page to record `{download, href}` (`saveUrl` clicks a link),
  inspect the data or blob URL, then restore the original. A file too big
  to pass back as text (a PDF, a PNG) can be POSTed from the page to a
  temporary route that writes it to disk — in a folder NOT starting with
  `_`, which Next treats as private and does not route — and the route
  deleted after. Windows renders a PDF's pages to PNG through WinRT's
  `Windows.Data.Pdf` (PowerShell), and Excel reads a workbook back via COM.
- **Company name publishes the report**: it replaces "Akseer Research (Pvt)
  Ltd." on the letterhead band, in the Excel band and as PDF/workbook author
  (`useMasthead`). Capped at 48 characters, which stays on one band line in
  all seven faces for realistic names; a wider name wraps rather than being
  cut.

| Setting | Offered on | Lands on | Bounds |
| --- | --- | --- | --- |
| Font | all | the whole sheet, the charts' axes; Excel names it | seven self-hosted faces, each checked for real italics and tabular digits |
| Table text size | all | header and cells; the MTS and Oil Marketing sheets widen 7 → 8 → 9 grid columns, the trade sheets, Settlement, Remittance, Currency and Auto hold 9, Central Government Debt and Fertilizer 10, Cement 7 (their live pages' widths), Latest Result (12) and BOP (7, beside its chart) wrap labels, Portfolio Investment (12) never wraps them; the Morning Briefing's stories and tables (its PDF copy 10 → 11 → 12 columns) | 14 / 16 / 18px, type-scale steps up from the 14px data floor |
| Company name | MTS, BOP, Oil Marketing, Portfolio Investment, Trade-PBS, Trade-SBP, Settlement, Remittance, Central Government Debt, Cement, Fertilizer, Currency, Auto | the letterhead's publisher band, the Excel band, PDF and workbook author, the logo's alt text and switch label, file names | 48 characters |
| Company logo | all | a third masthead choice, selected on upload; Excel attribution | PNG, JPG, SVG, WebP, any size; empty margins trimmed; drawn in the logo box (below) |
| Border colour | all | every table rule; the Morning Briefing's title rules, and its title and tables' names where the colour reads as text | any colour, typed as a hex code or picked; empty = brand blue (#1485FF) |
| Fill colour | all | MTS, BOP, Oil Marketing, the trade sheets, Settlement, Remittance, Central Government Debt, Cement, Fertilizer, Currency, Auto: letterhead bands and header; Portfolio Investment: the bands and both tables' two-row headers; Latest Result: the header row; Morning Briefing: the tables' striped rows. Text on it ink or white by contrast, ratio shown | any colour, typed as a hex code or picked; empty = brand tint (#F0F7FF) |
| Highlight colour | Latest Result, BOP, Oil Marketing, Portfolio Investment, Trade-SBP, Remittance, Central Government Debt, Fertilizer, Currency, Auto | the current-period columns, every row (BOP, Oil Marketing, Trade-SBP, Remittance, Central Government Debt, Fertilizer, Auto: the latest month and year to date; Portfolio Investment: the main table's Net column; Currency: the USD column); text ink or white, ratio shown | any colour; empty follows the fill |
| Negative figures colour | BOP | negative amounts in the table and the Excel cells; on a highlight, kept only where it reads | any colour; empty = negative red (#B91C1C, the scheme's in dark); ratio on white shown |
| Bar colour | BOP, Portfolio Investment, Remittance | the chart's bars on screen; Portfolio Investment's and Remittance's Excel charts; Remittance's PNG/PDF | any colour; empty = palette blue (#1485FF); ratio on white shown |
| Line colour | BOP, Remittance | BOP's fiscal-year line and dots; Remittance's YoY line, in its downloads too | any colour; empty = palette orange (#EA580C); ratio on white shown |
| Source | MTS, Oil Marketing, Portfolio Investment, Trade-PBS, Trade-SBP, Settlement, Remittance, Central Government Debt, Cement, Fertilizer, Currency, Auto | the source line, on screen and in every download | empty = each report's own |

- **Code**: `src/branding/` (types, contrast, CSS variables, logo processing,
  font imports, the store) and `src/data/branding.ts` (storage: localStorage,
  one key for the settings and one for the logo, validated field by field on
  read). That file is the seam for an account-level API. The drawer UI is
  `src/components/app/ReportStyleSettings.tsx`.
- **Saved per COMPANY** (the user's decision, 2026-09-11). There is one
  user per company, so the company's account is the key: the style follows
  the company to any browser or computer. Today it is per BROWSER instead
  (keys carry no account; sign-in is a fixture with one account, and sign
  out keeps the applied style), so two companies sharing a browser would
  share it. When sign-in is real, `src/data/branding.ts` reads and writes
  the company's style on the server; nothing above it changes. The
  Appearance (light/dark) choice stays on the device: it is personal.
- **How it reaches the sheet**: `reportVars()` sets `--report-*` custom
  properties on each view's wrapper, so the toolbar, the sheet and the
  export stage inherit them. Stylesheets read each with the design-system
  token as fallback: unstyled is exactly the old sheet and follows the
  scheme. A chosen colour is the same in both schemes; the text colour on a
  chosen fill or highlight comes from the LIGHT tokens. An uploaded logo sits
  on a light plate in dark mode. A new publication view applies
  `reportVars(styleOnReport(placementFor(slug), branding))` the same way.
- **No flash of the wrong brand**: `BRANDED_FLAG_SCRIPT` in the root layout's
  head marks `<html data-report-branded>` before first paint when storage
  holds a style or logo, and the view stays hidden until the store has
  hydrated (`data-branding-ready`), with a 2s CSS fallback. The store is
  `useSyncExternalStore` with the defaults as the server snapshot, so there
  is no hydration mismatch (checked on a clean load).
- **Measured**: every font at every size at 1920×960 — no table overflow,
  one-line title, sheet bottom at most 952px, so the MTS page still fits one
  screen. Adding a font = a Fontsource import in `fonts.ts` and an entry in
  `REPORT_FONTS`, then re-check tabular digits and italics: the design system
  sets `font-synthesis: none`, so a face without italics prints the source
  upright.
- **Uploads are trimmed to their artwork** (`src/branding/logo.ts`), so the
  artwork, not a transparent or white border, fills the box's height:
  transparent margins, or near-white ones when the file's border is white; a
  coloured background is part of the design and stays. SVGs keep their
  vectors: the drawing is rasterised, measured, and the viewBox tightened.
  Rasters are stored at up to four times the box (340 × 1240px). The drawer
  warns when a logo is wider than the box (prints below full height) or has
  too few pixels for its printed size (may print soft). Tested with ten
  shapes, from a 60×20px PNG to a 12:1 wordmark.
- **Export gotcha, keep the fix**: html-to-image copies each element's height
  as a fixed number and lays the text out again; some faces come out a
  fraction taller, which in a scroll region painted scrollbars into the PNG
  and cut off the last row (Source Serif 4 at 18px). `ExportStage.module.css`
  makes scroll regions `overflow: visible` on the stage. It also sets every
  font size a shade smaller (14px → 13.9px) and fixes every cell's width, so
  a table whose labels MAY wrap can come out with different columns from the
  screen — on Portfolio Investment the labels wrapped and the source line
  printed over the table. Check a new table's PNG, not only its screen.
- **The drawer has no scrim** (overlay opacity 0, no blur, page scroll left
  on) so the report beside it shows true colours while styling. It stays
  modal: focus trapped, Escape and an outside click close it.
- **ColorInput and Escape**: Mantine's drawer closes on any Escape unless the
  focused element carries `data-mantine-stop-propagation`, which Select sets
  and ColorInput does not. `ColourField` holds the picker's open state and
  sets the flag while it shows, so the first Escape closes the picker and the
  second the drawer.
- **Colour fields take a hex code** (the user asked for it): the field's own
  text is the code, typed with or without its `#`, three digits or six, any
  case (`normaliseHex`, which storage validation shares). The report follows
  as soon as the text is a whole colour; Enter or blur settles it to the
  six-digit code, and a half-typed one goes back to the colour in use. An
  empty field shows the default's code as placeholder ("#1485FF (brand
  blue)", from the LIGHT tokens because that is what prints) and the swatch
  shows the colour in use, default included; Mantine's own preview went
  white when empty. Codes display in capitals (CSS only; stored lowercase)
  and stay left to right on an RTL page (`unicode-bidi: plaintext`, not
  `dir="ltr"`, which would move the input's padding off the swatch). The
  picker still opens at black on an empty field: `ColorInput` feeds the text
  and the picker the same value.
- **Not white-labelled yet**: the page footer's disclaimer ("Ask Analyst is
  a product of Akseer Research") and the Excel logo. A workbook names the
  company in words, as it always did for the built-in mastheads. Nor is
  Portfolio Investment's PDF furniture — its footer name, research contact,
  Jama Punji mark and the disclaimer page are the Akseer–Alpha Capital joint
  venture's legal text (`src/data/disclaimer.ts`), which the company name
  does not change — nor the Morning Briefing's, which prints the contact
  and the footer line on the sheet itself, as its benchmark does.

## Auth pages

- `src/auth/client.ts` is the ONLY place that knows how the pages talk to a
  server. It is a fixture today; every call is already `async` and returns
  wire-shaped objects, so pointing the module at the identity service is a
  change to the function bodies there and nowhere else. Demo rules: the
  password `wrong` fails sign-in, `taken@example.com` fails sign-up.
- `src/auth/validation.ts` holds the email check and `PASSWORD_RULES`. The
  live checklist under the sign-up password renders from the same array the
  submit handler enforces, so the two cannot disagree.
- Forms use `@mantine/form` in uncontrolled mode with `noValidate` on the
  `<form>`: errors render beside their field (design system §8.5), never in
  browser bubbles. `required` stays on the inputs so assistive tech knows.
- The password visibility toggle is made focusable and named. Mantine takes it
  out of the tab order by default.
- `ProductPreview` in the brand panel is sample data built from design-system
  components and is `aria-hidden` as a whole. Its figures still go through the
  formatters and its delta still carries colour, glyph and a hidden word,
  because the real desk will copy that pattern.
- `/terms` and `/privacy` on the sign-up page are placeholders. Point them at
  the real documents when those exist.
- **The auth pages fit one screen without scrolling** from about 800px of
  viewport height (a 1440×900 window with browser chrome). The rhythm in
  `AuthForm.module.css` and `AuthLayout.module.css` is one step tighter than
  a content page, name and organisation share a row, the password rules read
  on one line, and the two SSO buttons share a line with the provider as the
  visible label and the full action as the accessible name. Adding a field
  means taking that height from somewhere else.
- **The header's only control is a burger** (`AuthMenu`) opening a drawer
  that holds the colour-scheme toggle, at every screen size. It keeps the
  header row to the lockup and one target on a phone.

## The benchmark, translated

The reference was a generic SaaS sign-in (pill inputs, placeholder-only
labels, purple gradient, product screenshot). The shape is kept; where it
meets a design-system rule, the rule wins:

| Benchmark | Here | Rule |
| --- | --- | --- |
| Pill-shaped inputs and buttons | 8px radius | §4 radius scale |
| Placeholder as the only label | Visible label, placeholder as example | §8.5 |
| Links by colour alone | Underlined `text-link` | §8.9 |
| Wave emoji in the heading | None | Icons rule 1 |
| "Remember me" pre-ticked | Off by default | Shared machines |
| Screenshot of the product | Preview built from components | Cannot drift |
| Leading mail / lock icons in inputs | None | Not in the curated icon set |

## Design system findings

The first two defects surfaced while building this module were fixed
upstream and the pinned tag includes both, so no workaround remains for them.
If either symptom reappears after a bump, it is a regression in the design
system, not something to patch here.

1. **`ColorSchemeToggle` hydration mismatch** with a stored scheme (Mantine's
   provider reads localStorage during the first client render). Fixed in
   v1.3.2: the toggle marks no segment until it has mounted.
2. **Touch-target rule inflated the Checkbox box** (in Mantine the input IS
   the drawn box). Fixed in v1.3.3: the box wrapper and the label take the
   44px floor, published as `--ask-touch-floor`; `data-pointer="coarse"`
   forces it on a subtree.
3. **Two themed Mantine icon buttons have no accessible name** (axe
   `button-name`, critical): the Drawer's close button and ColorInput's
   eyedropper. Worked around here with `closeButtonProps` and
   `eyeDropperButtonProps` aria-labels in `AccountMenu`, `AuthMenu` and
   `ReportStyleSettings`. The theme's `Drawer.extend` could default it. The
   close button is also 28px on a touch screen, under the 44px floor. Not
   yet filed upstream.
4. **`formatNumber` defaults to a minus sign**, though `format.d.ts` says
   "Accounting parentheses are the default": `formatNumber(-88598)` gives
   "-88,598". Pass `signStyle: 'parens'` for "(88,598)" (`ResultTable`).
   Either the comment or the default is wrong. Not yet filed upstream.
5. **Mantine's Tooltip keeps Mantine's inverted colours** (near-black in
   light mode, light grey in dark) while the system's own chart tooltips
   follow the scheme (`--ask-chart-tooltip-bg` / `-border`, white and
   slate). The theme's `Tooltip.extend` sets only radius, arrow and delays.
   Styled here with the chart tokens (`.tooltip` in
   `ReportStyleSettings.module.css`); the theme could set the same
   classNames. Not yet filed upstream.
6. **A disabled FILLED button falls through to Mantine's disabled colours**:
   the theme gives disabled DEFAULT buttons its own look (bg-muted,
   border-default, text-disabled) but not filled ones, which get
   `--mantine-color-disabled` — Mantine's neutral `dark-6` #2E2E2E with
   `dark-3` text in dark mode, charcoal on the slate drawer. Worked around
   for the idle Apply button (`.applyBar` rule). Not yet filed upstream.
7. **With a drawer open, axe reports a second banner**
   (`landmark-no-duplicate-banner` and `landmark-unique`, moderate):
   Mantine's Drawer and Modal header is a `<header>` inside
   `section[role=dialog]`, and axe 4.13 maps it to banner because that
   section's role is dialog. Scans with the drawers closed are clean.
   Mantine's markup, found 2026-09-11; not worked around, not yet filed.
8. **`sr-only` on a `<table>` widens the page**: a table ignores the 1px
   width (it is a minimum for tables) and `overflow` does not apply to it,
   so the hidden table grows to its text and scrolls the page sideways —
   70px on BOP. `AskChart` puts `sr-only` on its data table this way. Wrap
   the table in a `div.sr-only` instead (`BopChart`). Not yet filed.

## Layout

The form measure is four columns of the design system's twelve-column grid
(4 × 90 + 3 × 20 = 420px), derived in `AuthLayout.module.css` from the grid
tokens rather than typed. The lockup, the form and the foot note share it, so
they share one inline-start edge.

From the lg breakpoint the brand panel is sticky at the viewport height and
inset by one spacing step; below it, it is not rendered. Its gradient is the
brand ramp only (`--mantine-color-brand-9` to `-6`), which Mantine binds to
the design system's blue, so no foreign hue enters the page.

## Before calling a change done

```bash
npm run lint       # oxlint, src and app
npm run typecheck  # tsc --noEmit
npm run build      # next build
npm run verify     # icon and RTL audits, vendored from the design system
```

`npm run verify:a11y` needs the dev server on :3000. Expect exactly the design
system's recorded deviation — white on `#1485ff` on the filled button and the
active toggle label — and nothing else. Anything else is a regression.

`scripts/verify-icons.mjs` and `scripts/verify-rtl.mjs` are copied verbatim
from the design system repo. Do not edit them here; update them upstream and
re-copy, or the two drift apart.

## Repository and deployment

- **GitHub**: `Zia128111/ask-analyst-publisher`, PUBLIC (the user's call,
  2026-09-11), `main`. Push as `Zia128111` — gh's active account on this
  machine is `ziaali-dotcom`; switch for the push and back after.
- **Vercel**: project `ask-analyst-publisher` in "Zia's projects"
  (`zias-projects-6ff07fa3`), production https://ask-analyst-publisher.vercel.app.
  The folder is linked (`.vercel/project.json`, git-ignored).
- **Vercel cannot build this repo from GitHub**: its `npm install` cannot
  fetch the PRIVATE `Knowbridge-UI/Design-system` (the Market Page's Git
  builds fail the same way). So `vercel.json` turns Git deployments off
  (`git.deploymentEnabled: false`) and production is deployed from the CLI.
- **`vercel build` on Windows fails** after a good `next build` ("Unable to
  find lambda for route: /alphacapital/auto" — the builder's Windows paths),
  so a prebuilt deploy from this machine does not work either.
- **How it is deployed** (2026-09-11): a copy of the committed tree (`git
  archive HEAD`) in a temp folder; the INSTALLED design system packed into
  it (`npm pack node_modules/@akseer/ask-analyst-design-system
  --ignore-scripts --pack-destination vendor` — its `prepack` would rebuild
  it); in the copy only, the dependency pointed at
  `file:vendor/akseer-ask-analyst-design-system-1.3.3.tgz` and the lockfile
  updated (`npm install --package-lock-only --ignore-scripts`); this
  folder's `.vercel/project.json` copied in; then `vercel deploy --prod
  --cwd <copy>`, which builds on Vercel's Linux machines. The tarball goes
  only to the Vercel project, NEVER into the public repo: the package is
  UNLICENSED. The lasting fix is a registry Vercel can read (the design
  system published privately, a token in the project's env).

## Design system version

The design system lives at **`Knowbridge-UI/Design-system`** and the dependency
is pinned to the **`v1.3.3`** tag:

```bash
npm i "github:Knowbridge-UI/Design-system#v1.3.3"
```

Pinned to a tag, not a branch, so a build months from now resolves the same
commit. Bump it deliberately after reading the changelog. v1.3.4 (Lato
vertical metrics) is out and not yet taken; bumping moves baseline-aligned
layouts by up to a pixel, so re-measure the MTS sheet when you do. The
`design-system-docs` entry in `.claude/launch.json` runs the system's living
docs from the local clone at `D:\Claude for Design\Ask Analyst New UI`.

**The repo is PRIVATE.** Two GitHub accounts are in play on this machine:
`ziaali-dotcom` can see `Knowbridge-UI`; `Zia128111` cannot. An `npm i` that
fails with *"Repository not found"* is an AUTH failure, not a missing repo —
check `gh auth status` first. The first install on Windows sometimes fails
with an `EPERM` cleanup error and succeeds on a plain retry.

React and Mantine are peer dependencies of the design system and are
satisfied by this app's own direct dependencies. Do not add them back as
dependencies of the design system: a second copy of React breaks hooks. All
`@mantine/*` packages must stay on the same minor.
