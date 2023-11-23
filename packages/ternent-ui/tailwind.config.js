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
        /(bg|text|border|btn)-(accent|primary|secondary|error|info|success)|(bg|text|btn)-(info|green|base|red|orange)-(100|200|300|400|500|600|700|800|900)|skeleton|input/,
      variants: ["hover"],
    },
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "cupcake",
      "dim",
      {
        light: {
          ...require("daisyui/src/theming/themes")["cupcake"],
          primary: "#4F46E5",
          accent: "#BE195D",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dim"],
          primary: "#4F46E5",
          accent: "#BE195D",
        },
      },
    ],
  },
};
