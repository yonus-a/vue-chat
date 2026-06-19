import type { App } from "vue";
import { createStores } from "./stores/createStores";
import { createMockAdapter } from "./adapter/mock";
import type { HostAdapter } from "./adapter";
import { APP_STORES_KEY } from "./nuxt-shims";

const globalComponents = import.meta.glob<{ default: any }>(
  "./components/global/*.vue",
  { eager: true },
);

export interface BehayandChatOptions {
  /**
   * Host application adapter that provides chat/service/medication ports.
   * If omitted, a mock adapter is used (useful for previewing the UI).
   */
  adapter?: HostAdapter;
}

/**
 * Vue plugin that wires up the chat stores. The consumer must `app.use(...)`
 * this before rendering <ChatPage />. Pinia must already be installed on the
 * app instance.
 */
export const BehayandChat = {
  install(app: App, options: BehayandChatOptions = {}) {
    const adapter: HostAdapter = options.adapter ?? createMockAdapter();
    const appStores = createStores({ adapter });
    app.provide(APP_STORES_KEY, appStores);

    for (const [path, mod] of Object.entries(globalComponents)) {
      const name = path.split("/").pop()!.replace(/\.vue$/, "");
      app.component(name, mod.default);
    }
  },
};

export type AppStores = ReturnType<typeof createStores>;
