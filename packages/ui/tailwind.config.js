/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],

  content: [
    "./pages/**/*.{js,jsx,vue}",
    "./components/**/*.{js,jsx,vue}",
    "./app/**/*.{js,jsx,vue}",
    "./src/**/*.{js,jsx,vue}",
  ],
  theme: {
    textColor: {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      default: "var(--color-font-base)",
      placeholder: "var(--color-font-base)",
    },
    backgroundColor: {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      default: "var(--color-background-base)",
    },
  },

  plugins: [require("tailwindcss-animate")],

  safelist: ["bg-default", "text-default"],
};
