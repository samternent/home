export const sectionIntroAlignValues = ["start", "center"] as const;
export const sectionIntroSizeValues = ["hero", "section", "compact"] as const;
export const sectionIntroTitleTagValues = ["h1", "h2", "h3"] as const;

export type SectionIntroAlign = (typeof sectionIntroAlignValues)[number];
export type SectionIntroSize = (typeof sectionIntroSizeValues)[number];
export type SectionIntroTitleTag = (typeof sectionIntroTitleTagValues)[number];
