import {
  IconAdjustments,
  IconBuildingBank,
  IconBuildingFactory2,
  IconCar,
  IconCashBanknote,
  IconChevronsLeft,
  IconGasStation,
  IconPackageExport,
  IconReceipt,
  IconReportAnalytics,
  IconScale,
  IconSeedling,
  IconShip,
  IconSunrise,
} from '@tabler/icons-react';
import { Icons as SYSTEM_ICONS, makeIcon } from '@akseer/ask-analyst-design-system';

/* ============================================================================
 * ICONS
 * ============================================================================
 * The design system's curated set, plus the glyphs this app needs that the
 * set does not carry yet, each wrapped with the system's own `makeIcon`, so
 * its size tokens, stroke and aria rules hold exactly as for the rest: no
 * label, decorative and hidden; a label, an image with that name.
 *
 * This is the one file allowed to import from @tabler/icons-react
 * (scripts/verify-icons.mjs). A glyph added here is a candidate for the
 * system's set: propose it upstream and drop it from here once it ships.
 * ========================================================================= */

export const Icons = {
  ...SYSTEM_ICONS,
  /** The sidebar's collapse button. */
  chevronsLeft: makeIcon(IconChevronsLeft, 'IconChevronsLeft'),
  /** Market, a group in the sidebar: the sliders of the user's first design. */
  adjustments: makeIcon(IconAdjustments, 'IconAdjustments'),
  /* The publications in the sidebar, each for what its report is about. */
  receipt: makeIcon(IconReceipt, 'IconReceipt'),
  sunrise: makeIcon(IconSunrise, 'IconSunrise'),
  reportAnalytics: makeIcon(IconReportAnalytics, 'IconReportAnalytics'),
  scale: makeIcon(IconScale, 'IconScale'),
  ship: makeIcon(IconShip, 'IconShip'),
  packageExport: makeIcon(IconPackageExport, 'IconPackageExport'),
  cashBanknote: makeIcon(IconCashBanknote, 'IconCashBanknote'),
  buildingBank: makeIcon(IconBuildingBank, 'IconBuildingBank'),
  gasStation: makeIcon(IconGasStation, 'IconGasStation'),
  buildingFactory: makeIcon(IconBuildingFactory2, 'IconBuildingFactory2'),
  plant: makeIcon(IconSeedling, 'IconSeedling'),
  car: makeIcon(IconCar, 'IconCar'),
} as const;
