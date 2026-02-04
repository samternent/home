import { canonicalStringify } from "./canonical";
import { utf8Bytes } from "./encoding";

export const ASSERTION_ENTRY_KIND = "assertions";

export interface AssertionSubject {
  kind: string;
  id: string;
}

export interface Assertion {
  id: string;
  subject: AssertionSubject;
  claim: string;
  payload?: unknown;
  assertedBy: string;
  assertedAt: number;
  signature: string;
}

export type AssertionSigningPayload = {
  subject: AssertionSubject;
  claim: string;
  assertedBy: string;
  assertedAt: number;
  payload?: unknown;
};

/**
 * Returns the assertion fields used for signing (excludes id, signature).
 */
export function getAssertionCore(assertion: Assertion): AssertionSigningPayload {
  const core: AssertionSigningPayload = {
    subject: {
      kind: assertion.subject.kind,
      id: assertion.subject.id,
    },
    claim: assertion.claim,
    assertedBy: assertion.assertedBy,
    assertedAt: assertion.assertedAt,
  };

  if (assertion.payload !== undefined) {
    core.payload = assertion.payload;
  }

  return core;
}

/**
 * Canonical signing payload for an assertion.
 */
export function getAssertionSigningPayload(assertion: Assertion): string {
  return canonicalStringify(getAssertionCore(assertion));
}

/**
 * Canonical signing payload as bytes for an assertion.
 */
export function getAssertionSigningBytes(assertion: Assertion): Uint8Array {
  return utf8Bytes(getAssertionSigningPayload(assertion));
}
