import type { CssVariables, ThemePresetName } from "../types/theme";

const PRESETS: Record<ThemePresetName, CssVariables> = {
  default: {
    background: "var(--color-surface)",
    primary: "var(--color-primary-600)",
    secondary: "var(--color-secondary-600)",
    fontFamily: "'Vazirmatn', system-ui, sans-serif",
    fontSize: "14px",
  },
  midnight: {
    background: "var(--color-black-700)",
    primary: "var(--color-primary-400)",
    secondary: "var(--color-secondary-400)",
    fontFamily: "'Vazirmatn', system-ui, sans-serif",
    fontSize: "14px",
  },
  warm: {
    background: "var(--color-warning-50)",
    primary: "var(--color-warning-700)",
    secondary: "var(--color-error-500)",
    fontFamily: "'Vazirmatn', system-ui, sans-serif",
    fontSize: "15px",
  },
};

export const themePresetNames = Object.keys(PRESETS) as ThemePresetName[];

export const getTheme = (
  name: ThemePresetName = "default",
  overrides?: Partial<CssVariables>,
): CssVariables => ({
  ...PRESETS[name],
  ...(overrides ?? {}),
});
