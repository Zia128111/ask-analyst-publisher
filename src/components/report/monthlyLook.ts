/**
 * How a monthly sheet sets off its figures, after its benchmark. One object
 * for the table and the workbook, so the screen, the pictures and the Excel
 * agree.
 */
export interface MonthlyLook {
  /** This month and the year to date tinted, from the header to the last row. */
  tintCurrent: boolean;
  /** Negative amounts in the negative colour; otherwise in the text colour, the parentheses alone. */
  colourNegatives: boolean;
  /** Every label on one line; otherwise a label may wrap at the Report style's larger text. */
  oneLineLabels: boolean;
  /**
   * The unit is in the title band ("Export of Services break-up (USD mn)"),
   * so the heading over the labels is left blank, as the benchmark leaves
   * it — screen readers still hear the unit there.
   */
  unitsInTitle: boolean;
}

/** BOP's and Oil Marketing's: their live pages tint the current columns and print negative amounts red. */
export const MONTHLY_LOOK: MonthlyLook = {
  tintCurrent: true,
  colourNegatives: true,
  oneLineLabels: false,
  unitsInTitle: false,
};
