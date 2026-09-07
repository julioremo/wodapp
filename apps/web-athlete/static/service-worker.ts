/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[];
};

// --- Lifecycle ---------------------------------------------------------
// Take over immediately instead of waiting for all tabs to close.
self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());

// --- App shell precache -------------------------------------------------
// self.__WB_MANIFEST is injected at build time by @vite-pwa/sveltekit
// based on the `injectManifest.globPatterns` in vite.config.ts.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches(); // drops stale precache entries from previous deploys

// --- Offline fallback page ----------------------------------------------
// Put a plain static file at static/offline.html — NOT a SvelteKit route,
// so it doesn't depend on page.server.ts / SSR to render.
const OFFLINE_URL = "/offline.html";

// --- Navigation requests --------------------------------------------------
// SvelteKit pages are SSR'd (page.server.ts), so there's nothing sane to
// cache-and-replay here — a cached HTML shell would be stale data, not a
// faster load. Go to network; only fall back to the offline page on failure.
registerRoute(({ request }) => request.mode === "navigate", new NetworkOnly());

// --- SvelteKit's client-side data requests (__data.json) ------------------
// These carry the same server load() output as navigation and are just as
// dynamic/personalized — never serve them from cache.
registerRoute(({ url }) => url.pathname.includes("__data.json"), new NetworkOnly());

// --- Supabase reads vs writes ---------------------------------------------
// Only cache GET requests (PostgREST reads: schedule, benchmarks, settings).
// Any mutation (POST/PATCH/DELETE, RPC calls) must always hit the network —
// never let a write silently resolve from cache.
registerRoute(
  ({ url, request }) => url.hostname.includes("supabase.co") && request.method === "GET",
  new NetworkFirst({
    cacheName: "supabase-reads",
    networkTimeoutSeconds: 4, // fall back to cache fast on a bad connection
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 }) // 1 day
    ]
  })
);

registerRoute(
  ({ url, request }) => url.hostname.includes("supabase.co") && request.method !== "GET",
  new NetworkOnly()
);

// --- Static assets not already in the precache manifest --------------------
// e.g. icons/fonts added after a deploy without a full rebuild, or 3rd-party
// font hosts. Safe to cache-first since they're content-hashed or rarely change.
registerRoute(
  ({ request }) => request.destination === "font" || request.destination === "image",
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }) // 30 days
    ]
  })
);

// --- Catch-all: serve the offline page when navigation truly fails --------
setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    return caches.match(OFFLINE_URL) as Promise<Response>;
  }
  return Response.error();
});
