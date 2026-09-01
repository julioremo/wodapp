<script lang="ts">
import { X } from "@lucide/svelte";
import { Button } from "@ui/button";
import BackButton from "../BackButton.svelte";

let {
  isEditing,
  backUrl = "/settings",
  onCancel,
}: {
  isEditing: boolean;
  backUrl?: string;
  onCancel: () => void;
} = $props();
</script>

{#if isEditing}
  <Button
    variant="ghost"
    size="icon"
    onclick={onCancel}
    class="mt-0.5 shrink-0"
    aria-label="Cancel">
    <X class="size-5" />
  </Button>
{:else}
  <BackButton {backUrl} />
{/if}
