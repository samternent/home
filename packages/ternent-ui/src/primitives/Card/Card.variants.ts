import type { CardPadding, CardVariant } from "./Card.types";

export const cardBaseClass =
  "rounded-[var(--ui-radius-lg)] border text-[var(--ui-fg)] transition-[border-color,box-shadow,transform,background-color] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]";

export const cardVariantClasses: Record<CardVariant, string> = {
  default: "border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-sm)]",
  subtle: "border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] shadow-none",
  outline: "border-[var(--ui-border)] bg-transparent shadow-none",
};

export const cardPaddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const cardInteractiveClass =
  "cursor-pointer hover:-translate-y-[var(--ui-lift-hover)] hover:border-[var(--ui-primary-muted)] hover:shadow-[var(--ui-shadow-md)] focus-within:ring-2 focus-within:ring-[var(--ui-ring)]";
