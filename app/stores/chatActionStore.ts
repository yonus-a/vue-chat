import { useNuxtApp } from "~/nuxt-shims";
import type { AppStores } from "./createStores";

export const useChatActionStore = () => {
  const { $appStores } = useNuxtApp() as unknown as {
    $appStores: AppStores;
  };
  return $appStores.useChatActionStore();
};
