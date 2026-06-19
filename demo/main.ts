import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { BehayandChat } from "@behayand/chat";

import App from "./App.vue";
import faMessages from "./locales/fa.json";

const app = createApp(App);

app.use(createPinia());
app.use(
  createI18n({
    legacy: false,
    locale: "fa",
    messages: { fa: faMessages },
  }),
);
app.use(BehayandChat);

app.mount("#app");
