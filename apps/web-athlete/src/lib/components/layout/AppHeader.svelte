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
    "bg-background py-10 pl-6.5 pr-3 flex flex-row items-baseline justify-between",
    className,
  )}>
  <div class="flex flex-row gap-3 items-baseline">
    {#if left}
      {@render left()}
    {/if}
    {#key displayTitle}
      <h1
        class="text-lg font-medium whitespace-nowrap"
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
