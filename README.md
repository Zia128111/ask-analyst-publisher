# Ask Analyst — Publisher

The Publisher module of [Ask Analyst](https://www.askanalyst.com.pk): where a
research house creates its account, signs in and (next) manages what it
publishes. Next.js 16 (App Router), React 19, Mantine 9, on the Ask Analyst
Design System.

```bash
npm install
npm run dev     # http://localhost:3000 — redirects to /sign-in
```

The design system is a private GitHub package and installs against your
existing `gh` credentials. If it fails to resolve, check `gh auth status`
before assuming the package name is wrong.

## Pages

| Route | What is on it |
| --- | --- |
| `/sign-in` | Work email and password, keep-me-signed-in beside the forgot link, sign in with Google or Microsoft |
| `/sign-up` | Full name, work email, organisation, password with a live requirements checklist; a "check your inbox" step on success |
| `/forgot-password` | Work email; a "check your inbox" step on success, worded so it never confirms an address exists |
| `/[edition]/[publication]` | The inner pages. Editions: `askanalyst`, `alphacapital`, `ksa`. MTS, Latest Result, BOP, Oil Marketing, Portfolio Investment, Morning Briefing, Trade-PBS, Trade-SBP, Settlement, Remittance, Central Government Debt, Cement, Fertilizer, Currency and Auto — every publication — are built (KSA's Morning Briefing, a different report, is not and opens a "not built yet" page) |
| `/[edition]/latest-result?company=EFERT` | One listed company's latest P&L summary; the company search sets `?company=` |

All three auth pages share one shell: the form column with the product lockup,
the form and the "your data is secure" note; beside it, from 1024px up, a
brand panel with a preview of the Publisher desk built from design-system
components. Light and dark schemes, keyboard and screen-reader use, and an
Arabic right-to-left build are all first-class, not afterthoughts.

## Latest Result

Type in the company search (ticker or name: "luck", "cement", "LUCK") or
scroll its list, and the page shows that company's letterhead — ticker,
name, share price with its change and date — and its P&L summary: five
quarters, the change on the year and on the quarter, two periods to date and
the change between them, with the current quarter and period to date tinted.
Each company keeps its own rows (a bank's differ from a cement maker's) and
its own periods (June year-end, calendar year, nine months). The company is
in the URL, so a refresh or a shared link opens it. Ten companies are in the
fixture today (`src/data/latestResult.ts`), transcribed from the live feed.
PNG, PDF (A4 landscape) and Excel downloads work as on MTS.

## BOP

External Account Highlights: the month's balance of payments in USD millions
— the same month a year ago, last month and this month, with the change on
the month and on the year — on the MTS letterhead, and beside it the
"Historical Current A/c Balance" chart: the month's current account balance
as bars and its running total for the fiscal year (from July) as a line,
"Powered by Ask Analyst" underneath. Negative amounts print in parentheses
and in the negative colour. The feed sends one month of chart history today
(July 2026); longer history is to come. The downloads are the table part
only — the letterheaded sheet, not the chart: PNG, PDF (A4 portrait, as
MTS) and an Excel workbook of the table.

## Oil Marketing

OMCs Cumulative Sales: the month's sales in thousand tonnes for the
industry and each oil marketing company (PSO, Shell, APL, Hascol,
Cynergyico), each broken into MS, HSD and FO — the same month a year ago,
last month and this month, the change on the month and on the year, and the
fiscal year to date then and now with its change. Totals in bold, this
month and the year to date tinted, on the MTS letterhead. PNG, PDF (A4
portrait) and Excel downloads, as on MTS. BOP and Oil Marketing share one
monthly table, so later month-by-month tabs can reuse it.

## Portfolio Investment

FIPI / LIPI Daily Movement: what each type of local (LIPI) and foreign
(FIPI) investor bought and sold on the day and the net, overall and in
eleven sectors, in USD millions, with the foreign net for the week, month,
calendar year and fiscal year to date — across the full width, on the MTS
letterhead. Under it, the same flows without the sectors beside a column
chart of each type's net, "Powered by Ask Analyst" underneath. The table
colours are the other sheets'. The downloads:

- **PNG** saves two images from one click: the main table and the second
  table, each with the letterhead and source. The browser may ask once to
  allow several downloads.
- **PDF** (A4 landscape) prints the main table on page 1, with the research
  contact and a footer carrying the Jama Punji mark, and the Akseer–Alpha
  Capital disclaimer as text on page 2, as the published PDF does.
- **Excel** holds both tables and the chart in one sheet; the chart is
  Excel's own, drawn from the second table's figures.

## Morning Briefing

The day's news and the markets of the session before, read LIVE from the
Ask Analyst feed and refreshed every five minutes (a saved copy stands in if
the feed cannot be reached). Across the full width, in line with the tabs:
the benchmark's header — the date, the logo, "Morning Briefing" between two
blue rules — the stories on the left, each with "Click here for more", and
on the right five tables (Net LIPI/FIPI Position, FIPI Sector-wise, Major
Indices, Commodities, Inter-Bank Currency Rates) drawn as the live page
draws them, then the research contact and the Jama Punji line. The
downloads:

- **PNG**: the sheet as on screen.
- **PDF** (A4 portrait, like the published briefing): page 1 the briefing,
  laid out for the page so it prints at a readable size, its links still
  links; page 2 the disclaimer, with the ratings table and the three logos.
- **Excel**: a News sheet with each story's link, and a Markets sheet with
  the five tables.

## Trade-PBS

Balance of Trade: the month's trade in goods as the Pakistan Bureau of
Statistics counts it, in USD millions — exports, imports and the trade
deficit, then exports and imports by group, with textile exports by product
a step in under Textile — the same month a year ago, last month and this
month, with the change on the month and on the year to one decimal, on the
MTS letterhead. The deficit prints in parentheses in the text colour and no
column is tinted, as on the live page; from August the fiscal year to date
joins them. PNG, PDF (A4 portrait) and Excel downloads, as on MTS; it shares
the monthly table with BOP and Oil Marketing.

## Trade-SBP

Export of Services break-up (USD mn): the month's trade in goods and
services as the State Bank counts it — exports of goods and of services,
the services broken down by type (technology, other business services,
transport, travel, others), the total; then imports of goods and of
services and the total — the same month a year ago, last month and this
month, with the change on the month and on the year to one decimal. This
month is tinted, as on the live page, and a blank line parts exports from
imports. Same letterhead, downloads and shared table as Trade-PBS.

## Fertilizer

Fertilizer Offtake and Inventory ('000 tons), titled with the table's
month: Urea, DAP and CAN in turn, each by company and in total — the month
a year ago, last month and this month with the change on each, the
calendar year to date then and now with its change, and inventory at the
month's end — this month and the year to date tinted, on the MTS letterhead
at the live page's width. PNG, PDF (A4 portrait) and Excel downloads.

## Cement

Cement Price History (PKR/bag): the price of a bag of cement in the North
and South regions over the latest five weeks, on the MTS letterhead, and
under the table the year's weeks as a line per region. The downloads carry
the chart: PNG and PDF picture the whole sheet, and Excel has the table and
a History sheet with every week and Excel's own line chart.

## Central Government Debt

Central Government Debt (PKR bn), titled with the table's month: domestic
debt — long term (permanent, unfunded, foreign currency loans), short term
and Naya Pakistan Certificates — external debt and the two together, a year
ago, at the fiscal year's close and now, with the change on the year and
since the fiscal year closed (FYTD). Three levels of indentation, this
month tinted, on the MTS letterhead at the live page's width. PNG, PDF (A4
portrait) and Excel downloads.

## Remittance

Workers' Remittances (USD Mn): the month's remittances by the country they
are sent from and the total — the same month a year ago, last month, this
month (tinted) and the change on the month and on the year — on the MTS
letterhead, and under the table the "Workers' Remittances" chart: the
latest 43 months' totals as bars on a USD axis and the change on the year
as a line on a percent axis, as on the live page. The downloads carry the
chart: PNG and PDF picture the whole sheet, and Excel has the table and a
History sheet with Excel's own combination chart drawn from its months.

## Settlement

Settlement of top 10 traded stocks: the session's ten most traded stocks by
volume, from NCCPL — the volume traded in millions of shares and the value
in millions of rupees under "Trade", and the percentage settled under UIN
and CM under "Settlement (%)" — on the MTS letterhead, at the live page's
width. Each group sits on its own underline, broken between the groups,
with the headings and figures centred. PNG, PDF (A4 portrait) and Excel
downloads; the workbook keeps the full precision behind the one-decimal
figures.

## Currency

Weighted Average Exchange Rates: the State Bank's rates in rupees for the
yuan, euro, pound, yen, riyal and dollar — buying and selling on the
current and the previous date, to four decimals, then the change between
them to two — on the MTS letterhead at the live page's width, the USD
column tinted and every heading centred. PNG, PDF (A4 portrait) and Excel
downloads. The feed's rates are dated 22 August 2025 and the sheet prints
that date, as the live page does.

## Auto

Auto Sales Volumes, titled with the table's month: the units each maker
sold — INDU, HCAR, PSMC and Hyundai with their models under them, then
Sazgar - Haval, MTL, AGTL, GAL and GHNI — then passenger cars by engine
size and in total, jeeps and pickups, trucks and buses, tractors, two- and
three-wheelers and the industry in total; the same month a year ago, last
month and this month (tinted) with the change on the month and on the
year. On the MTS letterhead at the live page's width; PNG, PDF (A4
portrait) and Excel downloads.

## Report style (white label)

The avatar at the top right opens the account drawer. Its **Report style**
section previews every change on the report as you make it, and the PNG,
PDF and Excel downloads follow. Each report offers its own settings — the
drawer shows only those, in this order, each with a one-line explainer
behind the "i" at the end of its label, under a **Table** heading and, on
BOP and Portfolio Investment, a **Chart** heading:

- **Table text size** (all): 14, 16 or 18px. The MTS sheet widens a grid
  column per step so the figures never scroll; the Latest Result and BOP
  sheets keep their width and wrap long labels instead.
- **Company logo** (all): joins the masthead switch above each report as a
  third choice, selected on upload. Any size of file works: empty margins
  are trimmed and the logo is drawn at the letterhead's full height inside
  the logo space, proportions kept.
- **Company name** (MTS, BOP, Oil Marketing, Portfolio Investment,
  Trade-PBS, Trade-SBP, Settlement, Remittance, Central Government Debt,
  Cement, Fertilizer, Currency, Auto): replaces
  "Akseer Research (Pvt) Ltd." on every report's letterhead band and in the
  downloads, and names the logo.
- **Font** (all): Lato or one of six other self-hosted faces, each with real
  italics and tabular figures.
- **Border and fill colours** (all), **highlight colour** (Latest Result,
  BOP, Oil Marketing, Portfolio Investment, Trade-SBP, Remittance, Central
  Government Debt, Fertilizer, Currency, Auto), **negative figures colour**
  (BOP): any colour, picked or typed as a
  hex code (`#0A6640`, `0a6640` or `#0a6`). The fill is the letterhead bands
  and header (the header row on Latest Result; the striped rows on the
  Morning Briefing, whose border colour also colours its title and table
  names where it reads); the highlight is the latest
  period's columns (Portfolio Investment: the Net column; Currency: the USD
  column), and follows the
  fill when empty. Text on a fill switches
  between ink and white for contrast, and the drawer shows the ratio; a
  negatives colour shows how it reads on the white report.
- **Source** (MTS, Oil Marketing, Portfolio Investment, Trade-PBS,
  Trade-SBP, Settlement, Remittance, Central Government Debt, Cement,
  Fertilizer, Currency, Auto): replaces the source line under every report.
- **Bar and line colours** (under Chart): BOP's bars and fiscal-year line,
  Portfolio Investment's bars, Remittance's bars and YoY line; the drawer
  shows how each reads on white.

Changes are kept only when you press **Apply**, so a refresh brings back the
last applied style. **Discard changes** returns the report to it, and closing
the drawer with changes pending asks whether to apply or discard them.
"Reset style" restores the design-system look for the settings the report in
view offers, and keeps the company name and logo. Settings are kept in this
browser for now. They are meant to be saved per company (each company has one
user), and `src/data/branding.ts` is where that account-level store plugs in.

## Demo behaviour

There is no server yet. `src/auth/client.ts` answers every call after about a
second, and is the only file to change when the identity service exists.

| Do this | See this |
| --- | --- |
| Sign in with any email and the password `wrong` | The error alert |
| Sign in with any other password | The Ask Analyst MTS page |
| Sign up with `taken@example.com` | The "already exists" alert |
| Sign up with any other address | The "check your inbox" step |
| Submit any form empty | Errors beside each field |

## Departures from the benchmark

The reference design was a generic SaaS sign-in. Its shape is kept; where it
meets a design-system rule, the rule wins. Each is deliberate and commented
where it happens.

- **8px corners, not pills.** The system's radius scale has no pill step for
  controls.
- **Every field has a visible label.** Placeholder-as-label vanishes the moment
  the reader types.
- **Links are underlined.** Colour alone must not mark a link.
- **No emoji in the greeting.** Screen readers announce the Unicode name.
- **"Keep me signed in" is off by default.** A shared machine should not be
  remembered by accident.
- **The product preview is built, not pasted.** A screenshot drifts the first
  time the product moves; components cannot.
- **No leading icons in the inputs.** The curated icon set has no mail or lock
  glyph, and the system forbids importing around it.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
```

`npm run verify:a11y` runs axe against a running dev server. Expect exactly the
design system's recorded `text-on-brand` deviation and nothing else. See
[CLAUDE.md](CLAUDE.md) for the design-system findings this module surfaced:
two fixed upstream in v1.3.2 and v1.3.3, one worked around here.
