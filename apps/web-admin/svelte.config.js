import path from "node:path";
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    alias: {
      "@wodapp": path.resolve("../../")
      // "@wodapp/types": path.resolve("../../packages/types/src/index.ts"),
      // "@wodapp/core": path.resolve("../../packages/core/src/index.ts"),
      // "@wodapp/supabase-client": path.resolve("../../packages/supabase-client/src/index.ts")
    }
  }
};

export default config;
