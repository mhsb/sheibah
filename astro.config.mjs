// @ts-check
import { defineConfig } from "astro/config";

// Minimal bilingual i18n: EN at "/", FA at "/fa/...". Fully static output.
export default defineConfig({
  site: "https://sheibah.ir",
  output: "static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fa"],
    routing: { prefixDefaultLocale: false },
  },
});
