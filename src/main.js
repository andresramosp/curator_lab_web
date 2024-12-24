/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";
import { createPinia } from "pinia";
import "@/styles/global.scss";

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";

const app = createApp(App);

registerPlugins(app);

const pinia = createPinia();
app.use(pinia);

app.mount("#app");
