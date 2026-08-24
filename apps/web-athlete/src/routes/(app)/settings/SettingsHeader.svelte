<!-- src/lib/components/settings/SettingsHeader.svelte -->
<script lang="ts">
import { ChevronLeft, X } from "@lucide/svelte";
import { Button } from "@ui/button";

let {
  title,
  isEditing = false,
  submitting = false,
  formId = "",
  mode = "direct", // "toggle" (for data entry) or "direct" (for preferences)
  onCancel,
  onEdit,
}: {
  title: string;
  isEditing?: boolean;
  submitting?: boolean;
  formId?: string;
  mode?: "toggle" | "direct";
  onCancel?: () => void;
  onEdit?: () => void;
} = $props();
</script>

<div
  class="p-12 pr-3 flex items-baseline justify-between content-center relative">
  <div class="absolute left-3 -mt-0.5">
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
      <Button
        variant="ghost"
        size="icon"
        href="/settings"
        class="mt-0.5 shrink-0"
        aria-label="Back">
        <ChevronLeft class="size-5" />
      </Button>
    {/if}
  </div>

  <div>
    <h1 class="text-lg font-medium">{title}</h1>
  </div>

  {#if mode === "toggle"}
    {#if isEditing}
      <Button
        variant="ghost"
        class="text-lg p-3.5 w-17 h-17 -my-8"
        type="submit"
        form={formId}
        disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    {:else}
      <Button
        variant="ghost"
        class="text-lg p-3.5 w-17 h-17 -my-8"
        onclick={onEdit}>
        Edit
      </Button>
    {/if}
  {/if}
</div>
