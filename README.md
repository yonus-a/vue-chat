# @yonus_amire01/chat

Reusable Vue 3 chat dashboard component extracted from the Behayand frontend.

The package ships a single composed page component (`<ChatPage />`) plus the host-adapter wiring needed to drive it.

## Install

```bash
yarn add @yonus_amire01/chat
# peer dependencies
yarn add vue vue-i18n pinia @vueuse/core
```

## Usage (plain Vue + Vite)

```ts
// main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { BehayandChat, ChatPage } from "@yonus_amire01/chat";
import "@yonus_amire01/chat/style.css";

import App from "./App.vue";
// Required message keys — see "i18n keys" below.
import faMessages from "./locales/fa.json";

const app = createApp(App);

app.use(createPinia()); // Pinia must be installed BEFORE BehayandChat.
app.use(
  createI18n({
    legacy: false,
    locale: "fa",
    messages: { fa: faMessages },
  }),
);
app.use(BehayandChat /* , { adapter: myAdapter } */);

app.mount("#app");
```

Then render `<ChatPage />` anywhere.

If no `adapter` is passed, `createMockAdapter()` is used so you can preview the UI without a backend.

```ts
import type { HostAdapter } from "@yonus_amire01/chat";

const adapter: HostAdapter = {
  chat: /* ChatAdapter */,
  chatAction: /* ChatActionAdapter */,
  service: /* ServiceAdapter */,
  medication: /* MedicationAdapter */,
};
```

## Usage (Nuxt 3 / 4)

Create `app/plugins/behayand-chat.ts`:

```ts
import { BehayandChat } from "@yonus_amire01/chat";
import "@yonus_amire01/chat/style.css";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(BehayandChat /* , { adapter } */);
});
```

Pinia and i18n come from `@pinia/nuxt` and `@nuxtjs/i18n` modules — don't install them manually.

## What `BehayandChat.install` does

- Creates the chat / chat-action / service / medication / call stores against the supplied (or mock) adapter and provides them on the Vue app.
- Globally registers every component under `components/global/*.vue` (`BButton`, `BLabel`, `BVirtualVerticalList`, …) so templates inside `<ChatPage />` resolve them.

You don't need to install PrimeVue — the package doesn't import any PrimeVue components.

## i18n keys

The chat UI reads keys under `chat.*`. At minimum:

```jsonc
{
  "chat": {
    "you": "You",
    "noConversationSelected": "Select a conversation",
    "noMessages": "No conversations yet",
    "copiedMessage": "Copied",
    "filters": {
      "online": "Online",
      "ended": "Ended",
      "active": "Active"
    }
  }
}
```

Translations for additional message types (file/voice/request bubbles, medication picker, etc.) are required if you exercise those flows. The Persian set used in development lives in the host repo.

## Styles

`import "@yonus_amire01/chat/style.css"` ships:

- Tailwind v4 base + utilities (scoped to the package's class usage),
- Theme tokens (`--color-primary-*`, `--color-surface`, gradient utilities, etc.),
- `IranYekan` / `IranYekanFaNum` `@font-face` declarations (woff files bundled),
- Bundled flag SVGs (`fa`/`en`/`ar`).

There is no separate `theme.css`/`components.css` to import.

## Build

```bash
yarn build       # vite build
yarn build:strict # vite build + vue-tsc typecheck
yarn dev         # vite build --watch
```

Outputs land in `dist/`:

- `dist/index.mjs` / `dist/index.cjs` — ESM and CJS bundles
- `dist/style.css` — extracted styles (import once)
- `dist/assets/` — bundled fonts, flag SVGs, lib-images
- `dist/types/` — generated `.d.ts` tree, entry at `dist/types/index.d.ts`
