<script lang="ts">
import "../app.css";
import { Toaster } from "@ui/sonner";
import type { UserPreferences } from "@wodapp/core";
import type { Snippet } from "svelte";
import { setContext, untrack } from "svelte";
import favicon from "$lib/assets/favicon.svg";
import type { LayoutData } from "./$types";

let { data, children }: { data: LayoutData; children: Snippet } = $props();

let theme = $state(data.theme);

// two separated effects, one tracks theme (sync effect, server to client)
// and the other data.theme (DOM effect, client to DOM)
$effect(() => {
  theme = data.theme;
});

$effect(() => {
  const htmlNode = document.documentElement;

  if (theme === "dark") {
    htmlNode.classList.add("dark");
  } else if (theme === "light") {
    htmlNode.classList.remove("dark");
  } else if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    htmlNode.classList.toggle("dark", mediaQuery.matches);
    // Attach the listener for real-time OS toggles
    const handleChange = (e: MediaQueryListEvent) => {
      htmlNode.classList.toggle("dark", e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    // Removes listener if user switches away from "system"
    return () => mediaQuery.removeEventListener("change", handleChange);
  }
});

setContext("theme", {
  get current() {
    return theme;
  },
  set: (val: UserPreferences["appearance"]["theme"]) => {
    theme = val;
  },
});
</script>

<div class="dark min-h-screen bg-background text-foreground">
  <Toaster position="top-center" />

  {@render children()}
</div>
