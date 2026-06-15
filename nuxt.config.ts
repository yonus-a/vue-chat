// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
const loadLocaleFiles = (lang: string) => {
  const dir = path.resolve(process.cwd(), "i18n", "locales", lang);
  if (!fs.existsSync(dir)) {
    console.warn(`[i18n] Directory not found: ${dir}`);
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => `${lang}/${file}`);
};

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      script: [
        {
          // This must be a synchronous inline script, not a module
          innerHTML: `
            window.__PWA_INSTALL_EVENT__ = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.__PWA_INSTALL_EVENT__ = e;
            });
          `,
          type: "text/javascript",
          // Ensure it's executed early
          tagPosition: "head",
        },
      ],
      // Favicon for browsers
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
      ],
    },
  },
  css: ["~/assets/css/main.css", "~/assets/css/components.css"],
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
    plugins: [tailwindcss()],
  },
  future: {
    compatibilityVersion: 4,
  },
  runtimeConfig: {
    public: {
      siteUrl: "https://behayand.ir",
      apiBaseUrl: "https://api.behayand.ir",
      platformApiBaseUrl: "https://api.behayand.ir",
      domainName: "behayand.ir",
      vapidPublicKey:
        "BJl8mccIGmLam84dZoOSuXGAq884ip2hOjdF5OnyVE-P0Yu5NJZnHbbhHyG2NUSL5vJ7ju3oiCl359hIkNKZOp0",
      maptilerKey: "2ng2wxgc2Nm19zQvLgg4",
      altchaChallengeUrl: "https://api.behayand.ir/challenge",
      mqttWsUrl: "wss://emqx.wenex.tech/mqtt",
      sentryDsn: "",
      sentryTracesSampleRate: 0.8,

      google: {
        scope:
          "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        clientId:
          "932594562282-i2edm3ivp3adaf136fcijr7cg9p2kot3.apps.googleusercontent.com",
        redirectUri: "/oauth",
      },

      mapTileServerPath: "https://osm.wenex.tech/tile/{z}/{x}/{y}.png",
    },
  },
  modules: [
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@primevue/nuxt-module",
    "@vite-pwa/nuxt",
  ],
  pwa: {
    client: {
      installPrompt: true, // This is still needed for the module to set up the event listeners
    },
    manifest: {
      name: "Behayand",
      short_name: "Behayand",
      description: "سامانه مراقبت سلامت به آیند",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      // Use the correct icons that you already have
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,webp,svg,ico,woff2}"],
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
  components: [
    {
      path: "~/components/global",
      global: true,
    },
  ],
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith("altcha-"),
    },
  },
  colorMode: {
    preference: "system",
    fallback: "light",
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "",
    storageKey: "nuxt-color-mode",
  },
  i18n: {
    lazy: true,
    langDir: "locales",
    defaultLocale: "fa",
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
    locales: [
      { code: "en", iso: "en-US", dir: "ltr", files: loadLocaleFiles("en") },
      { code: "fa", iso: "fa-IR", dir: "rtl", files: loadLocaleFiles("fa") },
      { code: "ar", iso: "Ar-UA", dir: "rtl", files: loadLocaleFiles("ar") },
    ],
  },
});
