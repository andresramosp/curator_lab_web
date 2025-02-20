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

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
const vuetify = createVuetify({
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        colors: {
          primary: "#FFFFFF",
          secondary: "#02FFA1",
          background: "#060613",
          surface: "#242432",
        },
      },
    },
  },
  // defaults: {
  //   VBtn: {
  //     style: (props) =>
  //       !props.outlined
  //         ? "color: rgb(var(--v-theme-secondary)) !important;"
  //         : "background-color: rgb(var(--v-theme-secondary)) !important; color: rgb(var(--v-theme-on-secondary));",
  //   },
  // },
});

export default vuetify;
