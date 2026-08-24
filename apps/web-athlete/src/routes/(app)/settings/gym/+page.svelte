<!-- src/routes/settings/gym/+page.svelte -->
<script lang="ts">
import { Button } from "@ui/button";
import { Label } from "@ui/label";
import { enhance } from "$app/forms";

export let data;
export let form; // Contains Zod errors or success messages from the action

let loading = false;
</script>

<div class="space-y-6">
  <div>
    <h3 class="text-lg font-medium">Active Gym</h3>
    <p class="text-sm text-muted-foreground">
      Select the gym you want to view schedules, bookings, and leaderboards for.
    </p>
  </div>

  <hr />

  <form
    method="POST"
    action="?/updateActiveGym"
    class="space-y-6 max-w-sm"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        loading = false;
        update();
      };
    }}>
    <div class="space-y-3">
      <Label for="last_location_id">Select Gym</Label>

      <select
        id="last_location_id"
        name="last_location_id"
        class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={data.currentLocationId}>
        {#each data.activeMemberships as membership}
          <option value={membership.location.id}>
            {membership.location.name}
          </option>
        {/each}
      </select>

      {#if form?.errors?.last_location_id}
        <p class="text-sm text-destructive">
          {form.errors.last_location_id[0]}
        </p>
      {/if}
    </div>

    <Button type="submit" disabled={loading}>
      {loading ? "Saving..." : "Save Preferences"}
    </Button>

    {#if form?.success}
      <p class="text-sm text-green-600 dark:text-green-400">
        Gym updated successfully!
      </p>
    {/if}
  </form>
</div>
