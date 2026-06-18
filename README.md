# @behayand/chat

Reusable Vue 3 chat dashboard component extracted from the Behayand frontend.

The package ships a single composed page component (`<ChatPage />`) plus the host-adapter wiring needed to drive it.

## Install

```bash
yarn add @behayand/chat
# peer dependencies
yarn add vue vue-i18n pinia @vueuse/core
```

## Usage

```ts
// main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { BehayandChat, ChatPage } from "@behayand/chat";
import "@behayand/chat/style.css";

const app = createApp({ /* ... */ });

app.use(createPinia());
app.use(createI18n({ legacy: false, locale: "fa", messages: { fa: { /* chat.*, seo.* */ } } }));
app.use(BehayandChat /* , { adapter: myAdapter } */);

// then render <ChatPage /> wherever you want it
```

If no `adapter` is passed, `createMockAdapter()` is used so you can preview the UI without a backend. Implement the `HostAdapter` interface to plug in your real data sources:

```ts
import type { HostAdapter } from "@behayand/chat";

const adapter: HostAdapter = {
  chat: /* ChatAdapter */,
  chatAction: /* ChatActionAdapter */,
  service: /* ServiceAdapter */,
  medication: /* MedicationAdapter */,
};
```

## Build

```bash
yarn build       # vite build + vue-tsc typecheck
yarn build:lib   # vite build only
yarn dev         # vite build --watch
```

Outputs land in `dist/`:

- `dist/index.mjs` / `dist/index.cjs` — ESM and CJS bundles
- `dist/style.css` — extracted styles (import once)
- `dist/types/` — generated `.d.ts` tree, entry at `dist/types/index.d.ts`
