<script lang="ts">
import "../app.css";
import { Toaster } from "@ui/sonner";
import favicon from "$lib/assets/favicon.svg";

let { children } = $props();
</script>

<div class="dark min-h-screen bg-background text-foreground">
  <Toaster position="top-center" />

  {@render children()}
</div>
