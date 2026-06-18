import { useNuxtApp } from "~/nuxt-shims";
import type { AppStores } from "./createStores";

export const useServiceStore = () => {
  const { $appStores } = useNuxtApp() as unknown as {
    $appStores: AppStores;
  };
  return $appStores.useServiceStore();
};
