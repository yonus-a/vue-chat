/**
 * Compatibility shims that let source files originally written for Nuxt's
 * auto-import system (`#imports`, `#app`) keep working inside a plain
 * Vue 3 + Vite library build. Every former `from '#imports'` /
 * `from '#app'` is rewritten to point here.
 */
import { ref, type Ref, inject, getCurrentInstance } from "vue";

export { useI18n } from "vue-i18n";
export { useWindowSize, useEventBus } from "@vueuse/core";

export { useClickOutside } from "./composables/useClickOutside";
export { useDevice } from "./composables/useDevice";
export { useDate } from "./composables/useDate";
export { useAppToast } from "./composables/useAppToast";
export { useAppPermissions } from "./composables/useAppPermissions";
export { useLocale } from "./composables/useLocale";
export { useTheme, provideTheme } from "./composables/useTheme";
export { useValidation } from "./composables/useValidation";

export { useChatStore } from "./stores/chatStore";
export { useChatActionStore } from "./stores/chatActionStore";
export { useCallStore } from "./stores/callStore";
export { useServiceStore } from "./stores/serviceStore";
export { useMedicationStore } from "./stores/medicationsStore";

export { formatBytes, formatCurrency } from "./utils/format";

export const APP_STORES_KEY = Symbol("behayand:appStores");

export const useNuxtApp = () => {
  const instance = getCurrentInstance();
  const appStores =
    (instance && inject<any>(APP_STORES_KEY, null)) || null;
  return { $appStores: appStores };
};

const stateMap = new Map<string, Ref<unknown>>();
export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init ? init() : (undefined as unknown as T)) as Ref<unknown>);
  }
  return stateMap.get(key) as Ref<T>;
}

export function useHead(_: unknown) {
  /* no-op: head management is the host app's responsibility */
}

export function useSeoMeta(_: unknown) {
  /* no-op */
}

type ColorModeRef = Ref<"light" | "dark"> & { preference: "light" | "dark"; value: "light" | "dark" };
let colorModeSingleton: ColorModeRef | null = null;
export function useColorMode(): ColorModeRef {
  if (colorModeSingleton) return colorModeSingleton;
  const r = ref<"light" | "dark">("light") as Ref<"light" | "dark">;
  const proxy = new Proxy(r as unknown as ColorModeRef, {
    get(target, key) {
      if (key === "preference") return target.value;
      return (target as any)[key];
    },
    set(target, key, value) {
      if (key === "preference" || key === "value") {
        (target as any).value = value;
        return true;
      }
      (target as any)[key] = value;
      return true;
    },
  });
  colorModeSingleton = proxy;
  return proxy;
}

export function defineNuxtPlugin(_: unknown) {
  return _;
}
