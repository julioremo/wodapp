<script lang="ts">
import "../app.css";
import { Toaster } from "@ui/sonner";
import { ModeWatcher } from "mode-watcher";
import favicon from "$lib/assets/favicon.svg";

let { data, children } = $props();
</script>

<Toaster position="top-center" />
<ModeWatcher defaultMode={data.theme} />
{@render children()}
