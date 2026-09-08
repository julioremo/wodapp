/// <reference lib="WebWorker" />
/// <reference types="vite/client" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { setCatchHandler, setDefaultHandler } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;
console.log("[Service Worker] I am loaded and running!");
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

setDefaultHandler(new NetworkOnly());

setCatchHandler(async ({ request }) => {
  console.log("[SW] 🔴 Network request failed for:", request.url);
  console.log("[SW] 🔴 Request destination:", request.destination);

  // Check if it's a full page load or a SvelteKit data fetch
  if (request.destination === "document" || request.url.includes("__data.json")) {
    console.log("[SW] 🟡 Attempting to serve offline.html fallback...");

    try {
      // Try with and without the leading slash to be safe
      const fallback =
        (await matchPrecache("/offline.html")) || (await matchPrecache("offline.html"));

      if (fallback) {
        console.log("[SW] 🟢 Offline fallback found in cache! Serving it.");
        return fallback;
      }

      console.error("[SW] ❌ offline.html NOT found in precache!");
      // If the HTML isn't cached, return a raw text response just so the app doesn't crash to the dinosaur screen
      return new Response("You are offline. (Fallback HTML not found in cache)", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      });
    } catch (e) {
      console.error("[SW] ❌ Error during matchPrecache:", e);
    }
  }

  return Response.error();
});
