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
        /(bg|text)-(accent|primary|secondary)|(bg|text|btn)-(info|green|base)-(100|200|300|400|500|600|700|800|900)/,
      variants: ["hover"],
    },
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "synthwave",
      "cyberpunk",
      "dim",
    ],
  },
};
