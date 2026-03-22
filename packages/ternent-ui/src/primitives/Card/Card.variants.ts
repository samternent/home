import type { CardPadding, CardVariant } from "./Card.types";

export const cardBaseClass =
  "rounded-[var(--ui-radius-lg)] border text-[var(--ui-fg)] transition-[border-color,box-shadow,transform,background-color] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]";

export const cardVariantClasses: Record<CardVariant, string> = {
  default: "border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-sm)]",
  subtle: "border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] shadow-none",
  outline: "border-[var(--ui-border)] bg-transparent shadow-none",
  elevated:
    "border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-md)]",
  panel:
    "border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] shadow-[var(--ui-shadow-md)]",
  showcase:
    "border-[color-mix(in_srgb,var(--ui-border)_74%,var(--ui-primary-muted))] " +
    "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-primary)_12%,var(--ui-tonal-secondary))_0%,color-mix(in_srgb,var(--ui-bg)_84%,var(--ui-tonal-secondary))_100%)] " +
    "shadow-[0_18px_48px_color-mix(in_srgb,var(--ui-primary)_14%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--ui-fg)_8%,transparent)] " +
    "backdrop-blur-sm",
};

export const cardPaddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const cardInteractiveClass =
  "cursor-pointer hover:-translate-y-[var(--ui-lift-hover)] hover:border-[var(--ui-primary-muted)] hover:shadow-[var(--ui-shadow-md)] focus-within:ring-2 focus-within:ring-[var(--ui-ring)]";
