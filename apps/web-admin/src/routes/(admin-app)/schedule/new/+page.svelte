<script lang="ts">
import { CircleAlert, Clock8Icon, Copy, Plus, RotateCcw, Trash2 } from "@lucide/svelte";
import { Button } from "@ui/button";
//   import ClassTypePicker from "./ClassTypePicker.svelte";
import * as Form from "@ui/form";
import { Input } from "@ui/input";
import * as Select from "@ui/select";
import { Spinner } from "@ui/spinner";
import { Switch } from "@ui/switch";
import * as ToggleGroup from "@ui/toggle-group";
import { cn } from "@ui-utils";
import { slide } from "svelte/transition";
import { toast } from "svelte-sonner";
import { type Infer, type SuperValidated, superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import { goto } from "$app/navigation";
import { defaultSession, type ScheduleForm, scheduleFormSchema } from "$lib/schemas/schedule.js";

let {
  data
}: {
  data: {
    form: SuperValidated<ScheduleForm>;
    coaches: { id: string; display_name: string }[];
    activeClassTypes: [];
  };
} = $props();

const form = superForm(data.form, {
  dataType: "json",
  validators: zod4Client(scheduleFormSchema),
  resetForm: false,
  taintedMessage: "You have unsaved changes. Are you sure you want to leave?",
  onUpdated: ({ form: f }) => {
    if (f.valid) {
      toast.success("Schedule saved successfully!");
    } else {
      toast.error("Please fix the errors in the schedule.");
    }
  }
});

const { form: formData, enhance, errors, tainted, submitting } = form;

const daysOfWeek = [
  { id: "1", label: "Monday" },
  { id: "2", label: "Tuesday" },
  { id: "3", label: "Wednesday" },
  { id: "4", label: "Thursday" },
  { id: "5", label: "Friday" },
  { id: "6", label: "Saturday" },
  { id: "0", label: "Sunday" }
];

function addSession() {
  const lastSession = $formData.sessions[$formData.sessions.length - 1];
  let newSession;

  if (lastSession && lastSession.time) {
    const [hours, minutes] = lastSession.time.split(":").map(Number);
    // Create a dummy date to handle the math (automatically handles 60+ mins)
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + (lastSession.duration || 60));
    // Format back to "HH:MM" (Force 2-digit format)
    const nextTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    newSession = {
      ...lastSession,
      time: nextTime
    };
  } else {
    // Fallback if it's the first session or previous time is missing
    newSession = { ...defaultSession };
  }

  // 2. Update the store
  $formData.sessions = [...$formData.sessions, newSession];
}

// TODO: UNDO option: change the row to a "Deleted" state for 3 seconds
function removeSession(i: number) {
  if ($formData.sessions.length > 1) {
    $formData.sessions = $formData.sessions.filter((_, idx) => idx !== i);
  }
}

// Helper to convert "HH:MM" -> minutes
function getMinutes(timeStr: string) {
  if (!timeStr) return -1;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
// --- OVERLAP DETECTION ---
// Reactive calculation: Re-runs whenever $formData.sessions changes
let overlappingIndices = $derived.by(() => {
  const overlaps = new Set<number>();
  const sessions = $formData.sessions;

  for (let i = 0; i < sessions.length; i++) {
    const s1 = sessions[i];
    const start1 = getMinutes(s1.time);
    if (start1 === -1) continue;

    const end1 = start1 + (s1.duration || 60);

    for (let j = i + 1; j < sessions.length; j++) {
      const s2 = sessions[j];
      const start2 = getMinutes(s2.time);
      if (start2 === -1) continue;

      const end2 = start2 + (s2.duration || 60);

      // 💥 THE FORMULA: StartA < EndB AND StartB < EndA
      if (start1 < end2 && start2 < end1) {
        overlaps.add(i);
        overlaps.add(j);
      }
    }
  }
  return overlaps;
});

function getSessionError(index: number, field: string) {
  // @ts-expect-error - Typescript sometimes struggles with dynamic nested keys in Superforms
  return $errors.sessions?.[index]?.[field];
}

function cloneSession(index: number) {
  const sessionToClone = $formData.sessions[index];

  // Calculate next time logic (reused from before)
  const [h, m] = sessionToClone.time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + (sessionToClone.duration || 60));
  const nextTime = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const newSession = {
    ...sessionToClone,
    time: nextTime
  };

  // Insert immediately after the clicked row
  const newSessions = [...$formData.sessions];
  newSessions.splice(index + 1, 0, newSession);
  $formData.sessions = newSessions;
}

function resetForm() {
  if (confirm("This will clear the present form. Are you sure?")) {
    $formData.sessions = [{ ...defaultSession }];
    $formData.start_date = new Date().toISOString().split("T")[0];
    $formData.is_recurring = false;
    $formData.weekdays = [];
    toast.info("Form cleared");
  }
}
</script>

<form method="POST" use:enhance class="space-y-8 max-w-4xl mx-auto">
  <h1 class="text-xl font-bold flex items-center gap-2">Schedule Planner</h1>
  <div class="gap-6">
    <h3 class="text-lg font-semibold flex items-center gap-2">
      Date and recurrence
      <span class="text-xs font-normal text-muted-foreground"
        >(Apply this day schedule to one or more days)</span
      >
    </h3>
    <div class="rounded bg-muted/50 p-4 flex flex-col gap-6">
      <div class="flex flex-row gap-12">
        <Form.Field {form} name="start_date">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{$formData.is_recurring ? "Initial date" : "Date"}</Form.Label>
              <Input type="date" {...props} bind:value={$formData.start_date} class="w-36" />
            {/snippet}
          </Form.Control>
        </Form.Field>

        <Form.Field {form} name="is_recurring">
          <Form.Control>
            {#snippet children({ props })}
              <div class="flex flex-col gap-4">
                <Form.Label>Repeat this schedule</Form.Label>
                <Switch {...props} bind:checked={$formData.is_recurring} />
              </div>
            {/snippet}
          </Form.Control>
        </Form.Field>
      </div>

      {#if $formData.is_recurring}
        <div class="flex flex-row gap-12 animate-in fade-in slide-in-from-top-2">
          <Form.Field {form} name="recurrence_end_date">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Repeat until</Form.Label>
                <Input
                  type="date"
                  {...props}
                  bind:value={$formData.recurrence_end_date}
                  required={$formData.is_recurring}
                  class="w-36" />
              {/snippet}
            </Form.Control>
          </Form.Field>

          <Form.Field {form} name="weekdays">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Repeat on</Form.Label>

                <ToggleGroup.Root
                  type="multiple"
                  variant="outline"
                  size="default"
                  spacing={3}
                  value={$formData.weekdays.map(String)}
                  onValueChange={(vals) => {
                    $formData.weekdays = vals.map(Number);
                  }}>
                  {#each daysOfWeek as day}
                    <ToggleGroup.Item
                      value={day.id}
                      aria-label={day.label}
                      class="rounded-full data-[state=on]:bg-blue-100">
                      {day.label.slice(0, 3)}
                    </ToggleGroup.Item>
                  {/each}
                </ToggleGroup.Root>

                <input
                  type="hidden"
                  name={props.name}
                  value={JSON.stringify($formData.weekdays)} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>
      {/if}
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold flex items-center gap-2">
      Day schedule
      <span class="text-xs font-normal text-muted-foreground">(Plan classes for a single day)</span>
    </h3>

    <div class="border rounded overflow-hidden bg-card">
      <div
        class="hidden md:grid grid-cols-10 gap-3 p-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div class="col-span-1">Time</div>
        <div class="col-span-3">Class Type</div>
        <div class="col-span-3">Coach</div>
        <div class="col-span-1">Capacity</div>
        <div class="col-span-1">Duration (min)</div>
        <div class="col-span-1"><!-- + button --></div>
      </div>

      <div class="border-t bg-card divide-y">
        {#each $formData.sessions as _, i}
          <div class="grid grid-cols-1 md:grid-cols-10 gap-3 p-3 items-start">
            <div class="col-span-1">
              <Form.Field {form} name={`sessions[${i}].time`}>
                <Form.Control>
                  {#snippet children({ props })}
                    <Input
                      {...props}
                      type="time"
                      bind:value={$formData.sessions[i].time}
                      class={cn(
                        // Error takes priority (Red)
                        getSessionError(i, "time")
                          ? "border-destructive focus-visible:ring-destructive"
                          : overlappingIndices.has(i)
                            ? "border-yellow-500 focus-visible:ring-yellow-500 bg-yellow-50/30"
                            : ""
                      )} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors class="text-[10px]" />
                {#if getSessionError(i, "time")}
                  <div class="text-[0.8rem] font-medium text-destructive">
                    {getSessionError(i, "time")}
                  </div>
                {:else if overlappingIndices.has(i)}
                  <div class="text-[0.8rem] font-medium text-yellow-600 flex items-center gap-1">
                    <CircleAlert class="h-4 w-4" />
                    Overlap
                  </div>
                {/if}
              </Form.Field>
            </div>

            <div class="col-span-3">
              <Form.Field {form} name={`sessions[${i}].class_type`}>
                <Form.Control>
                  {#snippet children({ props })}
                    <!-- TODO: ClassTypePicker (creatable combobox) -->
                    <Input {...props} bind:value={$formData.sessions[i].class_type} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <div class="col-span-3">
              <Form.Field {form} name={`sessions[${i}].coach_id`}>
                <Form.Control>
                  <!-- TODO: coach availability -->
                  <!-- TODO: Responsive Select -->
                  {#snippet children({ props })}
                    <Select.Root {...props} bind:value={$formData.sessions[i].coach_id}>
                      <Select.Trigger class="w-full">{data.coaches[0].display_name}</Select.Trigger>
                      <Select.Content>
                        {#each data.coaches as coach}
                          <Select.Item value={coach.id}> {coach.display_name} </Select.Item>
                        {/each}
                      </Select.Content>
                    </Select.Root>
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <div class="col-span-1">
              <Form.Field {form} name={`sessions[${i}].capacity`}>
                <Form.Control>
                  {#snippet children({ props })}
                    <Input
                      {...props}
                      type="number"
                      bind:value={$formData.sessions[i].capacity}
                      placeholder="Cap" />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <div class="col-span-1">
              <Form.Field {form} name={`sessions[${i}].duration`}>
                <Form.Control>
                  {#snippet children({ props })}
                    <Input
                      {...props}
                      type="number"
                      bind:value={$formData.sessions[i].duration}
                      placeholder="Min" />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <!-- <div class="col-span-1">
              {#if i === $formData.sessions.length - 1}
                <Button
                  size="icon"
                  variant="ghost"
                  class="rounded-full"
                  onclick={addSession}
                  type="button"
                >
                  <Plus class="h-4 w-4" />
                </Button>
              {:else}
                <Button size="icon" variant="ghost" onclick={() => removeSession(i)} type="button">
                  <Trash2 class="h-4 w-4" />
                </Button>
              {/if}
            </div> -->

            <div class="col-span-1 flex justify-end gap-1">
              <!-- class="col-span-1 flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-red-100" -->
              <Button
                size="icon"
                variant="ghost"
                class="rounded-full"
                onclick={() => cloneSession(i)}
                type="button"
                title="Clone this class">
                <Copy class="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onclick={() => removeSession(i)}
                disabled={$formData.sessions.length === 1}
                class="rounded-full hover:text-destructive">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
            <!-- end of row -->
          </div>
        {/each}
      </div>
    </div>
    <div class="flex justify-center">
      <!-- TODO: refine: perhaps button not needed? -->
      <Button
        variant="outline"
        size="sm"
        class="text-muted-foreground rounded-full"
        onclick={() => cloneSession($formData.sessions.length - 1)}>
        <Plus class="h-4 w-4 mr-2" />
        Add Class
      </Button>
    </div>
  </div>

  <div class="flex items-center justify-between pt-4 border-t">
    <Button
      type="button"
      variant="ghost"
      class="text-muted-foreground hover:text-destructive"
      onclick={resetForm}>
      <RotateCcw class="h-4 w-4 mr-2" />
      Clear Form
    </Button>

    <div class="flex items-center gap-4">
      <Button type="submit" size="lg" class="min-w-[150px]">Save Schedule</Button>
    </div>
  </div>
</form>
