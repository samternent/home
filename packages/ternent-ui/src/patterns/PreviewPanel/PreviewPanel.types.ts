export const previewPanelToneValues = [
  "neutral",
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "critical",
  "info",
] as const;

export const previewPanelEmphasisValues = ["subtle", "default", "strong"] as const;
export const previewPanelBadgeModeValues = ["default", "quiet"] as const;

export type PreviewPanelTone = (typeof previewPanelToneValues)[number];
export type PreviewPanelEmphasis = (typeof previewPanelEmphasisValues)[number];
export type PreviewPanelBadgeMode = (typeof previewPanelBadgeModeValues)[number];

export type PreviewPanelRow = {
  label: string;
  value: string;
  valueTone?: PreviewPanelTone;
};
