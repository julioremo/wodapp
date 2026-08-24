<script lang="ts">
import { Button } from "@ui/button";

let {
  isEditing,
  submitting,
  formId,
  onEdit,
}: {
  isEditing: boolean;
  submitting: boolean;
  formId: string;
  onEdit: () => void;
} = $props();
</script>

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
