<script lang="ts">
import "../app.css";
import { useRegisterSW } from "virtual:pwa-register/svelte";
import { Toaster } from "@ui/sonner";
import { ModeWatcher } from "mode-watcher";
import favicon from "$lib/assets/favicon.svg";

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (r) {
      r.update();
    }
  },
  onRegisterError(error) {
    console.error("Service worker registration failed:", error);
  },
});

let { data, children } = $props();
</script>

<Toaster position="top-center" />
<ModeWatcher defaultMode={data.theme} />
{@render children()}
