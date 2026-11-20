// Shared facts for the privacy policy and the data deletion page.

export const LEGAL = {
  /** Who runs the service, as named on the pages. */
  operator: "Where's My Vibe",
  contactEmail: 'hello@wheresmyvibe.com',
  /** Shown as "Last updated" on both pages. Change it whenever the wording changes. */
  lastUpdated: '21 November 2026',
  /** How long a deletion request takes, in days. */
  deletionDays: 30,
  deletionSubject: 'Delete my data',
} as const;
