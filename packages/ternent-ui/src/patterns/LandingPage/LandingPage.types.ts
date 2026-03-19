export const landingPageToneValues = [
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
] as const;

export const landingPageValueToneValues = [
  "neutral",
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "info",
  "critical",
] as const;

export const landingPageActionVariantValues = ["primary", "secondary"] as const;

export const landingPageIconValues = [
  "globe",
  "pin",
  "shield",
  "check",
  "stack",
  "document",
  "terminal",
  "spark",
  "dataset",
  "grid",
] as const;

export type LandingPageTone = (typeof landingPageToneValues)[number];
export type LandingPageValueTone = (typeof landingPageValueToneValues)[number];
export type LandingPageActionVariant = (typeof landingPageActionVariantValues)[number];
export type LandingPageIcon = (typeof landingPageIconValues)[number];

export type LandingPageLink = {
  href: string;
  label: string;
};

export type LandingPageAction = LandingPageLink & {
  variant?: LandingPageActionVariant;
};

export type LandingPageTertiaryAction = LandingPageLink;

export type LandingPagePreviewTab = {
  label: string;
  active?: boolean;
};

export type LandingPagePreviewRow = {
  label: string;
  value: string;
  valueTone?: LandingPageValueTone;
};

export type LandingPagePreview = {
  title?: string;
  meta?: string;
  statusLabel?: string;
  statusTone?: LandingPageValueTone;
  rows?: readonly LandingPagePreviewRow[];
  code?: string;
  tabs?: readonly LandingPagePreviewTab[];
  footerText?: string;
};

export type LandingPageFeature = {
  title: string;
  description: string;
  tone?: LandingPageTone;
  icon?: LandingPageIcon;
};

export type LandingPageStep = {
  title: string;
  description: string;
};

export type LandingPageNarrativeItem = {
  title: string;
  description: string;
};

export type LandingPageDeveloperTab = {
  value: string;
  label: string;
  title: string;
  meta: string;
  code: string;
  supportingCopy: string;
  link: LandingPageLink;
};

export type LandingPageClarifierColumn = {
  title: string;
  items: readonly string[];
};

export type LandingPageProofModelSection = {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly LandingPageNarrativeItem[];
};

export type LandingPageProofJsonSection = {
  eyebrow: string;
  title: string;
  description: string;
  code: string;
  supportingText?: string;
};

export type LandingPageSurfacesSection = {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly LandingPageFeature[];
};

export type LandingPageStaticBuildSection = {
  eyebrow: string;
  title: string;
  description: string;
  steps: readonly LandingPageStep[];
  closingLine?: string;
  primaryAction?: LandingPageAction;
  secondaryAction?: LandingPageAction;
};

export type LandingPageSuiteSection = {
  eyebrow: string;
  title: string;
  description: string;
  supportingText?: string;
  items: readonly {
    title: string;
    description: string;
    themeColor: string;
    link: LandingPageLink;
  }[];
};

export type LandingPageNonGoalsSection = {
  eyebrow?: string;
  title: string;
  items: readonly string[];
};

export type LandingPageConfig = {
  navigationLinks: readonly LandingPageLink[];
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    supportingLine?: string;
    note?: string;
    primaryAction: LandingPageAction;
    secondaryAction?: LandingPageAction;
    tertiaryAction?: LandingPageTertiaryAction;
    preview: LandingPagePreview;
  };
  proofModelSection?: LandingPageProofModelSection;
  proofJsonSection?: LandingPageProofJsonSection;
  surfacesSection?: LandingPageSurfacesSection;
  staticBuildSection?: LandingPageStaticBuildSection;
  featureSection?: {
    eyebrow: string;
    title: string;
    description?: string;
    items: readonly LandingPageFeature[];
  };
  howItWorksSection?: {
    eyebrow: string;
    title: string;
    preview: LandingPagePreview;
    steps: readonly LandingPageStep[];
  };
  useCasesSection?: {
    eyebrow: string;
    title: string;
    items: readonly LandingPageFeature[];
  };
  developerSection: {
    eyebrow: string;
    title: string;
    description: string;
    surfaces: readonly string[];
    tabs: readonly LandingPageDeveloperTab[];
  };
  clarifierSection?: {
    eyebrow: string;
    title: string;
    columns: readonly LandingPageClarifierColumn[];
  };
  suiteSection?: LandingPageSuiteSection;
  nonGoalsSection?: LandingPageNonGoalsSection;
  ctaSection: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: LandingPageAction;
    secondaryAction?: LandingPageAction;
    tertiaryAction?: LandingPageTertiaryAction;
  };
  footer: {
    brandLabel: string;
    brandHref?: string;
    copyright: string;
    links: readonly LandingPageLink[];
  };
};
