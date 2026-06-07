<script lang="ts">
import { TriangleAlert as AlertTriangle, Info, Plus, Trash2 } from "@lucide/svelte";
import * as AlertDialog from "@ui/alert-dialog";
import { Button } from "@ui/button";
import * as Card from "@ui/card";
import { Checkbox } from "@ui/checkbox";
import { Input } from "@ui/input";
import * as InputGroup from "@ui/input-group/index.js";
import { Label } from "@ui/label";
import * as Select from "@ui/select/index.js";
import { Switch } from "@ui/switch";
import { Toggle } from "@ui/toggle";
import * as Tooltip from "@ui/tooltip";
import { schedulePreferencesSchema } from "@wodapp/core";
import { toast } from "svelte-sonner";
import { superForm } from "sveltekit-superforms";
import { zod4Client as zodClient } from "sveltekit-superforms/adapters";
import { PALETTE } from "$lib/config/colors";

let { data } = $props();

const { form, errors, enhance, tainted, submitting } = superForm(data.form, {
  id: "schedule-form",
  validators: zodClient(schedulePreferencesSchema),
  dataType: "json",
  resetForm: false,
  onUpdated({ form }) {
    if (form.valid) toast.success("Schedule preferences updated");
    else toast.error("Failed to save schedule preferences");
  }
});

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" }
];

function toggleHiddenDay(dayValue: number) {
  const currentDays = $form.schedulePrefs.hiddenDays;
  if (currentDays.includes(dayValue)) {
    $form.schedulePrefs.hiddenDays = currentDays.filter((d) => d !== dayValue);
  } else {
    $form.schedulePrefs.hiddenDays = [...currentDays, dayValue];
  }
}
</script>

<div class="px-6 mb-6">
  <h3 class="text-lg font-medium">Schedule Preferences</h3>
  <p class="text-sm text-muted-foreground">
    Configure how your calendar displays to staff and members.
  </p>
</div>

<form method="POST" use:enhance>
  <Card.Root>
    <!-- <Card.Header>
      <Card.Title>Schedule Preferences</Card.Title>
      <Card.Description>
        Configure how your calendar displays to staff and members.
      </Card.Description>
    </Card.Header> -->
    <Card.Content>
      <div class="space-y-4">
        <Label class="text-sm font-medium leading-none block mb-3">Operating Hours</Label>
        <div class="flex items-center gap-4">
          <div class="space-y-1.5">
            <span class="text-xs text-muted-foreground uppercase tracking-wider">Start Hour</span>
            <div class="relative w-24">
              <Input
                type="number"
                bind:value={$form.schedulePrefs.startHour}
                min="0"
                max="23"
                class="h-8 pr-6 bg-background" />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none"
                >:00</span
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <span class="text-xs text-muted-foreground uppercase tracking-wider">End Hour</span>
            <div class="relative w-24">
              <Input
                type="number"
                bind:value={$form.schedulePrefs.endHour}
                min="1"
                max="24"
                class="h-8 pr-6 bg-background" />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none"
                >:00</span
              >
            </div>
          </div>
        </div>

        <div>
          <Label class="text-sm font-medium leading-none">Hidden Days</Label>
          <p class="text-sm text-muted-foreground mb-3">
            Select days that should never appear on the calendar (e.g., closed on Sundays).
          </p>
          <div class="flex flex-wrap gap-2">
            {#each DAYS_OF_WEEK as day}
              {@const isHidden = $form.schedulePrefs.hiddenDays.includes(day.value)}
              <Toggle
                size="sm"
                class="data-pressed:bg-destructive"
                pressed={$form.schedulePrefs.hiddenDays.includes(day.value)}
                onPressedChange={() => toggleHiddenDay(day.value)}>
                {day.label}
              </Toggle>
            {/each}
          </div>
        </div>
      </div>
    </Card.Content>
    <Card.Footer class="bg-muted/10 border-t px-6 py-4 flex justify-end">
      <Button type="submit" size="sm" disabled={!$tainted}>Save Schedule</Button>
    </Card.Footer>
  </Card.Root>
</form>
