import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import AutoImport from "unplugin-auto-import/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: [
        "vue",
        {
          "@vueuse/core": ["useWindowSize", "useEventBus"],
          "vue-i18n": ["useI18n"],
        },
      ],
      dts: "./auto-imports.d.ts",
      vueTemplate: true,
    }),
    dts({
      include: ["app/**/*.ts", "app/**/*.vue", "app/**/*.d.ts"],
      outDir: "dist/types",
      entryRoot: "app",
      tsconfigPath: "./tsconfig.json",
      copyDtsFiles: true,
      logLevel: "warn",
      compilerOptions: {
        noCheck: true,
        skipLibCheck: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, "app/index.ts"),
      name: "BehayandChat",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es" ? "index.mjs" : "index.cjs",
    },
    rollupOptions: {
      external: [
        "vue",
        "vue-i18n",
        "pinia",
        "@vueuse/core",
        "primevue",
        "@primevue/themes",
        "@phosphor-icons/vue",
        "chart.js",
        "maplibre-gl",
        "signature_pad",
        "vue-advanced-cropper",
        "vue3-lottie",
        "@emoji-mart/data",
        "emoji-mart",
        "@twemoji/api",
        "@tanstack/vue-virtual",
        "altcha",
      ],
      output: {
        globals: {
          vue: "Vue",
          "vue-i18n": "VueI18n",
          pinia: "Pinia",
          "@vueuse/core": "VueUse",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.css$/.test(assetInfo.name)) {
            return "style.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
    sourcemap: true,
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
