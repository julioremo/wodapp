<script lang="ts">
import { cn } from "@ui-utils";
import { format } from "date-fns";
import type { Snippet } from "svelte";
import { expoIn } from "svelte/easing";
import { fly } from "svelte/transition";

let {
  title,
  left,
  right,
  class: className = "",
}: {
  title: string | Date;
  left?: Snippet;
  right?: Snippet;
  class?: string;
} = $props();

let mounted = $state(false);

$effect(() => {
  mounted = true;
});

let displayTitle = $derived(
  title instanceof Date
    ? format(title, "MMMM yyyy")
    : typeof title === "string"
      ? title
      : String(title ?? ""),
);
</script>

<div
  class={cn(
    "bg-background/80 backdrop-blur-md py-10 pl-6.5 pr-3 flex items-baseline justify-between content-center relative",
    className,
  )}>
  <div class="absolute left-3 -mt-0.5">
    {#if left}
      {@render left()}
    {/if}
  </div>

  <div class="grid grid-cols-1 grid-rows-1 overflow-hidden">
    {#key displayTitle}
      <h1
        class="col-start-1 row-start-1 text-lg font-medium whitespace-nowrap"
        in:fly={{ y: "100%", duration: mounted ? 500 : 0, easing: expoIn }}
        out:fly={{ y: "-100%", duration: mounted ? 350 : 0, easing: expoIn }}>
        {displayTitle}
      </h1>
    {/key}
  </div>

  {#if right}
    <div>
      {@render right()}
    </div>
  {/if}
</div>
