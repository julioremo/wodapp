import path from "node:path";
import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { generateSW } from "./pwa.mjs";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    serviceWorker: {
      register: false
    },
    files: {
      serviceWorker: generateSW ? undefined : "src/prompt-sw.ts"
    },
    alias: {
      "@root": path.resolve("../../"),
      "@ui": "../../packages/ui/src/lib/components/ui",
      "@ui-utils": "../../packages/ui/src/lib/utils.ts",
      "@ui-hooks": "../../packages/ui/src/lib/hooks",
      "@ui-lib": "../../packages/ui/src/lib"
    }
  }
};

export default config;
