<script lang="ts">
import type { Snippet } from "svelte";

let {
  title,
  left,
  right,
}: {
  title: string;
  left?: Snippet;
  right?: Snippet;
} = $props();
</script>

<div
  class="p-12 pr-3 flex items-baseline justify-between content-center relative">
  <div class="absolute left-3 -mt-0.5">
    {#if left}
      {@render left()}
    {/if}
  </div>

  <!-- Title -->
  <div>
    <h1 class="text-lg font-medium">{title}</h1>
  </div>

  {#if right}
    <div>
      {@render right()}
    </div>
  {/if}
</div>
