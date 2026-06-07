<script lang="ts">
import { buttonVariants } from "@ui/button/index.js";
import { cn } from "@ui-utils";
import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

let {
  ref = $bindable(null),
  class: className,
  ...restProps
}: AlertDialogPrimitive.ActionProps = $props();
</script>

<AlertDialogPrimitive.Action
  bind:ref
  data-slot="alert-dialog-action"
  class={cn(buttonVariants(), className)}
  {...restProps} />
