// sum.test.js
import { vi, expect, test } from "vitest";
import { createLedger } from "./index";

vi.stubGlobal("crypto", () => ({
  digest: {},
}));

test("adds 1 + 2 to equal 3", async () => {
  expect(await createLedger(1, 2)).toBe(3);
});
