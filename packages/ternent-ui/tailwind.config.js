import { ternentDotDev, murder, clubColors, concords, greener } from "./themes";
import { buildThemes } from "./themes/util";

const themes = {
  ...buildThemes({ ...clubColors }),
  murder,
  ...ternentDotDev,
  ...concords,
  ...greener,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,vue}",
    "./components/**/*.{js,jsx,vue}",
    "./app/**/*.{js,jsx,vue}",
    "./src/**/*.{js,jsx,vue}",
  ],
  safelist: [
    {
      pattern:
        /(fill|bg|text|border|btn)-(accent|primary|secondary|neutral|error|info|success|base-(100|200|300)|sm|xs)|(bg|text|btn)-(info|green|base|red|orange)-(100|200|300|400|500|600|700|800|900)|skeleton|input|join-item|join/,
      variants: ["hover"],
    },
  ],
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [themes],
  },
};
