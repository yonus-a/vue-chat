import type { Theme } from "../types/theme";
import { inject, provide, type InjectionKey } from "vue";
import { useColorMode } from "@vueuse/core";

const THEME_KEY: InjectionKey<Theme> = Symbol("app_theme");

export const provideTheme = (): Theme => {
  const mode = useColorMode();

  const theme: Theme = {
    mode,
    toggleMode: () => {
      (mode as any).preference = mode.value === "light" ? "dark" : "light";
    },
  };

  provide(THEME_KEY, theme);
  return theme;
};

export const useTheme = (): Theme => {
  const theme = inject(THEME_KEY);
  if (!theme) {
    throw new Error("useTheme() called without provideTheme() in an ancestor");
  }
  return theme;
};