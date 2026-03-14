export type VerificationStatus = "verified" | "failed" | "unknown";
export type VerificationSurface = "browser" | "cli" | "ci";
export type VerificationLocation = "hero" | "app" | "footer" | "embed";
export type VerificationContext = {
  surface?: VerificationSurface;
  location?: VerificationLocation;
};
export type VerificationVariant = "full" | "compact" | "embed";

