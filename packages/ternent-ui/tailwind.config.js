import { designTokens } from "./src/design-system/tokens.js";

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,jsx,vue}",
    "./components/**/*.{js,jsx,vue}",
    "./app/**/*.{js,jsx,vue}",
    "./src/**/*.{js,jsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        ...designTokens.colors,
        "base-50": "color-mix(in srgb, var(--ui-bg) 92%, var(--ui-fg) 8%)",
        "base-100": "var(--ui-bg)",
        "base-200": "var(--ui-surface)",
        "base-300": "var(--ui-border)",
        "base-content": "var(--ui-fg)",
        primary: "var(--ui-primary)",
        "primary-content": "var(--ui-on-primary)",
        secondary: "var(--ui-secondary)",
        "secondary-content": "var(--ui-on-secondary)",
        accent: "var(--ui-accent)",
        "accent-content": "var(--ui-on-accent)",
        success: "var(--ui-success)",
        "success-content": "var(--ui-on-success)",
        warning: "var(--ui-warning)",
        "warning-content": "var(--ui-on-warning)",
        error: "var(--ui-critical)",
        "error-content": "var(--ui-on-critical)",
        info: "var(--ui-info)",
        "info-content": "var(--ui-on-info)",
        neutral: "var(--ui-fg-muted)",
      },
      spacing: {
        ...designTokens.spacing,
      },
      borderRadius: {
        ...designTokens.borderRadius,
      },
      boxShadow: {
        ...designTokens.shadow,
      },
      fontSize: {
        ...designTokens.typography.fontSize,
      },
      fontFamily: {
        ...designTokens.typography.fontFamily,
      },
      letterSpacing: {
        ...designTokens.typography.letterSpacing,
      },
    },
  },
};
