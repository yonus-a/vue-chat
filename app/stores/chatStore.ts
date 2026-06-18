import { useNuxtApp } from "~/nuxt-shims";
import type { AppStores } from "./createStores";

export const useChatStore = () => {
  const { $appStores } = useNuxtApp() as unknown as {
    $appStores: AppStores;
  };
  return $appStores.useChatStore();
};
