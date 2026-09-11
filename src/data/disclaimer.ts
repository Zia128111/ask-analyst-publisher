/* ============================================================================
 * DISCLAIMER — the joint venture's legal page and PDF furniture
 * ============================================================================
 * What a published PDF prints around the report: the page footer, the
 * research contact under the report, and the disclaimer page that follows it.
 * Transcribed from the user's reference, "FIPI LIPI 09102026.pdf" (the day's
 * Portfolio Investment PDF, supplied 11 September 2026): page 1's footer and
 * contact, and page 2 word for word.
 *
 * One slip in the reference is corrected: it prints "investment?-banking",
 * a stray character where a soft hyphen was; here it is "investment-
 * banking".
 *
 * NOT WHITE-LABELLED. This is Akseer Research's and Alpha Capital's legal
 * text, naming both firms: the Report style's company name does not change
 * it, as it does not change the page footer's line. A white-label client's
 * own disclaimer would replace this file's content (or come with the
 * account), and nothing that prints it would change.
 * ========================================================================= */

export interface DisclaimerSection {
  heading: string;
  paragraphs: string[];
}

export interface ContactCard {
  name: string;
  /** Printed after the name, in regular weight. */
  formerly?: string;
  address: string;
  phone: string;
  email: string;
}

export interface PdfFurniture {
  /** Centred in every page's footer. */
  footerName: string;
  /** Beside the Jama Punji mark in the first page's footer: SECP's investor-education site. */
  investorEducation: { label: string; url: string };
  /** Under the report on the first page. */
  researchContact: { name: string; email: string };
  disclaimer: DisclaimerSection[];
  contactsHeading: string;
  contacts: ContactCard[];
}

export const PDF_FURNITURE: PdfFurniture = {
  footerName: 'Akseer Research (Pvt) Limited',
  investorEducation: { label: 'www.jamapunji.pk', url: 'https://www.jamapunji.pk' },
  researchContact: { name: 'Akseer Research', email: 'info@akseerresearch.com' },
  disclaimer: [
    {
      heading: 'Disclaimer',
      paragraphs: [
        'This report has been prepared and marketed jointly by Akseer Research (Pvt) Limited and Alpha Capital ' +
          '(Pvt) Limited, hereinafter referred jointly as “JV” and is provided for information purposes only. Under ' +
          'no circumstances this is to be used or considered as an offer to sell or solicitation of any offer to ' +
          'buy. While reasonable care has been taken to ensure that the information contained therein is not ' +
          'untrue or misleading at the time of publication, we make no representation as to its accuracy or ' +
          'completeness and it should not be relied upon as such. From time to time, the JV and/or any of their ' +
          'officers or directors may, as permitted by applicable laws, have a position, or otherwise be interested ' +
          'in any transaction, in any securities directly or indirectly subject of this report. This report is ' +
          'provided only for the information of professionals who are expected to make their own investment ' +
          'decisions without undue reliance on this report. Investments in capital markets are subject to market ' +
          'risk and the JV accepts no responsibility whatsoever for any direct or indirect consequential loss ' +
          'arising from any use of this report or its contents. In particular, the report takes no account of the ' +
          'investment objectives, financial situation and particular needs of investors, who should seek further ' +
          'professional advice or rely upon their own judgment and acumen before making any investment. The views ' +
          'expressed in this report are those of the JV’s Research Department and do not necessarily reflect ' +
          'those of the JV or its directors. Akseer Research and Alpha Capital as firms may have business ' +
          'relationships, including investment-banking relationships, with the companies referred to in this ' +
          'report. The JV or any of their officers, directors, principals, employees, associates, close relatives ' +
          'may act as a market maker in the securities of the companies mentioned in this report, may have a ' +
          'financial interest in the securities of these companies to an amount exceeding 1% of the value of the ' +
          'securities of these companies, may serve or may have served in the past as a director or officer of ' +
          'these companies, may have received compensation from these companies for corporate advisory services, ' +
          'brokerage services or underwriting services or may expect to receive or intend to seek compensation ' +
          'from these companies for the aforesaid services, may have managed or co-managed a public offering, ' +
          'take-over, buyback, delisting offer of securities or various other functions for the companies ' +
          'mentioned in this report.',
        'All rights reserved by the JV. This report or any portion hereof may not be reproduced, distributed or ' +
          'published by any person for any purpose whatsoever. Nor can it be sent to a third party without prior ' +
          'consent of the JV. Action could be taken for unauthorized reproduction, distribution or publication.',
      ],
    },
    {
      heading: 'Research Dissemination Policy',
      paragraphs: [
        'The JV endeavours to make all reasonable efforts to disseminate research to all eligible clients in a ' +
          'timely manner through either physical or electronic distribution such as email, fax mail etc.',
      ],
    },
  ],
  contactsHeading: 'Contact Details',
  contacts: [
    {
      name: 'Akseer Research (Pvt) Limited',
      address: '1st Floor, Shaheen Chambers, KCHS block 7 & 8, off. Shahrah-e-Faisal',
      phone: '+92-21-34320359-60',
      email: 'info@akseerresearch.com',
    },
    {
      name: 'Alpha Capital (Pvt) Limited',
      formerly: '(Formerly: Alfa Adhi Securities (Pvt) Limited)',
      address:
        '3rd Floor, Shaheen Chambers, A-4 Central Commercial Area, KCH Society, Block 7 & 8, Near Virtual ' +
        'University, Karachi',
      phone: '+92-21-38694242',
      email: 'info@alphacapital.com.pk',
    },
  ],
};

/* ============================================================================
 * THE MORNING BRIEFING'S DISCLAIMER PAGE
 * ============================================================================
 * Transcribed from the user's reference, "MB 09112026.pdf" (the day's
 * Morning Briefing PDF, supplied 11 September 2026), page 2: the same
 * disclaimer as above, then the valuation methodology, the ratings criteria
 * with their table, the dissemination policy and the analyst certification,
 * and the contact details in three columns under each firm's logo, the third
 * the Jama Punji mark and site. Headings in blue, as there.
 *
 * The logos are CROPPED from a 6250px render of that page (public/brand/
 * akseer.png, alpha-capital.png, jamapunji-urdu.png): replace them with the
 * firms' own artwork when it is supplied. The reference prints Akseer's
 * number "+92-21-34320359 -60", a stray space; here it reads as above.
 * ========================================================================= */

export interface RatingsTable {
  heading: readonly [string, string];
  rows: readonly (readonly [string, string])[];
}

export interface BriefingSection {
  heading: string;
  paragraphs: string[];
  /** A table after the paragraphs, then more paragraphs. */
  table?: RatingsTable;
  after?: string[];
}

/** A logo on the contact page: its file and its proportions (width ÷ height). */
export interface ContactLogo {
  src: string;
  ratio: number;
  /** Printed height, millimetres: each mark at the size the reference prints it. */
  height: number;
}

export interface BriefingFirm {
  logo: ContactLogo;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface BriefingFurniture {
  footerName: string;
  researchContact: { name: string; email: string };
  sections: BriefingSection[];
  contactsHeading: string;
  firms: BriefingFirm[];
  investorEducation: { logo: ContactLogo; label: string; url: string };
}

const [JV_DISCLAIMER] = PDF_FURNITURE.disclaimer;

export const BRIEFING_FURNITURE: BriefingFurniture = {
  footerName: PDF_FURNITURE.footerName,
  researchContact: PDF_FURNITURE.researchContact,
  sections: [
    JV_DISCLAIMER,
    {
      heading: 'Valuation Methodology',
      paragraphs: [
        'To arrive at our 12-months Price Target, the JV uses different valuation methods which include: 1). DCF ' +
          'methodology, 2). Relative valuation methodology, and 3). Asset-based valuation methodology.',
      ],
    },
    {
      heading: 'Ratings Criteria',
      paragraphs: [
        'JV employs a three-tier ratings system to rate a stock, as mentioned below, which is based upon the level ' +
          'of expected return for a specific stock. The rating is based on the following with time horizon of ' +
          '12-months.',
      ],
      table: {
        heading: ['Rating', 'Expected Total Return'],
        rows: [
          ['Buy', 'Greater than or equal to +15%'],
          ['Hold', 'Between -5% and +15%'],
          ['Sell', 'Less than or equal to -5%'],
        ],
      },
      after: [
        'Ratings are updated to account for any development impacting the economy/sector/company, changes in ' +
          'analysts’ assumptions or a combination of these factors.',
      ],
    },
    {
      heading: 'Research Dissemination Policy',
      paragraphs: [
        'The JV endeavors to make all reasonable efforts to disseminate research to all eligible clients in a ' +
          'timely manner through either physical or electronic distribution such as email, fax mail etc.',
      ],
    },
    {
      heading: 'Analyst Certification',
      paragraphs: [
        'The research analyst, denoted by ‘AC’ on the cover of this report, has also been involved in the ' +
          'preparation of this report, and is a member of JV’s Equity Research Team. The analyst certifies that ' +
          '(1) the views expressed in this report accurately reflect his/her personal views and (2) no part of ' +
          'his/her compensation was, is or will be directly or indirectly related to the specific recommendations ' +
          'or views expressed in this report.',
      ],
    },
  ],
  contactsHeading: 'Contact Details',
  firms: [
    {
      logo: { src: '/brand/akseer.png', ratio: 964 / 344, height: 11 },
      name: 'Akseer Research (Pvt) Limited',
      address: '1st Floor, Shaheen Chambers, KCHS block 7 & 8, off. Shahrah-e-Faisal',
      phone: '+92-21-34320359-60',
      email: 'info@akseerresearch.com',
    },
    {
      logo: { src: '/brand/alpha-capital.png', ratio: 672 / 398, height: 13 },
      name: 'Alpha Capital (Pvt) Limited',
      address:
        '3rd Floor, Shaheen Chambers, A-4 Central Commercial Area, KCH Society, Block 7 & 8, Near Virtual ' +
        'University, Karachi',
      phone: '+92-21-38694242',
      email: 'info@alphacapital.com.pk',
    },
  ],
  investorEducation: {
    logo: { src: '/brand/jamapunji-urdu.png', ratio: 1216 / 256, height: 8 },
    label: 'www.jamapunji.pk',
    url: 'https://www.jamapunji.pk',
  },
};
