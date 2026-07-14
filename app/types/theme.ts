import type { Ref } from "vue";

export type ThemeMode = "light" | "dark";

export type ColorModeInstance = Ref<ThemeMode> & {
  preference: ThemeMode;
  value: ThemeMode;
};

export type Theme = {
  mode: ColorModeInstance | any;
  toggleMode: () => void;
};