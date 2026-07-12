import { inject, provide, type InjectionKey } from "vue";
import { getTheme } from "../themes/factory";
import type { CssVariables, Theme, ThemeInput } from "../types/theme";
import { useColorMode } from "@vueuse/core";

const THEME_KEY: InjectionKey<Theme> = Symbol("app_theme");
const GLOBAL_STYLE_ID = "app-theme-vars";

const toStyleVars = (vars: CssVariables): Record<string, string> => ({
  "--theme-background": vars.background,
  "--theme-primary": vars.primary,
  "--theme-secondary": vars.secondary,
  "--theme-font-family": vars.fontFamily,
  "--theme-font-size": vars.fontSize,
});

const injectGlobal = (styleVars: Record<string, string>) => {
  if (typeof document === "undefined") return;
  let style = document.getElementById(GLOBAL_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = GLOBAL_STYLE_ID;
    document.head.appendChild(style);
  }
  const body = Object.entries(styleVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  style.textContent = `:root {\n${body}\n}`;
};

export const provideTheme = (input: ThemeInput = {}): Theme => {
  const mode = useColorMode();
  const cssVariable = getTheme(input.name, input.overrides);
  const styleVars = toStyleVars(cssVariable);

  if (input.global) injectGlobal(styleVars);

  const theme: Theme = {
    mode,
    cssVariable,
    styleVars,
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
