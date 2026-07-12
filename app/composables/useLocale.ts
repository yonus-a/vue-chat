// app/composables/useLocale.ts

import { computed, watchEffect } from "vue";
import flagUs from "~/assets/flags/us.svg";
import flagIr from "~/assets/flags/ir.svg";
import flagAe from "~/assets/flags/ae.svg";
import { useI18n } from "vue-i18n";

const FLAG_BY_COUNTRY: Record<string, string> = {
  US: flagUs,
  IR: flagIr,
  AE: flagAe,
};

const DEFAULT_LOCALES: Array<{ code: string; dir: "ltr" | "rtl"; name: string }> = [
  { code: "fa", dir: "rtl", name: "فارسی" },
  { code: "en", dir: "ltr", name: "English" },
  { code: "ar", dir: "rtl", name: "العربية" },
];

export const useLocale = () => {
  const i18n = useI18n() as unknown as {
    locale: { value: string };
    setLocale?: (l: string) => Promise<void> | void;
    locales?: { value: Array<{ code: string; dir?: string; name?: string }> };
  };
  const locale = i18n.locale;

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

  const sourceLocales = computed(() =>
    i18n.locales?.value?.length ? i18n.locales.value : DEFAULT_LOCALES,
  );

  const languages = computed(() => {
    return sourceLocales.value.map((loc: any) => {
      const countryCode = localeToCountryMap[loc.code] || "US";
      return {
        ...loc,
        title: localeTitles[loc.code] || loc.name || loc.code,
        countryCode: countryCode.toUpperCase(),
        flag: FLAG_BY_COUNTRY[countryCode] ?? FLAG_BY_COUNTRY.US,
      };
    });
  });

  const currentCountry = computed(() => {
    return (
      languages.value.find((lang) => lang.code === locale.value) ||
      languages.value[0]
    );
  });

  const flagUrl = computed(() => currentCountry.value?.flag ?? "");

  const dir = computed(() => {
    const currentLocaleObj = sourceLocales.value.find(
      (l: any) => l.code === locale.value,
    );
    return (currentLocaleObj?.dir as "ltr" | "rtl" | undefined) || "ltr";
  });

  // useHead is a no-op shim in plain-Vite hosts, so apply html attrs directly.
  if (typeof document !== "undefined") {
    watchEffect(() => {
      document.documentElement.setAttribute("dir", dir.value);
      document.documentElement.setAttribute("lang", locale.value);
    });
  }

  const switchLocale = async (newLocale: string) => {
    if (i18n.setLocale) {
      await i18n.setLocale(newLocale);
    } else {
      locale.value = newLocale;
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("user-locale", newLocale);
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
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
