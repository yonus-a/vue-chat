// app/composables/useLocale.ts

import { computed } from "vue";
import { useHead, useI18n } from "~/nuxt-shims";

export const useLocale = () => {
  // Plain vue-i18n exposes only `locale` on the Composer. `setLocale` and
  // `locales` are Nuxt i18n module additions; we cast through `any` so the
  // existing API surface keeps compiling. Consumers wiring the library outside
  // Nuxt must provide their own locale list if they need the full surface.
  const i18n = useI18n() as unknown as {
    locale: { value: string };
    setLocale: (l: string) => Promise<void> | void;
    locales: { value: Array<{ code: string; dir?: string; name?: string }> };
  };
  const { locale, setLocale, locales } = i18n;

  const localeToCountryMap: Record<string, string> = {
    en: "US",
    fa: "IR",
    ar: "AE",
  };

  const localeTitles: Record<string, string> = {
    en: "English",
    fa: "فارسی",
    ar: "العربية",
  };

  const languages = computed(() => {
    return locales.value.map((loc: any) => {
      const countryCode = localeToCountryMap[loc.code] || "US";
      return {
        ...loc,
        title: localeTitles[loc.code] || loc.name || loc.code,
        countryCode: countryCode.toUpperCase(),
        flag: `/flags/${countryCode.toLowerCase()}.svg`,
      };
    });
  });

  // Updated currentCountry to include the native title
  const currentCountry = computed(() => {
    return (
      languages.value.find((lang) => lang.code === locale.value) ||
      languages.value
    );
  });

  const flagUrl = computed(() => {
    return currentCountry.value?.code
      ? `/flags/${currentCountry.value.code.toLowerCase()}.svg`
      : "";
  });

  const dir = computed(() => {
    const currentLocaleObj = locales.value.find(
      (l: any) => l.code === locale.value,
    );
    return currentLocaleObj?.dir || "ltr";
  });

  useHead({
    htmlAttrs: {
      dir: dir,
      lang: locale,
    },
  });

  const switchLocale = async (newLocale: string) => {
    await setLocale(newLocale);
    localStorage.setItem("user-locale", newLocale);
    window.location.reload();
  };

  const otherLanguages = computed(() => {
    return languages.value.filter((lang) => lang.code !== locale.value);
  });

  return {
    locale,
    languages,
    otherLanguages,
    currentCountry,
    flagUrl,
    dir,
    switchLocale,
  };
};
