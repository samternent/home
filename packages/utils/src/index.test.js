// sum.test.js
import { vi, expect, test } from "vitest";
import { addNewLines, removeLines, hashData } from "./index";

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
