import type { BadgeTone } from "../../primitives/Badge/Badge.types";
import type {
  VerificationContext,
  VerificationStatus,
  VerificationSurface,
} from "./verification.types";

export function getVerificationStatusLabel(status: VerificationStatus): string {
  if (status === "verified") return "Verified";
  if (status === "failed") return "Failed";
  return "Unknown";
}

export function getVerificationHeadline(status: VerificationStatus): string {
  if (status === "verified") return "Verified proof";
  if (status === "failed") return "Failed proof";
  return "Unknown proof";
}

export function getVerificationBadgeTone(
  status: VerificationStatus
): BadgeTone {
  if (status === "verified") return "success";
  if (status === "failed") return "critical";
  return "neutral";
}

export function getVerificationSurfaceLabel(
  surface?: VerificationSurface
): string | undefined {
  if (surface === "browser") return "Browser";
  if (surface === "cli") return "CLI";
  if (surface === "ci") return "CI";
  return undefined;
}

export function getVerificationContextSubtext(
  status: VerificationStatus,
  context?: VerificationContext
): string | undefined {
  if (status === "unknown") return undefined;

  if (status === "verified") {
    if (context?.surface === "cli") return "Verified via CLI";
    if (context?.surface === "ci") return "Verified in CI";
    if (context?.surface === "browser") return "Verified in browser";
    return "Independent verification successful";
  }

  if (context?.surface === "cli") return "Verification failed via CLI";
  if (context?.surface === "ci") return "Verification failed in CI";
  if (context?.surface === "browser") return "Verification failed in browser";
  return "Independent verification failed";
}

export function truncateMiddle(
  value: string,
  leading = 12,
  trailing = 12
): string {
  if (value.length <= leading + trailing + 3) {
    return value;
  }

  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
}

export async function copyToClipboard(value: string): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

