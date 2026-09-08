import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { generateSW } from "./pwa.mjs";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      srcDir: "./src",
      mode: "development",
      strategies: generateSW ? "generateSW" : "injectManifest",
      filename: generateSW ? undefined : "prompt-sw.ts",
      scope: "/",
      base: "/",
      selfDestroying: process.env.SELF_DESTROYING_SW === "true",
      manifest: {
        name: "WodApp PWA",
        short_name: "Wodapp PWA",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      injectManifest: {
        globPatterns: [
          "client/**/*.{js,css,ico,png,svg,webp,html,woff,woff2}",
          "prerendered/**/*.{html,json}"
        ]
      },
      workbox: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,html,woff,woff2}"]
      },
      devOptions: {
        enabled: true,
        suppressWarnings: process.env.SUPPRESS_WARNING === "true",
        type: "module",
        navigateFallback: "/"
      },
      kit: {
        includeVersionFile: true
      }
    })
  ]
});
