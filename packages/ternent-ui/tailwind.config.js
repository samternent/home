import { ternentDotDev, clubColors, concords } from "./themes";
import { buildThemes } from "./themes/util";

const themes = {
  ...buildThemes({ ...clubColors }),
  ...ternentDotDev,
  ...concords,
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
        /(fill|bg|text|border|btn|link)-(accent|primary|secondary|neutral|error|info|success|base-(100|200|300)|sm|xs)|(bg|text|btn)-(info|green|base|red|orange)-(100|200|300|400|500|600|700|800|900|content)|skeleton|input|join-item|join|link/,
      variants: ["hover"],
    },
  ],
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  darkMode: "false",
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
      themes,
    ],
  },
};
