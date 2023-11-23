const tailwindConfig = require("ternent-ui/tailwind.config");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,vue}"],
  ...tailwindConfig,
};
