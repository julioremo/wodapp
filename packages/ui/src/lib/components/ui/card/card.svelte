<script lang="ts">
import { cn, type WithElementRef } from "@ui-utils";
import type { HTMLAttributes } from "svelte/elements";

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="card"
  class={cn(
		"bg-card text-card-foreground flex flex-col gap-6 rounded-none border py-6 shadow-sm",
		className
	)}
  {...restProps}>
  {@render children?.()}
</div>
