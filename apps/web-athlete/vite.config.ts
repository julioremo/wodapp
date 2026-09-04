import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      manifest: {
        name: "WodApp",
        short_name: "Wodapp",
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
      workbox: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly"
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("__data.json"),
            handler: "NetworkOnly"
          },
          {
            urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
            handler: "NetworkOnly"
          }
        ]
      }
    })
  ]
});
