import type { DrawerSide, DrawerSize } from "./Drawer.types";

export const drawerBackdropClass =
  "fixed inset-0 z-[90] bg-[color:color-mix(in_srgb,var(--ui-bg)_28%,transparent)] backdrop-blur-[2px]";
export const drawerPositionerBaseClass = "fixed inset-0 z-[100] flex";
export const drawerPositionerSideClasses: Record<DrawerSide, string> = {
  left: "justify-start",
  right: "justify-end",
};

export const drawerContentBaseClass =
  "flex h-full w-full max-w-full flex-col overflow-hidden border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-md)] " +
  "will-change-transform transition-[transform,opacity] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "data-[state=open]:opacity-100 data-[state=closed]:opacity-0";

export const drawerContentSideClasses: Record<DrawerSide, string> = {
  left: "border-r data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-6",
  right: "border-l data-[state=open]:translate-x-0 data-[state=closed]:translate-x-6",
};

export const drawerContentSizeClasses: Record<DrawerSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const drawerHeaderClass =
  "flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-4 py-3";
export const drawerTitleClass = "text-base font-semibold text-[var(--ui-fg)]";
export const drawerDescriptionClass = "mt-1 text-sm text-[var(--ui-fg-muted)]";
export const drawerBodyClass = "flex-1 overflow-auto px-4 py-4";
export const drawerFooterClass =
  "flex items-center justify-end gap-3 border-t border-[var(--ui-border)] px-4 py-3";
export const drawerCloseClass =
  "inline-flex size-9 items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] " +
  "text-[var(--ui-fg-muted)] transition-[border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "hover:border-[var(--ui-primary-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]";
