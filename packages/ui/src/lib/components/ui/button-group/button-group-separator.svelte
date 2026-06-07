<script lang="ts">
import { Separator } from "@ui/separator/index.js";
import { cn } from "@ui-utils";
import type { ComponentProps } from "svelte";

let {
  ref = $bindable(null),
  class: className,
  orientation = "vertical",
  ...restProps
}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="button-group-separator"
  {orientation}
  class={cn("bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto", className)}
  {...restProps} />
