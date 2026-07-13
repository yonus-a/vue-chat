import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import { createMockChatHelpers } from "./mock/conversations";
import { createMockMessagesHandlers } from "./mock/messages";
import { createMockCallHandlers } from "./mock/call";

import { createCall, createChat, createMessages } from "../../dist";

import App from "./App.vue";
import "./style.css";

const i18n = createI18n({
  fallbackLocale: "en",
  legacy: false,
  locale: "fa",
  messages: {},
});

createChat({ handlers: createMockChatHelpers() });
createMessages({ handlers: createMockMessagesHandlers() });
createCall({ handlers: createMockCallHandlers() });

const app = createApp(App);
app.use(createPinia());
app.use(i18n);

app.mount("#app");
