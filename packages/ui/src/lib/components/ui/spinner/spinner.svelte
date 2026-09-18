<script lang="ts">
import { LoaderCircle } from "@lucide/svelte";
import { cn } from "@ui-utils";
import type { SVGAttributes } from "svelte/elements";

let {
  class: className,
  role = "status",
  // we add color and stroke for compatibility with different icon libraries props
  color,
  stroke,
  "aria-label": ariaLabel = "Loading",
  ...restProps
}: SVGAttributes<SVGSVGElement> = $props();
</script>

<LoaderCircle
  {role}
  color={color === null ? undefined : color}
  stroke={stroke === null ? undefined : stroke}
  aria-label={ariaLabel}
  class={cn("size-4 animate-spin", className)}
  {...restProps} />
