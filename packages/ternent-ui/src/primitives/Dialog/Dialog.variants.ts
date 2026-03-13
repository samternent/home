import type { DialogSize } from "./Dialog.types";

export const dialogBackdropClass = "fixed inset-0 z-40 bg-[var(--ui-fg)]/40 backdrop-blur-sm";
export const dialogPositionerClass = "fixed inset-0 z-50 grid place-items-center p-4";
export const dialogContentBaseClass =
  "w-full overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] " +
  "bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-md)]";

export const dialogContentSizeClasses: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const dialogHeaderClass =
  "flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-4 py-3";
export const dialogTitleClass = "text-base font-semibold text-[var(--ui-fg)]";
export const dialogDescriptionClass = "mt-1 text-sm text-[var(--ui-fg-muted)]";
export const dialogBodyClass = "px-4 py-4";
export const dialogFooterClass =
  "flex items-center justify-end gap-3 border-t border-[var(--ui-border)] px-4 py-3";
export const dialogCloseClass =
  "inline-flex size-9 items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] " +
  "text-[var(--ui-fg-muted)] transition-[border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "hover:border-[var(--ui-primary-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]";
