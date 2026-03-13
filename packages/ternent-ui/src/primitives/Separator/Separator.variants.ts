import type { SeparatorOrientation } from "./Separator.types";

export const separatorBaseClass = "shrink-0 bg-[var(--ui-border)]";

export const separatorOrientationClasses: Record<SeparatorOrientation, string> = {
  horizontal: "h-px w-full",
  vertical: "h-full min-h-4 w-px",
};
