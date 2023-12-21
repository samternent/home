import { ternentDotDev, murder, clubColors } from "./themes";
import { buildThemes } from "./themes/util";

const themes = { ...buildThemes({ ...clubColors }), murder, ...ternentDotDev };

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
        /(bg|text|border|btn)-(accent|primary|secondary|error|info|success|base-(100|200|300))|(bg|text|btn)-(info|green|base|red|orange)-(100|200|300|400|500|600|700|800|900)|skeleton|input|join-item|join/,
      variants: ["hover"],
    },
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [themes],
  },
};
