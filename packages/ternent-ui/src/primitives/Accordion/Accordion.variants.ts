export const accordionRootClass = "w-full divide-y divide-[var(--ui-border)]";
export const accordionItemClass = "group";
export const accordionTriggerClass =
  "flex w-full items-center justify-between gap-3 py-4 text-left text-[var(--ui-fg)] " +
  "transition-[color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "hover:text-[var(--ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]";
export const accordionTitleClass = "flex-1 text-sm font-medium";
export const accordionIndicatorClass =
  "size-4 text-[var(--ui-fg-muted)] transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] group-data-[state=open]:rotate-180";
export const accordionContentClass =
  "overflow-hidden text-sm text-[var(--ui-fg-muted)] data-[state=open]:animate-[accordion-down_var(--ui-duration-normal)_var(--ui-ease-out)] data-[state=closed]:animate-[accordion-up_var(--ui-duration-fast)_var(--ui-ease-out)]";
export const accordionPanelClass = "pb-4 pt-1";
