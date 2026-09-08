<script lang="ts">
import "../app.css";
import { pwaInfo } from "virtual:pwa-info";
import { Toaster } from "@ui/sonner";
import { ModeWatcher } from "mode-watcher";
import { onMount } from "svelte";
import favicon from "$lib/assets/favicon.svg";

const webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : "";

let { data, children } = $props();

onMount(async () => {
  if (pwaInfo) {
    console.log('[App] PWA Info found, attempting registration...');
    const { registerSW } = await import("virtual:pwa-register");
    
    registerSW({ 
      immediate: true,
      onRegisteredSW(swScriptUrl, registration) {
        console.log('[App] SW successfully registered!', swScriptUrl);
      },
      onRegisterError(error) {
        console.error('[App] SW registration failed!', error);
      }
    });
 }
});
</script>

<svelte:head>{@html webManifest}</svelte:head>

<Toaster position="top-center" />
<ModeWatcher defaultMode={data.theme} />
{@render children()}
