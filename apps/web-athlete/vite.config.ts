import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      strategies: "injectManifest",
      manifest: {
        name: "WodApp pwa-inject",
        short_name: "Wodapp pwa-inject",
        start_url: "/",
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
        type: "module"
      },
      kit: {
        includeVersionFile: true
      }
    })
  ]
});
