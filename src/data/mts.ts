import type { MtsReport, MtsRow } from './types';

/* ============================================================================
 * MTS — Position Under Margin Trading System
 * ============================================================================
 * The ONLY file that knows where MTS data comes from. It is a fixture today,
 * transcribed from the live Alpha Capital page for the 9 September 2026
 * session. The accessor is already async and returns the wire shape, so
 * pointing it at the feed is a change to this file alone.
 *
 * Rows are in the published order, largest open value first: all twenty the
 * live page lists, checked against its text row for row.
 * ========================================================================= */

const ROWS: MtsRow[] = [
  { symbol: 'HBL', currentVolumeMn: 0.2, currentValuePkrMn: 46.8, mtsRatePct: 14.1, openVolumeMn: 6.14, openValuePkrMn: 1615.29, trailingSymbol: 'A' },
  { symbol: 'NBP', currentVolumeMn: 0.5, currentValuePkrMn: 82.2, mtsRatePct: 13.2, openVolumeMn: 8.94, openValuePkrMn: 1389.73, trailingSymbol: 'A' },
  { symbol: 'BOP', currentVolumeMn: 4.0, currentValuePkrMn: 116.7, mtsRatePct: 13.4, openVolumeMn: 38.79, openValuePkrMn: 1113.1, trailingSymbol: 'A' },
  { symbol: 'PPL', currentVolumeMn: 0.2, currentValuePkrMn: 37.5, mtsRatePct: 13.0, openVolumeMn: 5.78, openValuePkrMn: 1085.06, trailingSymbol: 'A' },
  { symbol: 'MLCF', currentVolumeMn: 0.7, currentValuePkrMn: 55.7, mtsRatePct: 12.7, openVolumeMn: 11.9, openValuePkrMn: 980.01, trailingSymbol: 'A' },
  { symbol: 'UBL', currentVolumeMn: 0.1, currentValuePkrMn: 24.0, mtsRatePct: 12.7, openVolumeMn: 2.69, openValuePkrMn: 976.82, trailingSymbol: 'A' },
  { symbol: 'OGDC', currentVolumeMn: 0.1, currentValuePkrMn: 26.1, mtsRatePct: 12.7, openVolumeMn: 3.41, openValuePkrMn: 928.96, trailingSymbol: 'A' },
  { symbol: 'AKBL', currentVolumeMn: 0.2, currentValuePkrMn: 21.2, mtsRatePct: 13.0, openVolumeMn: 8.09, openValuePkrMn: 724.28, trailingSymbol: 'A' },
  { symbol: 'DGKC', currentVolumeMn: 0.2, currentValuePkrMn: 39.1, mtsRatePct: 13.0, openVolumeMn: 4.26, openValuePkrMn: 721.06, trailingSymbol: 'A' },
  { symbol: 'PSO', currentVolumeMn: 0.1, currentValuePkrMn: 27.3, mtsRatePct: 12.8, openVolumeMn: 2.18, openValuePkrMn: 655.43, trailingSymbol: 'A' },
  { symbol: 'HUBC', currentVolumeMn: 0.2, currentValuePkrMn: 37.8, mtsRatePct: 12.6, openVolumeMn: 3.32, openValuePkrMn: 583.12, trailingSymbol: 'A' },
  { symbol: 'KEL', currentVolumeMn: 3.1, currentValuePkrMn: 18.7, mtsRatePct: 12.8, openVolumeMn: 88.93, openValuePkrMn: 536.41, trailingSymbol: 'A' },
  { symbol: 'PTC', currentVolumeMn: 0.4, currentValuePkrMn: 19.7, mtsRatePct: 13.3, openVolumeMn: 7.6, openValuePkrMn: 425.42, trailingSymbol: 'A' },
  { symbol: 'SNGP', currentVolumeMn: 0.3, currentValuePkrMn: 24.5, mtsRatePct: 12.7, openVolumeMn: 5.09, openValuePkrMn: 415.68, trailingSymbol: 'A' },
  { symbol: 'LUCK', currentVolumeMn: 0.0, currentValuePkrMn: 13.9, mtsRatePct: 12.6, openVolumeMn: 1.11, openValuePkrMn: 396.17, trailingSymbol: 'A' },
  { symbol: 'ATRL', currentVolumeMn: 0.0, currentValuePkrMn: 26.7, mtsRatePct: 12.7, openVolumeMn: 0.43, openValuePkrMn: 381.24, trailingSymbol: 'A' },
  { symbol: 'THCCL', currentVolumeMn: 2.1, currentValuePkrMn: 147.3, mtsRatePct: 18.9, openVolumeMn: 5.64, openValuePkrMn: 376.5, trailingSymbol: 'A' },
  { symbol: 'GAL', currentVolumeMn: 0.1, currentValuePkrMn: 29.3, mtsRatePct: 13.3, openVolumeMn: 0.69, openValuePkrMn: 361.68, trailingSymbol: 'A' },
  { symbol: 'JVDC', currentVolumeMn: 0.2, currentValuePkrMn: 19.5, mtsRatePct: 14.5, openVolumeMn: 2.92, openValuePkrMn: 354.44, trailingSymbol: 'A' },
  { symbol: 'AICL', currentVolumeMn: 0.2, currentValuePkrMn: 17.4, mtsRatePct: 12.8, openVolumeMn: 4.52, openValuePkrMn: 343.4, trailingSymbol: 'A' },
];

export async function fetchMtsReport(): Promise<MtsReport> {
  return { asOf: '2026-09-09', source: 'NCCPL, Akseer Research', rows: ROWS };
}
