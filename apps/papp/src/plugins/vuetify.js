/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";
import { md3 } from "vuetify/blueprints";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  blueprint: md3,
  defaults: {
    global: {
      ripple: false,
    },
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      light: {
        colors: {
          primary: "#1867C0",
          secondary: "#5CBBF6",
          accent: "#4caf50",
          error: "#f44336",
          warning: "#ff9800",
          info: "#607d8b",
          success: "#8bc34a",
        },
      },
      dark: {
        primary: "#cddc39",
        secondary: "#e91e63",
        accent: "#4caf50",
        error: "#f44336",
        warning: "#ff9800",
        info: "#607d8b",
        success: "#8bc34a",
      },
    },
  },
});
