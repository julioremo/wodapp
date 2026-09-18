<script lang="ts">
import type { Snippet } from "svelte";

let {
  userHasScrolled,
  offset = 16,
  topHeight = $bindable(0),
  totalHeight = $bindable(0),
  collapsible,
  sticky,
}: {
  userHasScrolled: boolean;
  offset?: number;
  topHeight?: number;
  totalHeight?: number;
  collapsible: Snippet;
  sticky: Snippet;
} = $props();

let targetTop = $derived(
  userHasScrolled ? -Math.max(0, topHeight - offset) : 0,
);
</script>

<div class="sticky top-0 z-50 w-full bg-background h-[env(safe-area-inset-top)]"></div>

<header
  bind:clientHeight={totalHeight}
  class="sticky z-40 flex flex-col bg-background transition-[top] duration-300 ease-in-out border-b shadow-md"
  style="top: {targetTop}px;">
  <div bind:clientHeight={topHeight}>
    {@render collapsible()}
  </div>

  <div class="space-y-1">
    {@render sticky()}
  </div>
</header>
