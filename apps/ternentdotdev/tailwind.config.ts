import baseConfig from "ternent-ui/tailwind.config";

const resolvedBaseConfig =
  (baseConfig as { default?: Record<string, unknown> })?.default ?? baseConfig;

export default {
  ...resolvedBaseConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,vue}",
    "../../packages/ternent-ui/**/*.{vue,ts,css}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--ui-bg)",
        fg: "var(--ui-fg)",
        "fg-muted": "var(--ui-fg-muted)",
        surface: "var(--ui-surface)",
        border: "var(--ui-border)",
        primary: "var(--ui-primary)",
        "primary-hover": "var(--ui-primary-hover)",
        "on-primary": "var(--ui-on-primary)",
      },
      fontFamily: {
        sans: ["\"Clash Grotesk\"", "system-ui", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "ui-monospace", "monospace"],
      },
    },
  },
};
