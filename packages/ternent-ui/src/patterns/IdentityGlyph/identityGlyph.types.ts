import type { SerializedIdentity } from "@ternent/identity";

export type IdentityGlyphAlgorithm = "glyph:v1";

export type IdentityGlyphInput =
  | string
  | SerializedIdentity
  | { publicKey: string }
  | { identityKey: string }
  | {
      identity:
        | SerializedIdentity
        | { publicKey: string }
        | { identityKey: string };
    };

export type IdentityGlyphSize = "xs" | "sm" | "md" | "lg";

export type IdentityGlyphPalette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
};

export type IdentityGlyphModel = {
  algorithm: IdentityGlyphAlgorithm;
  canonicalIdentity: string;
  shortIdentity: string;
  fallback: boolean;
  grid: number[][];
  palette: IdentityGlyphPalette;
};

export type ResolvedIdentityGlyphInput = {
  canonicalIdentity: string;
  shortIdentity: string;
  fallback: boolean;
};
