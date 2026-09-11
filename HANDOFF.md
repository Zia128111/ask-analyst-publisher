# Handoff — Ask Analyst Publisher (2026-09-11)

## Goal
Build the Ask Analyst **Publisher** module in Next.js 16 (App Router) + Mantine 9 on the
Ask Analyst Design System (`github:Knowbridge-UI/Design-system#v1.3.3`, local clone at
`D:\Claude for Design\Ask Analyst New UI`). Pages copy the user's benchmark screenshots
exactly; design-system rules sit underneath. Read `CLAUDE.md` first — it is the full spec.

## Completed
- **Auth pages** `/sign-in`, `/sign-up`, `/forgot-password`: one screen, no scroll; a burger
  drawer holds the colour-scheme toggle. Fixture auth in `src/auth/client.ts`.
- **Inner pages** `/[edition]/[publication]` (editions askanalyst, alphacapital, ksa). Built:
  **MTS**, **Latest Result**, **BOP**, **Oil Marketing**, **Portfolio Investment**,
  **Morning Briefing**, **Trade-PBS**, **Trade-SBP**, **Settlement**, **Remittance**,
  **Central Government Debt**, **Cement**, **Fertilizer**, **Currency** and **Auto** — every
  publication tab; only KSA's briefing (a different report) shows a pending page.
- **Repo and deploy** (2026-09-11): public GitHub repo `Zia128111/ask-analyst-publisher`;
  Vercel project `ask-analyst-publisher` ("Zia's projects"), live at
  https://ask-analyst-publisher.vercel.app. Git deployments are OFF (Vercel cannot install the
  private design system); production went out with `vercel deploy --prod` from a temp copy
  carrying the packed design system — the recipe is in CLAUDE.md "Repository and deployment".
- **Auto / Auto Sales Volumes** (2026-09-11, from the user's screenshot of the live page, the
  last tab): `api/msg/autos` (fixture; msg/pbs's rows without the year to date) on
  `MonthlyView` at 9 grid columns — makers bold with their models, then engine sizes, Total
  Passenger Cars, other vehicles, Industry; Jul-26 tinted; heading over the labels blank as live.
  Models are read with their maker only where they add up to it (`makersModels`). Live title's
  "August-25" is hard-coded in its script → ours "Auto Sales Volumes (July-26)". WagonR's and
  Ravi + Bolan's YoY "NM" for a fall to zero, carried. Drawer = Oil Marketing's list.
- **Currency / Weighted Average Exchange Rates** (2026-09-11, from the user's screenshot of the
  live page): `api/msg/currency` (fixture) — Current Date, Previous Date and Change, each a bold
  row with Buying and Selling indented, for CNY EUR GBP JPY SAR USD; rates to four decimals,
  changes to two; the USD column tinted (the highlight). Its own `RatesTable`, 9 grid columns.
  The user's calls: EVERY heading centred, "Currency" too; figures centred; row labels start.
  The feed's date is 22 Aug 2025 (a year stale; the live page prints it too) — told the user.
  Drawer = MTS's list + highlight ("Fills the USD column.").
- **Fertilizer / Offtake and Inventory** (2026-09-11, from the user's screenshot of the live
  page): `api/msg/fertilizer` (fixture), on `MonthlyView` at 10 grid columns — products as
  heading rows with their companies and TOTAL, spacer rows between, the month and the CALENDAR
  year to date tinted, Inventory last. Title names the table's month (live: stale "Jun-25");
  "Period" heading kept; the tab renamed "Fertilizer" (slug `fertilizer`) to match the live
  site. Drawer = Oil Marketing's list.
- **Cement / Cement Price History (PKR/bag)** (2026-09-11, from the user's screenshot of the live
  page): `api/msg/cement` (fixture; an array of regions with 51 weekly prices; no date — stamped
  with the transcription day). The latest five weeks in the table (nothing tinted, units in the
  title) and the year as a smoothed line per region on a date axis, inside the sheet, 7 grid
  columns (live 690px). Chart colours = DS palette order (not in the drawer: one bar/line colour
  each); drawer = MTS's list. Downloads carry the chart; Excel = table + History with a native
  two-line chart (the writer's `second.axis: 'primary'`).
- **Central Government Debt** (2026-09-11, from the user's screenshot of the live page):
  `api/msg/cgd` (fixture), the monthly table with THREE indent levels at 10 grid columns (the
  live width), this month tinted. The trade view became `MonthlyView` (SHEETS per slug: look,
  width, sheet name, notes, optional title), which now serves Trade-PBS, Trade-SBP and CGD.
  Three live quirks handled and reported: the unheaded last column is headed "FYTD %" (the change
  since the fiscal year's close, Jun-26); the title's stale "Apr-25" became the table's month
  (Jul-26); the first heading "Label" kept as shown. Drawer = Oil Marketing's list.
- **Remittance / Workers' Remittances (USD Mn)** (2026-09-11, from the user's screenshot of the
  live page): `api/msg/remittances` (fixture incl. 121 months of chart history) — the monthly
  table (this month tinted, units in the title) and under it, inside the sheet, a Google
  ComboChart of the latest 43 months: total bars (USD axis, from zero) + YoY line (% axis),
  gridlines shared (`remittanceAxes`). I first built it as two panels for the design system's
  single-axis rule; the user asked "bar and line chart cant be in one chart?" and, offered the
  options, chose ONE chart with TWO axes — the documented exception. Downloads include the chart
  (the export copy waits for `data-ready`); Excel = table + History sheet with a native combo
  chart (the writer gained line charts, a second axis and fixed scales). Live-page bug fixed: its
  MoM/YoY columns are swapped. Feed oddity reported: Other Countries' changes.
- **Settlement / Settlement of top 10 traded stocks** (2026-09-11, from the user's screenshot of
  the live page): `api/msg/settlement` (fixture: date = the trading day, 10 Sep; ten stocks with
  volume, value and the UIN / CM settlement %), its own `SettlementTable` — two-row header,
  "Symbol" down both rows, "Trade" and "Settlement (%)" as column groups — at 9 grid columns
  (the live width). The user's calls mid-build: each group on its own rule, BROKEN between the
  groups; column headings centred; figures centred. Drawer = MTS's list. PNG, PDF (portrait),
  Excel (a narrow blank column between the groups so the rules break there too).
- **Trade-SBP / Export of Services break-up (USD mn)** (2026-09-11, from the user's screenshot of
  the live page): `api/msg/trade` (fixture), the same shape as msg/pbs, on the shared monthly
  table and ONE view for both trade sheets (`TradeView`, `kind` pbs|sbp; `TradePbsView` is
  gone). Its live page's look: this month tinted (as BOP), the heading over the labels blank
  (the title carries "(USD mn)"; `unitsInTitle` keeps it for screen readers), a blank spacer row
  between exports and imports (`spacer`, aria-hidden). July year-to-date columns left out, as on
  Trade-PBS. Drawer = Oil Marketing's list. Feed oddity reported: the Others line's changes are
  the services' change less the listed types'. Follow-up (user: "Match the size of grid, i think
  our table is a bit consize width wise"): BOTH trade sheets now span 9 grid columns (970px) at
  every text size, the live pages' ~955px (`SHEET_COLUMNS` in `TradeView`); PNG 2004px wide,
  PDF still A4 portrait (text prints ~7.3pt at 14px). BOP, OMC and MTS keep their widths.
- **Trade-PBS / Balance of Trade** (2026-09-11, from the user's screenshot of the live page:
  "It's straight forward. Like previous pages. Adjust drawer filters accordingly."): the MTS
  letterhead over the month's trade in goods from `api/msg/pbs` (fixture) on the shared monthly
  table, which gained indented detail lines, section rows with no figures, one-decimal changes
  and a per-sheet `MonthlyLook`. Its look is the live page's: nothing tinted, the deficit in
  parentheses in the text colour. July leaves out the three year-to-date columns the live page
  prints under empty headings (as BOP does). Drawer = MTS's list. PNG, PDF (A4 portrait), Excel.
  Two feed oddities carried as published and reported to the user (see CLAUDE.md "Trade-PBS").
- **Morning Briefing** (2026-09-11, from the user's screenshots of the live page + "MB
  09112026.pdf"): the FIRST page on its LIVE feed (`api/morningbriefingchart`, server fetch,
  revalidate 300s, transcribed copy as fallback). The user's calls during the build: the sheet
  spans the full grid "inline with tab start and end"; the header EXACTLY the reference's (date,
  logo, blue title between blue rules) in "our blue"; the tables "this exact way" (the live
  page's look: blue name, striped rows, centred figures) in DS colours; the foot's contact,
  publisher line and Jama Punji mark. PNG = the screen; PDF = 2 A4 portrait pages (a 10-column
  print copy + clickable links, then the MB disclaimer with 3 cropped logos), on the reference's
  ~6mm side margins after the user asked for wider content; Excel = News (hyperlinks) + Markets
  sheets. No row hover on this page's tables (user). KSA's briefing is a different report
  (`api/ksa/msg/mb`), left pending via `isBuilt`. See CLAUDE.md "Morning Briefing".
- **Portfolio Investment / FIPI / LIPI Daily Movement** (2026-09-11, from the user's screenshot
  of the live page + the day's PDF): MTS letterhead across the full grid over the main table
  (8 local types + LIPI Net, 3 foreign + FIPI Net, WTD/MTD/CYTD/FYTD; Buy/Sell/Net + 11 sectors),
  then the second table (no sectors) beside a Google column chart of each type's net. The
  user's download spec: **PNG = two files in one click** (main table, second table, each with
  the letterhead); **PDF = 2 pages** (the main table; the Akseer–Alpha Capital disclaimer as
  text, footer with the Jama Punji mark, after their reference PDF); **Excel = both tables + a
  native Excel chart** in one sheet. First built with the live page's dark blue/grey as page
  defaults; the user said "The default colors are wrong in table use like previous screens",
  so it uses every sheet's tint/blue now. Drawer from the screen: company, logo, font, size,
  border, fill, highlight (Net column), source; Chart: bar colour. See CLAUDE.md.
  Follow-up (user's screenshot): the PNG/PDF had two-line labels and the source line printed
  over the last rows — caused by letting the table's name wrap (my fix for Inter at 18px).
  Now no label ever wraps ("keep all first column in one line"), and the export stages are
  `fit`: a table wider than its sheet (only Inter 18px, +64px) widens the picture instead of
  losing columns. The user said everything else is fine — don't touch it.
- **Oil Marketing / OMCs Cumulative Sales** (2026-09-11, from the user's /omc screenshot): MTS
  letterhead over 25 rows (industry + five OMCs, each with MS/HSD/FO) × nine columns, current
  month and year to date tinted. Drawer chosen from the screen (the user left it to me): company
  name, logo, font, size, border, fill, highlight, source. BOP and Oil Marketing now SHARE the
  monthly table, parsing and workbook (`monthly.ts`, `MonthlyTable`, `monthlyWorkbook.ts`).
- **BOP / External Account Highlights** (2026-09-11, from the user's /bop screenshots): the MTS
  letterhead over the month's table (negatives red in parentheses, this month tinted, balances
  bold) at 7 grid columns, beside a Google ComboChart at 5 — bars = monthly current account
  balance, line = its fiscal-year running total (the user's choice) — with "Powered by Ask
  Analyst". Downloads are the TABLE PART ONLY (the user's call): PNG/PDF picture the sheet
  (PDF A4 portrait, as MTS) and Excel holds the table. Drawer offers Latest Result's list + Company name (the band, as MTS — the user asked)
  + Negative figures / Bar / Line colours, under **Table** and **Chart** headings (the user's
  ask; the groups show on every report). See CLAUDE.md "BOP".
- **MTS** (user: "this page is done"): benchmark-exact table, masthead switch (Alpha Capital |
  Ask Analyst | uploaded logo), Download menu (PNG, PDF, Excel).
- **Latest Result** (this session, from the user's LUCK benchmark): company search (type to
  match ticker or name, or scroll the list), the company letterhead (ticker, name, units, share
  price + change + date, logo), the P&L summary with the current quarter and period to date
  tinted, Download menu. Company in the URL (`?company=EFERT`). Ten companies' real data in the
  fixture, transcribed from the live page's feed. PDF prints A4 landscape.
- **Upstream design-system releases** made on request: v1.3.2, v1.3.3, v1.3.4 (see CLAUDE.md).
- **White-label "Report style"** in the account drawer (avatar, top right), with **Apply /
  Discard**. Applies to the sheet and to all three downloads. This session:
  - colour fields take a typed hex code (`#` optional, 3 or 6 digits);
  - **each report offers its own settings** (`src/branding/placement.ts`): MTS all of them;
    Latest Result only logo, border colour, fill colour (header row), highlight colour
    (current columns, new setting), font and text size — the user's list. The drawer shows
    only those, the report applies only those, Reset resets only those;
  - **explainers moved into tooltips** behind an "i" beside each label; every control sits
    4px under its label, copying the page's "Company" label-to-search gap (the user's ask).
- **Drawer polish (2026-09-11, the user's list)**: Table text size first, then logo, name, font,
  colours, source; every field has an "i" at the END of its label line (icons line up over the
  fields' chevron/eyedropper); each tooltip is one plain line (`describe` in `placement.ts`) and
  follows the scheme (white in light mode, slate in dark, DS chart-tooltip tokens); Upload logo and
  Reset style full width, Replace/Remove and Apply/Discard equal halves; logo advice in grey type
  (amber icon kept); idle Apply on the DS disabled look in dark mode instead of Mantine's charcoal.
  Files: `ReportStyleSettings.tsx/.module.css`, `branding/placement.ts`, CLAUDE.md, README.md.

## Files created or changed (2026-09-11, Auto)
- New: `src/data/auto.ts`.
- Changed: `views/MonthlyView.tsx` (`auto` in SHEETS, `longMonth`), the route
  (`MONTHLY_SHEETS`), `data/publications.ts` (title "Auto Sales Volumes", BUILT),
  `branding/placement.ts` (`auto`), docs.

## Files created or changed (2026-09-11, Currency)
- New: `src/data/currency.ts`, `src/components/report/RatesTable.tsx/.module.css`,
  `src/views/CurrencyView.tsx`, `src/exports/currencyWorkbook.ts`.
- Changed: `data/types.ts` (`RatesSection`, `CurrencyReport`), the route (currency branch),
  `data/publications.ts` (title "Weighted Average Exchange Rates", BUILT),
  `branding/placement.ts` (`currency`), docs.

## Files created or changed (2026-09-11, Fertilizer)
- New: `src/data/fertilizer.ts`.
- Changed: `views/MonthlyView.tsx` (`fertilizer` in SHEETS), the route (`MONTHLY_SHEETS`),
  `data/publications.ts` (slug/label `fertilizer`/"Fertilizer", title, BUILT),
  `branding/placement.ts` (`fertilizer`), docs.

## Files created or changed (2026-09-11, Cement)
- New: `src/data/cement.ts`, `src/components/report/CementChart.tsx`, `src/views/CementView.tsx`,
  `src/views/SheetWithChart.module.css` (was `RemittanceView.module.css`, now shared),
  `src/exports/cementWorkbook.ts`.
- Changed: `data/types.ts` (`PriceSeries`, `CementReport`), `lib/xlsx.ts` (`second.axis`:
  'primary' puts a second line on the first series' axis — Remittance's two-axis chart re-read
  unchanged), `views/RemittanceView.tsx` (stylesheet import), `data/publications.ts` (title
  "Cement Price History (PKR/bag)", BUILT), the route, `branding/placement.ts` (`cement`), docs.

## Files created or changed (2026-09-11, Central Government Debt)
- New: `src/data/centralGovernmentDebt.ts`, `src/views/MonthlyView.tsx` (replaces
  `TradeView.tsx`, deleted).
- Changed: `data/monthly.ts` (FYTD change headings, compared with the column before the current
  one; `outlineRow` shared by `msgRow`, labels verbatim), `data/tradePbs.ts` (capitalises its
  own "knitwear" now), the route (`MONTHLY_SHEETS` map for MonthlyView), `data/publications.ts`
  (BUILT), `branding/placement.ts` (`central-government-debt`), docs.

## Files created or changed (2026-09-11, Remittance)
- New: `src/data/remittance.ts`, `src/components/report/RemittanceChart.tsx`,
  `remittanceAxes.ts`, `src/views/RemittanceView.tsx/.module.css`,
  `src/exports/remittanceWorkbook.ts`.
- Changed: `data/types.ts` (`RemittanceMonth`, `RemittanceReport`), `data/monthly.ts` (change
  headings may end " %"), `report/ReportChart.module.css` (`.axes`), `report/sheetDownloads.ts`
  (waits for `[data-chart]` frames to be `data-ready`), `lib/xlsx.ts` (`XlsxColumnChart` →
  `XlsxChart`: `kind` line, optional `labelFormat`, `labelEvery`, `scale`, `second` + legend),
  `exports/monthlyWorkbook.ts` (`monthlySheet` extracted; `buildMonthlyWorkbook` wraps it — BOP's
  workbook re-read unchanged, PI's chart re-read unchanged), `data/publications.ts` (title, BUILT),
  the route, `branding/placement.ts` (`remittance`), docs.

## Files created or changed (2026-09-11, Settlement)
- New: `src/data/settlement.ts`, `src/components/report/SettlementTable.tsx/.module.css`,
  `src/exports/settlementWorkbook.ts`, `src/views/SettlementView.tsx`.
- Changed: `data/types.ts` (`SettlementLine`, `SettlementReport`), `data/publications.ts` (title
  "Settlement of top 10 traded stocks", BUILT), the route, `branding/placement.ts`
  (`settlement`), docs. Export lesson kept in CLAUDE.md: a positioned `::after` rule got a fixed
  pixel width in the PNG; the group rules are percent-sized backgrounds instead.

## Files created or changed (2026-09-11, Trade-SBP)
- New: `src/data/tradeSbp.ts`, `src/views/TradeView.tsx` (both trade sheets; replaces
  `TradePbsView.tsx`, deleted).
- Changed: `data/monthly.ts` (`MsgRow`, `msgRows`, `msgRow` — moved out of `tradePbs.ts`, which
  now uses them; `outlineLines` skips spacers), `data/types.ts` (`MonthlyRow.spacer`),
  `report/monthlyLook.ts` (`unitsInTitle`; `TRADE_LOOK` removed — the trade looks live in
  `TradeView`'s `SHEETS`), `report/MonthlyTable.tsx/.css` (spacer rows, hidden units heading,
  no hover on spacers), `exports/monthlyWorkbook.ts` (blank units cell), `data/publications.ts`
  (title, BUILT), the route (one trade branch), `branding/placement.ts` (`trade-sbp`), docs.

## Files created or changed (2026-09-11, Trade-PBS)
- New: `src/data/tradePbs.ts`, `src/views/TradePbsView.tsx` (since folded into `TradeView`),
  `src/components/report/monthlyLook.ts` (`MONTHLY_LOOK`).
- Changed: `data/types.ts` (`MonthlyRow.indent`/`heading`, `MonthlyReport.changeDecimals`),
  `data/monthly.ts` (`outlineLines`; `msgHeadings`, `feedDate`, `MONTHS`, `MsgHead` moved here
  from `bop.ts`, which now imports them — BOP re-checked, unchanged), `report/MonthlyTable.tsx/.css`
  (look, decimals, indent, section rows, one-line labels), `exports/monthlyWorkbook.ts` (look,
  decimals, indent), `lib/xlsx.ts` (`indent` alignment), `data/publications.ts` (title "Balance
  of Trade", BUILT), the route, `branding/placement.ts` (`trade-pbs`), docs.

## Files created or changed (2026-09-11, Morning Briefing)
- New: `src/data/morningBriefing.ts` (live fetch + copy), `src/views/MorningBriefingView.tsx/.css`,
  `src/components/report/BriefingLetterhead.tsx/.css`, `NewsList.tsx/.css`,
  `MarketTable.tsx/.css`, `briefingFigures.ts`, `src/exports/briefingPdf.ts`,
  `src/exports/briefingWorkbook.ts`, `public/brand/akseer.png`, `alpha-capital.png`,
  `jamapunji-urdu.png` (cropped from the MB reference PDF).
- Changed: `data/types.ts` (Briefing*), `data/disclaimer.ts` (`BRIEFING_FURNITURE`),
  `data/publications.ts` (BUILT, `isBuilt`, KSA pending), the route (MB branch, `isBuilt`
  fallback), `branding/placement.ts` (`morning-briefing`), `lib/snapshot.ts` (link boxes),
  `lib/xlsx.ts` (several sheets, hyperlinks, underline), `report/sheetDownloads.ts`
  (`pdfStage`). The PI and OMC workbooks were re-read in Excel after the writer change.

## Files created or changed (2026-09-11, Portfolio Investment)
- New: `src/data/portfolio.ts`, `src/data/disclaimer.ts`, `src/views/PortfolioView.tsx/.module.css`,
  `src/components/report/FlowTable.tsx/.css`, `flowFigure.ts`, `PortfolioChart.tsx`,
  `ReportChart.module.css` (was `BopChart.module.css`, now shared), `src/exports/portfolioPdf.ts`,
  `src/exports/portfolioWorkbook.ts`, `public/brand/jamapunji.png` (cropped from the reference).
- Changed: `data/types.ts` (Portfolio*), `data/publications.ts` (title "FIPI / LIPI Daily
  Movement", BUILT), the route, `branding/placement.ts` (`portfolio-investment`),
  `branding/types.ts` (`familyName`, used by BopView too), `report/ExportStage.tsx/.css`
  (`style`, `fit`, `--sheet-grow`), `report/ReportSheet.module.css` (measure + `--sheet-grow`,
  unset everywhere but a `fit` capture), `report/sheetDownloads.ts` (`morePictures`,
  `buildPdf`, `fitToTables`), `lib/pdf.ts` (exports the margin), `lib/xlsx.ts` (native column
  charts, page orientation), `ReportStyleSettings.tsx` (comment).

## Files created or changed (2026-09-11, Oil Marketing)
- New: `src/data/omc.ts`, `src/data/monthly.ts`, `src/views/OmcView.tsx`,
  `src/components/report/MonthlyTable.tsx/.css` (was `BopTable`), `monthlyCaption.ts`,
  `src/exports/monthlyWorkbook.ts` (was `bopWorkbook.ts`).
- Changed: `data/types.ts` (Bop* → Monthly*; `BopReport extends MonthlyReport`; `group` on
  rows), `data/bop.ts` (on the shared helpers), `views/BopView.tsx`, `branding/placement.ts`
  (`oil-marketing`), `data/publications.ts` (title "OMCs Cumulative Sales", BUILT), the route.

## Files created or changed (2026-09-11, BOP)
- New: `src/data/bop.ts`, `src/data/fiscalYear.ts`, `src/views/BopView.tsx/.module.css`,
  `src/components/report/BopTable.tsx/.css`, `BopChart.tsx/.css`, `src/exports/bopWorkbook.ts`.
- Changed: `data/types.ts` (Bop*), `data/publications.ts` (BUILT, title), `branding/types.ts`
  (negative, bar, line, `CHART_DEFAULTS`), `data/branding.ts`, `branding/contrast.ts`
  (`readableOn`, `PAPER`, `AA_GRAPHIC`), `branding/reportVars.ts` (negative vars),
  `branding/placement.ts` (bop), `ReportStyleSettings.tsx/.css` (`FieldGroup`, new fields,
  `PaperReadout`), `lib/snapshot.ts` (foreign stylesheets set aside), `lib/xlsx.ts`
  (`styleRegistry`, used by `resultWorkbook` too), the route, `package.json`
  (`react-google-charts` ^5.2.1, the DS's own), docs. (`useExportStage` briefly gained a
  wait-for-the-chart option; removed again when the downloads became table-only.)

## Files created or changed (2026-09-10)
- New: `src/data/latestResult.ts` (fixture + accessors), `src/data/resultPrecision.ts`,
  `src/views/LatestResultView.tsx`, `src/components/report/CompanySearch.tsx/.css`,
  `CompanyLetterhead.tsx/.css`, `ResultTable.tsx/.css`, `useMasthead.ts` and
  `sheetDownloads.ts` (both shared with MtsView), `src/exports/resultWorkbook.ts`,
  `src/branding/placement.ts`.
- Changed: `data/types.ts` (Company, ResultColumn, ResultRow, SharePrice, LatestResult),
  `data/publications.ts` (BUILT), `data/branding.ts` + `branding/types.ts` + `reportVars.ts`
  (highlight), `branding/store.ts` (`resetStyle(keys)`), `branding/contrast.ts`
  (`normaliseHex` takes no `#`), `report/ReportSheet.tsx` (`letterhead` slot),
  `views/MtsView.tsx` (uses the shared helpers; behaviour unchanged),
  `views/PublicationView.module.css` (`.search`, `.roomy`), `lib/pdf.ts` (orientation),
  `app/(app)/[edition]/[publication]/page.tsx` (latest-result branch, `?company=`, title),
  `app/AppShell.tsx` → `AccountMenu.tsx` → `ReportStyleSettings.tsx/.css` (publication,
  `Field` + tooltips, per-report offers), CLAUDE.md, README.md.

## Key decisions (and why)
- **Nothing is saved until Apply** — the user asked for it so a refresh keeps their choice.
- **Logo box rules, stated by the user three times**: fixed box, full height, proportions kept,
  never leaves the box, **never squeezes the text on the left**. Latest Result's box is its
  text block's height (57.6px) under the same rules.
- **Benchmark fidelity with DS rules underneath**: Latest Result keeps the Download *menu*
  (the user chose it on MTS) rather than the benchmark's three icons, adds a visible "Company"
  label (§8.5), 14px type, `formatDate`, and consistent precision ("10.0", "4.00" where the
  live page drops zeros). Stated to the user.
- **Precision is a rule** (amounts 0, changes 1, EPS 2/quarter 1/to date, DPS 2): the feed is
  inconsistent about trailing zeros; per-cell digits would misalign or invent precision.
- **Company via URL + server fetch**: only the latest-result branch reads `searchParams`, so
  those two pages are dynamic and everything else stays prerendered.
- **User feedback this session**: don't distort the layout so long statements (banks, 23 rows)
  fit one screen; the page's spacing is 24px search→switch row, 16px → sheet (MTS unchanged,
  it has no room); the drawer copies the "Company" label spacing; explainers as "i" tooltips.
- Styling goes through `--report-*` custom properties with DS token fallbacks; unstyled = the
  original sheet, following light/dark.

## Open issues
- **BOP chart history: waiting on the user** ("I'll provide history", 2026-09-11). The feed
  (`/api/msg/bop`) sends one month (Jul-26, "-328%" with a stray %); drop the longer series into
  `src/data/bop.ts` (`chart` → `history`) and nothing else changes. Don't invent months.
- BOP's FY-to-date table columns (fy1/fy2/fy) appear from August; their heading labels are
  unknown until the feed sends them — check the table then. Same for Trade-PBS, whose feed's
  year-to-date change is the wrong way round (exports -9.4% where they rose 10.4%) and whose
  trade-deficit changes are the exports' change less the imports' — both carried as published
  and reported to the user; the feed's owner should fix them.
- Trade-PBS's look (nothing tinted, negatives in ink) follows its live page; BOP's tint and red
  are one `MonthlyLook` away if the user wants the monthly sheets to match. Trade-SBP's live page
  tints this month, so it does.
- Trade-SBP's "Others" line's changes are the services' change less the listed types' (MoM 6%,
  YoY -192%; really -0.9%, -7.9%) — carried as published, reported to the user.
- Remittance: the chart's window is the latest 43 months (the live chart's Feb-23 start today);
  whether the live page slides that window or keeps Feb-23 is unknown — check next month. The
  bars start from zero where the live axis starts at 1,500 (design-system bar rule kept; the
  user was told). Other Countries' changes are wrong in the feed (reported).
- The OMC feed has no date (the live page stamps the viewing day); the fixture uses 2026-09-11.
  A connected accessor should stamp the server's day in Karachi. July's OMC feed shape is unseen
  (the page follows whatever headings arrive).
- Latest Result fixture has 10 of the feed's 361 companies; the live API is
  `api.askanalyst.com.pk` (`/api/companylistwithids`, `/api/result/{id}`; price via
  `/api/shareprice`, which a plain GET does not serve). Pointing the accessors at it = edits
  to `src/data/latestResult.ts` only.
- The feed publishes DPS QoQ "0.0" after a zero quarter (the change is undefined) — carried
  as published; ask the user whether it should read "—".
- All ten prices are down on the day, so the up (green) change is untested with real data.
- DS findings not filed upstream (CLAUDE.md 3–8): Drawer close button / ColorInput eyedropper
  unnamed (worked around); `formatNumber` defaults to a minus though its comment says
  parentheses; Mantine Tooltip inverted vs the DS chart tooltip (styled locally); disabled FILLED
  buttons get Mantine's neutral greys (worked around on Apply); with a drawer open axe counts
  Mantine's drawer `<header>` as a second banner (pre-existing, not worked around); `sr-only`
  on a `<table>` (as `AskChart` does) widens the page (wrapped in a div in `BopChart`).
- Page footer still reads "Ask Analyst is a product of Akseer Research"; Excel has no logo image.
- Morning Briefing: the user linked a reference on WeTransfer (we.tl) for the header; not
  opened (a file download needs their go-ahead) — the header was built from their screenshot
  and the PDF. The feed's `announcement` list (empty on 11 Sep) is not printed; the live page
  prints none either — check when one arrives. The MB contact logos are crops of the reference.
  More than ~10 stories would shrink PDF page 1's picture to fit (no second page yet).
- Portfolio Investment's PDF furniture (footer name, research contact, disclaimer page, Jama
  Punji mark) is the JV's and not white-labelled; the Jama Punji mark is cropped from the
  reference PDF — swap in SECP's official artwork when supplied. The fixture is one day
  (10 Sep 2026); the feed's LIPI period totals and per-type period nets are not printed.
- Settings live in one browser only; no server or per-account storage yet. DECIDED
  (2026-09-11): the Report style is saved per COMPANY, and each company has one user, so the
  account's company is the key once sign-in is real (`src/data/branding.ts` only).
- Publisher pins DS v1.3.3; v1.3.4 (Lato metrics) is out and is still the newest remote tag.
- `gh` is signed in as `Zia128111`, which cannot see Knowbridge-UI; `ziaali-dotcom` can
  (`gh auth switch -u ziaali-dotcom`). Git over HTTPS can read the repo either way.
- Alpha Capital dark logo is derived, not supplied; meaning of the MTS "A" column unconfirmed.
- Not a git repository (the user has not asked for one).

## Verifying (known state: all green at handoff)
```bash
npm run lint && npm run typecheck && npm run verify && npm run build
npm run verify:a11y   # needs dev server on :3000; scans the auth pages only
```
- Dev server: `publisher` entry in `.claude/launch.json` (port 3000). Next allows ONE dev
  server per project folder: if the user runs `npm run dev` in their terminal, the preview fails
  with "Another next dev server is already running" (check the terminal before killing
  anything). Test pages
  `/alphacapital/mts`, `/alphacapital/latest-result`, `?company=MEBL` (longest), `?company=PSO`
  (9M columns), `/alphacapital/bop` (stacks under 1300px of room; 1024 and 375 checked),
  `/alphacapital/oil-marketing` (fits 750/860/970 at the three sizes; ends at 1008px),
  `/alphacapital/portfolio-investment` (full grid; second table + chart stack under 970px),
  `/alphacapital/morning-briefing` (live feed; stacks under 860px of sheet; axe 0 light/dark),
  `/ksa/morning-briefing` (pending, no self-link), `/alphacapital/trade-pbs` (ends at 900px;
  every face and size fits, with and without the year-to-date columns; axe 0 light/dark; 375
  scrolls in its region; PNG, PDF and Excel checked 2026-09-11 — the axe bundle and the file
  dump went through the temporary `app/api/dump-tmp` route, deleted after),
  `/alphacapital/trade-sbp` (ends at 656px; fits every face and size in July; axe 0 light/dark;
  the highlight draft reaches the tinted column and the spacer; PNG, PDF, Excel checked),
  `/alphacapital/settlement` (ends at 618–665px; every face and size on one line; axe 0
  light/dark; 375 scrolls in its region with the symbols pinned; PNG, PDF, Excel checked),
  `/alphacapital/fertilizer` (1,080px; ends at 791px; every face and size fits; axe 0 light/dark;
  PNG, PDF, Excel checked),
  `/alphacapital/auto` (970px; every face and size on one line; ends at 1,171–1,302px; axe 0
  light/dark; 375 scrolls in its region; a highlight draft fills the Jul-26 column, discarded;
  PNG 2004px, PDF one A4 portrait page, Excel A1:F40 read back via COM),
  `/askanalyst/currency` (970px; every face and size on one line; axe 0 light/dark; 375 scrolls
  in its region with the labels pinned; a highlight draft reaches the USD column on screen and in
  Excel, then discarded; PNG 2004px, PDF A4 portrait, Excel A1:G16 read back via COM),
  `/alphacapital/cement` (750px; chart inside the sheet; axe 0 light/dark; PNG, PDF, Excel with
  its two-line chart checked),
  `/alphacapital/central-government-debt` (1,080px; ends at 575px; every face and size fits; axe 0
  light/dark; PNG 2224px, PDF, Excel checked),
  `/alphacapital/remittance` (chart inside the sheet; axe 0 light/dark; a bar-colour draft
  reaches the bars; 375 fits; PNG 2004×1870 and PDF include the drawn chart; Excel's combo chart
  read back via COM and exported to PNG).
- BOP downloads verified 2026-09-11 (table part only): PNG 1564×1222, PDF A4 portrait, XLSX
  A1:F23 read back in Excel via COM (bytes pulled from the blob URL as base64). A download made
  in dark mode comes out light.
- Portfolio Investment verified 2026-09-11: two PNGs from one click (2664×1328, 1564×1058, 406ms
  apart, light from dark mode); the 2-page PDF rendered to PNG with Windows.Data.Pdf; the XLSX
  read back via COM (values, formats, merges, fills, chart series formula, chart → PNG); the
  main table fits 1300px at every face and size but Inter 18px (scrolls on screen, the PNG
  widens to 2792px); 1280 / 768 / 375 checked; axe 0 violations light and dark. After the
  one-line-labels fix the PNG was re-checked at 14px, 18px and Inter 18px, and the PDF at 14px.
  Big blobs went to disk through a temporary route (`app/api/dump-tmp`, deleted each time) — a
  folder starting with `_` is private in Next and 404s. ALWAYS look at the exported PNG of a
  new table, not just the screen: the export copy can lay a table out differently.
- Axe on the pages/drawer (inject `axe.min.js` from the npx cache via a temporary copy in
  `public/`, then delete it): Latest Result page and drawer 0 violations; with changes pending,
  only the filled Apply button (recorded 3.6:1 deviation).
- Downloads without files: override `HTMLAnchorElement.prototype.click` in the page to record
  `{download, href}`, inspect, restore. The Excel builder also runs in Node (transpile with the
  project's TypeScript) and was read back in Excel via COM.
- The Browser pane is shared with the user: discard drafts, never Apply, and leave
  `mantine-color-scheme-value` as found after testing. Earlier on 2026-09-11 the pane's
  storage held the USER'S OWN applied style (their company name, "New logo", then "Akseer");
  by the Portfolio Investment session it was empty (no key at all). Whatever is there is
  theirs — leave it alone; test with drafts and Discard.
- The pane's `key` action cannot activate buttons or edit text (no Backspace/Ctrl+A); a hidden
  pane stops animation frames, so Mantine transitions freeze mid-way.

## Next steps
1. Wait for the user's next publication designs.
2. For each: fixture in `src/data/`, view in `src/views/` on `ReportSheet` (bands, or its own
   `letterhead`), `useMasthead` + `sheetDownloads`, slug in `BUILT_PUBLICATIONS`, branch in the
   route, and a `placement.ts` entry for the Report style settings that screen offers. A monthly
   tab (month / last month / this month / MoM / YoY / FYTD) reuses `monthly.ts`, `MonthlyTable`
   and `monthlyWorkbook.ts` — check its feed first (feeds listed in memory, reference file).
   Table-only monthly sheets share `MonthlyView` (a `SHEETS` entry per slug + the route's
   `MONTHLY_SHEETS`) and `outlineRow`/`msgRows`/`msgRow`.
3. Offer (don't do unasked): connect Latest Result to the live feed; white-label the footer;
   the logo image in Excel; file the DS findings upstream; bump the DS to v1.3.4 and re-measure.
4. Keep project memory and CLAUDE.md in step with any change to the rules above.
