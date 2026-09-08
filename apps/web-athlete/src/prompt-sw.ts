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
  if (request.destination === "document" || request.url.includes("__data.json")) {
    console.log("Offline route caught");
    const fallback = await matchPrecache("/offline.html");
    return fallback || new Response("You are offline.", { status: 503 });
  }
  return Response.error();
});
