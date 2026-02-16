import { randomInt } from "node:crypto";

function assertMaxExclusive(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("rng.nextInt requires maxExclusive > 0.");
  }
}

export function createCryptoRngSource() {
  return {
    kind: "crypto",
    nextInt(maxExclusive) {
      assertMaxExclusive(maxExclusive);
      return randomInt(maxExclusive);
    },
  };
}

export function createDelegateRngSource(delegateFn) {
  if (typeof delegateFn !== "function") {
    throw new Error("createDelegateRngSource requires a function.");
  }
  return {
    kind: "delegate",
    nextInt(maxExclusive, context = {}) {
      assertMaxExclusive(maxExclusive);
      const value = Number(delegateFn(maxExclusive, context));
      if (!Number.isInteger(value) || value < 0 || value >= maxExclusive) {
        throw new Error("Delegate RNG returned an out-of-range index.");
      }
      return value;
    },
  };
}
