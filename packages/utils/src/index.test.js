// sum.test.js
import { vi, expect, test } from "vitest";
import { addNewLines, removeLines, hashData, hashBytes } from "./index";

test("adds a newline every 64 characters", async () => {
  expect(
    addNewLines(
      "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwqweuyqwiueyqwieuqwyiuwhdfslKJFHSDLFuy23ipurhwefjkwenflkjwehqfqweuilyfweouiyerouiqweyrjksdahflsdajkfhasdlfjyh34iourwekfjhsdafkljghsdfluyalfsd"
    )
  ).toBe(`qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwqweuyqwiueyqwieuqwyiuwhdfslKJ
FHSDLFuy23ipurhwefjkwenflkjwehqfqweuilyfweouiyerouiqweyrjksdahfl
sdajkfhasdlfjyh34iourwekfjhsdafkljghsdfluyalfsd
`);
});

test("removes all newlines", async () => {
  expect(
    removeLines(`qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwqweuyqwiueyqwieuqwyiuwhdfslKJ
FHSDLFuy23ipurhwefjkwenflkjwehqfqweuilyfweouiyerouiqweyrjksdahfl
sdajkfhasdlfjyh34iourwekfjhsdafkljghsdfluyalfsd
`)
  ).toBe(
    "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwqweuyqwiueyqwieuqwyiuwhdfslKJFHSDLFuy23ipurhwefjkwenflkjwehqfqweuilyfweouiyerouiqweyrjksdahflsdajkfhasdlfjyh34iourwekfjhsdafkljghsdfluyalfsd"
  );
});

test("hash is stable across object key order", async () => {
  const first = await hashData({ a: 1, b: 2 });
  const second = await hashData({ b: 2, a: 1 });
  expect(first).toBe(second);
});

test("hashBytes is stable for equivalent bytes", async () => {
  const bytesA = new TextEncoder().encode("portable-proof");
  const bytesB = new Uint8Array(bytesA.buffer.slice(0));
  const first = await hashBytes(bytesA);
  const second = await hashBytes(bytesB);
  expect(first).toBe(second);
});
