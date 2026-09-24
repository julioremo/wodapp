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
  class="shrink-0 self-center"
  aria-label="Back">
  <ChevronLeft class="size-5" />
</Button>
