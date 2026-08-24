<script lang="ts">
import { ChevronLeft, X } from "@lucide/svelte";
import { Button } from "@ui/button";

let {
  backUrl = "/..",
}: {
  backUrl?: string;
} = $props();
</script>

<Button
  variant="ghost"
  size="icon"
  href={backUrl}
  class="mt-0.5 shrink-0"
  aria-label="Back">
  <ChevronLeft class="size-5" />
</Button>
