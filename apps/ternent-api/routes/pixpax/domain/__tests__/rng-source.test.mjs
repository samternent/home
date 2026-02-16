import assert from "node:assert/strict";
import test from "node:test";
import { createCryptoRngSource, createDelegateRngSource } from "../rng-source.mjs";

test("createCryptoRngSource returns bounded integers", () => {
  const rng = createCryptoRngSource();
  for (let i = 0; i < 10; i += 1) {
    const value = rng.nextInt(7);
    assert.ok(Number.isInteger(value));
    assert.ok(value >= 0 && value < 7);
  }
});

test("createDelegateRngSource forwards context and validates range", () => {
  const calls = [];
  const rng = createDelegateRngSource((maxExclusive, context) => {
    calls.push({ maxExclusive, context });
    return 2;
  });
  const out = rng.nextInt(5, { slotIndex: 3 });
  assert.equal(out, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].maxExclusive, 5);
  assert.equal(calls[0].context.slotIndex, 3);
});

test("createDelegateRngSource rejects invalid delegate outputs", () => {
  const rng = createDelegateRngSource(() => 99);
  assert.throws(() => rng.nextInt(3), /out-of-range/);
});
