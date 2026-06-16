import { useNuxtApp } from "#imports";
import type { AppStores } from "./createStores";

export const useCallStore = () => {
  const { $appStores } = useNuxtApp() as unknown as {
    $appStores: AppStores;
  };
  return $appStores.useCallStore();
};
