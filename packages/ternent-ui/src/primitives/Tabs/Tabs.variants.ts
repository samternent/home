import type { TabsSize, TabsVariant } from "./Tabs.types";

export const tabsRootClass = "w-full";
export const tabsListBaseClass =
  "relative flex w-full items-center gap-1 border-b border-[var(--ui-border)]";
export const tabsListVariantClasses: Record<TabsVariant, string> = {
  underline: "",
  pill: "rounded-[var(--ui-radius-md)] border-b-0 bg-[var(--ui-tonal-tertiary)] p-1",
};

export const tabsTriggerBaseClass =
  "inline-flex items-center justify-center rounded-[var(--ui-radius-sm)] font-medium transition-[background-color,color,box-shadow] " +
  "duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] " +
  "disabled:pointer-events-none disabled:opacity-50";

export const tabsTriggerSizeClasses: Record<TabsSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
};

export const tabsTriggerVariantClasses: Record<TabsVariant, string> = {
  underline:
    "rounded-none border-b-2 border-transparent text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)] " +
    "data-[selected]:border-[var(--ui-primary)] data-[selected]:text-[var(--ui-fg)]",
  pill:
    "text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)] data-[selected]:bg-[var(--ui-surface)] data-[selected]:text-[var(--ui-fg)] data-[selected]:shadow-[var(--ui-shadow-sm)]",
};

export const tabsContentClass = "pt-4 text-[var(--ui-fg)]";
