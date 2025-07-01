import { ternentDotDev, clubColors, concords, sleek } from "./themes";
import { buildThemes } from "./themes/util";

const themes = {
  ...buildThemes({ ...clubColors }),
  ...ternentDotDev,
  ...concords,
  sleekLight: sleek.light,
  sleekDark: sleek.dark,
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
        /(fill|bg|text|border|btn|link|input|toggle)-(accent|primary|secondary|neutral|error|info|success|base-(100|200|300)|sm|xs)|(bg|text|btn)-(info|green|base|red|orange)-(100|200|300|400|500|600|700|800|900|content)|skeleton|input|join-item|join|link|input-error|bg-opacity-(10|20|30|40|50|60|70|80|90|)|tab|tabs-(boxed|lifted|bordered)|tablist|tab-active|glass|card|table|table-(sm|xs|zebra)/,
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
      {
        sleekLight: sleek.light,
      },
      {
        sleekDark: sleek.dark,
      },
      ...Object.entries(themes).map(([name, theme]) => ({ [name]: theme })),
    ],
  },
};
