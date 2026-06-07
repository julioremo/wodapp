import path from "node:path";
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      "@root": path.resolve("../../"),
      "@ui": "../../packages/ui/src/lib/components/ui",
      "@ui-utils": "../../packages/ui/src/lib/utils.ts"
    }
  }
};

export default config;
