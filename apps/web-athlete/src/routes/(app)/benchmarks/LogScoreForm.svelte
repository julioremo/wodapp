<script lang="ts">
import { enhance } from "$app/forms";
import type { SubmitFunction } from "@sveltejs/kit";

// Import Shadcn components
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { Textarea } from "@ui/textarea";
import { Button } from "@ui/button";

interface Props {
  movementId: string;
  movementName?: string;
  onSuccess?: () => void;
}

let { movementId, movementName, onSuccess }: Props = $props();
let isSubmitting = $state(false);

// Pre-format today's date for the native HTML date input
const today = new Date().toISOString().split("T")[0];

const submitHandler: SubmitFunction = ({ cancel }) => {
  isSubmitting = true;

  return async ({ result, update }) => {
    isSubmitting = false;

    if (result.type === "success") {
      onSuccess?.();
    }

    await update();
  };
};
</script>

<form
  method="POST"
  action="/benchmarks?/logScore"
  use:enhance={submitHandler}
  class="flex flex-col gap-5"
  novalidate>
  <input type="hidden" name="movement_id" value={movementId} />

  {#if movementName}
    <h3 class="text-lg font-semibold tracking-tight mb-1">
      Log {movementName}
    </h3>
  {/if}

  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <Label for="score">Score</Label>
      <Input
        type="number"
        id="score"
        name="score"
        step="0.1"
        min="0"
        required />
    </div>

    <div class="flex flex-col gap-2">
      <Label for="reps">Reps</Label>
      <Input type="number" id="reps" name="reps" min="1" value="1" required />
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <Label for="date">Date</Label>
    <Input type="date" id="date" name="date" value={today} required />
  </div>

  <div class="flex flex-col gap-2">
    <Label for="notes">Notes</Label>
    <Textarea
      id="notes"
      name="notes"
      rows={3}
      placeholder="How did it feel?"
      class="resize-none" />
  </div>

  <Button type="submit" disabled={isSubmitting} class="w-full mt-2">
    {isSubmitting ? "Logging..." : "Log Score"}
  </Button>
</form>
