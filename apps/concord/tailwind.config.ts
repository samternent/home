export default {
  darkMode: "media",
  content: [
    "./index.html",
    "./src/**/*.{js,vue,ts}",
    "../../packages/ternent-ui/**/*.{vue,ts,css}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--ui-bg)",
        fg: "var(--ui-fg)",

        primary: "var(--ui-primary)",
        "primary-hover": "var(--ui-primary-hover)",
        "on-primary": "var(--ui-on-primary)",

        secondary: "var(--ui-secondary)",
        "secondary-hover": "var(--ui-secondary-hover)",
        "on-secondary": "var(--ui-on-secondary)",

        danger: "var(--ui-danger)",
        "danger-hover": "var(--ui-danger-hover)",
        "on-danger": "var(--ui-on-danger)",
      },
      borderRadius: {
        sm: "var(--ui-radius-sm)",
        md: "var(--ui-radius-md)",
        lg: "var(--ui-radius-lg)",
      },
    },
  },
};
