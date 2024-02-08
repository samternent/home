// sum.test.js
import { vi, expect, test } from "vitest";
import { addNewLines, removeLines } from "./index";

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
