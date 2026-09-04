<script lang="ts">
import "../app.css";
import { pwaInfo } from "virtual:pwa-info";
import { useRegisterSW } from "virtual:pwa-register/svelte";
import { Toaster } from "@ui/sonner";
import { ModeWatcher } from "mode-watcher";
import favicon from "$lib/assets/favicon.svg";

const webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : "";

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (r) r.update();
  },
  onRegisterError(error) {
    console.error("Service worker registration failed:", error);
  },
});

let { data, children } = $props();
</script>

<svelte:head>{@html webManifest}</svelte:head>

<Toaster position="top-center" />
<ModeWatcher defaultMode={data.theme} />
{@render children()}
