import type { SplitViewRailWidth } from "./SplitView.types";

export function getSplitViewRailWidthClass(width: SplitViewRailWidth): string {
  if (width === "sm") {
    return "md:basis-64 md:max-w-64";
  }

  if (width === "lg") {
    return "md:basis-80 md:max-w-80";
  }

  return "md:basis-72 md:max-w-72";
}
