<script lang="ts">
import { Check } from "@lucide/svelte";
import { cn } from "@ui-utils";
import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
import type { Snippet } from "svelte";

let {
  ref = $bindable(null),
  class: className,
  value,
  label,
  ...restProps
}: RadioGroupPrimitive.ItemProps & { label?: string | Snippet } = $props();
</script>

<RadioGroupPrimitive.Item
  bind:ref
  {value}
  class={cn(
    "group flex w-full cursor-pointer items-center justify-between border-b border-border p-4 text-sm font-medium transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none last:border-0",
    className,
  )}
  {...restProps}>
  <span class="flex-1 text-left">
    {#if typeof label === "string"}
      {label}
    {:else if label}
      {@render label()}
    {/if}
  </span>
  <Check
    class="h-5 w-5 text-primary invisible group-data-[state=checked]:visible" />
</RadioGroupPrimitive.Item>
