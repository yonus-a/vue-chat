import type { Ref } from "vue";

export type ThemeMode = "light" | "dark";

export type ColorModeInstance = Ref<ThemeMode> & {
  preference: ThemeMode;
  value: ThemeMode;
};

export type CssVariables = {
  background: string;
  primary: string;
  secondary: string;
  fontFamily: string;
  fontSize: string;
};

export type ThemePresetName = "default" | "midnight" | "warm";

export type Theme = {
  mode: ColorModeInstance | any;
  cssVariable: CssVariables;
  styleVars: Record<string, string>;
  toggleMode: () => void;
};

export type ThemeInput = {
  name?: ThemePresetName;
  overrides?: Partial<CssVariables>;
  global?: boolean;
};
