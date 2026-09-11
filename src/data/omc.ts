import { groupLines, monthlyColumns, parseFigure } from './monthly';
import type { MonthlyReport, MonthlyRow } from './types';

/* ============================================================================
 * OMC — Oil marketing companies' cumulative sales
 * ============================================================================
 * The ONLY file that knows where the OMC sales come from. It is a fixture
 * today, transcribed on 11 September 2026 from what the live page loads:
 * api.askanalyst.com.pk/api/omc. The feed's shape is kept below and
 * normalised here, with the helpers every monthly feed shares (monthly.ts).
 *
 * THE FEED, as it answers:
 *
 *   head   eight headings: the same month a year ago, last month, this
 *          month, "MoM", "YoY", the year to date a year ago and now
 *          ("2MFY26", "2MFY27") and its "YoY". The live page prints however
 *          many the feed sends.
 *   data   one row per line, keyed "industry", "pso", "pso_ms" …: a total
 *          for the industry and for each company (a key with no product
 *          suffix), each followed by its products — MS (motor spirit), HSD
 *          (diesel), FO (furnace oil), and Others for the industry. Volumes
 *          are strings in thousand tonnes ("1,300"), changes "-16%" or "NM",
 *          and "-" where there is no figure (Shell's FO line, throughout).
 *   month  the report's month, "08".
 *
 * The feed carries no date: the live page stamps the sheet with the day it
 * is viewed. The fixture uses the day it was transcribed; the accessor
 * should stamp the server's day in Karachi once it reads the feed.
 * ========================================================================= */

interface FeedRow {
  key: string;
  label: string;
  data: { value: string }[];
}

interface Feed {
  head: string[];
  month: string;
  data: FeedRow[];
}

/** key|label|eight values, as the feed sends them. */
const LINES = [
  'industry|Industry|1,300|1,509|1,261|-16%|-3%|2,523|2,769|10%',
  'industry_ms|MS|675|729|666|-9%|-1%|1,288|1,395|8%',
  'industry_hsd|HSD|522|624|422|-32%|-19%|1,031|1,045|1%',
  'industry_fo|FO|19|78|98|26%|416%|34|176|418%',
  'industry_others|Others|85|78|75|-4%|-12%|171|153|-11%',
  'pso|PSO|547|702|570|-19%|4%|1,056|1,272|20%',
  'pso_ms|MS|263|341|310|-9%|18%|499|651|30%',
  'pso_hsd|HSD|221|291|199|-32%|-10%|428|490|14%',
  'pso_fo|FO|2|5|0|NM|NM|5|5|0%',
  'shel|SHEL|107|131|107|-18%|0%|212|238|12%',
  'shel_ms|MS|64|74|69|-7%|8%|122|142|16%',
  'shel_hsd|HSD|36|53|35|-34%|-3%|77|89|16%',
  'shel_fo|FO|-|-|-|NM|NM|-|-|NM',
  'apl|APL|112|127|121|-5%|8%|211|248|18%',
  'apl_ms|MS|58|59|54|-8%|-7%|105|113|8%',
  'apl_hsd|HSD|46|50|33|-34%|-28%|87|82|-6%',
  'apl_fo|FO|4|15|30|100%|650%|8|45|463%',
  'hascol|HASCOL|42|42|35|-17%|-17%|86|77|-10%',
  'hascol_ms|MS|25|17|19|12%|-24%|48|36|-25%',
  'hascol_hsd|HSD|15|24|16|-33%|7%|35|40|14%',
  'hascol_fo|FO|0|-|0|NM|-|0|0|-',
  'cynergyico|CYNERGYICO|29|80|80|0%|176%|57|160|181%',
  'cynergyico_ms|MS|11|17|16|-6%|45%|21|33|57%',
  'cynergyico_hsd|HSD|12|33|19|-42%|58%|23|51|122%',
  'cynergyico_fo|FO|6|31|45|45%|650%|11|76|591%',
];

const FEED: Feed = {
  head: ['Aug-2025', 'Jul-2026', 'Aug-2026', 'MoM', 'YoY', '2MFY26', '2MFY27', 'YoY'],
  month: '08',
  data: LINES.map((line) => {
    const [key, label, ...values] = line.split('|');
    return { key, label, data: values.map((value) => ({ value })) };
  }),
};

/** A total's key has no product after it: "pso", not "pso_ms". */
const toRow = (row: FeedRow): MonthlyRow => ({
  label: row.label,
  bold: !row.key.includes('_'),
  values: row.data.map((cell) => parseFigure(cell.value)),
});

export async function fetchOmcReport(): Promise<MonthlyReport> {
  return {
    asOf: '2026-09-11',
    units: 'K Tonnes',
    columns: monthlyColumns(FEED.head),
    rows: groupLines(FEED.data.map(toRow)),
    source: 'OCAC, Akseer Research',
  };
}
