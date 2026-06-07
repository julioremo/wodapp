<script lang="ts">
import "../app.css";
import { Toaster } from "@ui/sonner/index.js";
import favicon from "$lib/assets/favicon.svg";

let { children } = $props();
</script>

<svelte:head> <link rel="icon" href={favicon} /> </svelte:head>

<Toaster position="top-center" />

{@render children()}
