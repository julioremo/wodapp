<script lang="ts">
import { Check } from "@lucide/svelte";
import { cn } from "@ui-utils";
import { RadioGroup as RadioGroupPrimitive } from "bits-ui";

let {
  ref = $bindable(null),
  class: className,
  value,
  label,
  children,
  ...restProps
}: RadioGroupPrimitive.ItemProps & { label?: string } = $props();
</script>

<RadioGroupPrimitive.Item
  bind:ref
  {value}
  class={cn(
    // Add "group" so we can target child elements based on the parent's state
    "group flex w-full cursor-pointer items-center justify-between border-b border-border p-4 text-sm font-medium transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none last:border-0",
    className,
  )}
  {...restProps}>
  <span class="flex-1 text-left">
    {#if label}
      {label}
    {:else if children}
      {@render children()}
    {/if}
  </span>
  <Check
    class="h-5 w-5 text-primary invisible group-data-[state=checked]:visible" />
</RadioGroupPrimitive.Item>
