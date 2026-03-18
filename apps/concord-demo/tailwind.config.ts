import baseConfig from "ternent-ui/tailwind.config";

const resolvedBaseConfig =
  (baseConfig as { default?: Record<string, unknown> })?.default ?? baseConfig;

export default {
  ...resolvedBaseConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,vue}",
    "../../packages/ternent-ui/**/*.{vue,ts,css}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
};
