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
      accent: "var(--color-base-pink-600)",
    },
    backgroundColor: {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      default: "var(--color-background-base)",
      primary: "var(--color-background-button-primary-base)",
    },
    borderColor: {
      transparent: "transparent",
      primary: "var(--color-brand-primary-base)",
      "primary-light": "var(--color-brand-primary-light)",
      default: "var(--color-border-base)",
      light: "var(--color-border-light)",
      dark: "var(--color-border-dark)",
    },
  },

  plugins: [require("tailwindcss-animate")],

  safelist: ["bg-default", "text-default"],
};
