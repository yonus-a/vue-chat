import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
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
      dts: fileURLToPath(new URL("./auto-imports.d.ts", import.meta.url)),
      vueTemplate: true,
    }),
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("../app", import.meta.url)),
      "@behayand/chat": fileURLToPath(
        new URL("../app/index.ts", import.meta.url),
      ),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: false,
  },
});
