<script lang="ts">
import { TriangleAlert as AlertTriangle, Info, Plus, Trash2 } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { superForm } from "sveltekit-superforms";
import { zod4Client as zodClient } from "sveltekit-superforms/adapters";
import * as AlertDialog from "$lib/components/ui/alert-dialog";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Checkbox } from "$lib/components/ui/checkbox";
import { Input } from "$lib/components/ui/input";
import * as InputGroup from "$lib/components/ui/input-group/index.js";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select/index.js";
import SwatchPicker from "$lib/components/ui/swatch-picker/SwatchPicker.svelte";
import * as Tooltip from "$lib/components/ui/tooltip";
import { PALETTE } from "$lib/config/colors";
import { gymSettingsBaseSchema } from "$lib/schemas/settings";

let { data } = $props();

const { form, errors, enhance } = superForm(data.form, {
  id: "gym-settings-form",
  validators: zodClient(gymSettingsBaseSchema),
  dataType: "json",
  resetForm: false,
  onUpdated({ form }) {
    if (form.valid) toast.success("Gym settings updated");
    else toast.error("Failed to save settings");
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
  const index = $form.hiddenDays.indexOf(dayValue);
  if (index === -1) $form.hiddenDays.push(dayValue);
  else $form.hiddenDays.splice(index, 1);
}

function addClassType() {
  $form.classTypes.push({
    name: "New Class Type",
    color: "#d2d4c8",
    isProgrammable: true,
    isActive: true,
    defaultCoachId: null,
    defaultDuration: 60,
    defaultCapacity: 15
  });
}

// Modal State
let archiveModalOpen = $state(false);
let classToArchiveIndex = $state<number | null>(null);

function requestArchive(index: number) {
  classToArchiveIndex = index;
  archiveModalOpen = true;
}

function confirmArchive() {
  if (classToArchiveIndex !== null) {
    $form.classTypes[classToArchiveIndex].isActive = false;
  }
  archiveModalOpen = false;
  classToArchiveIndex = null;
}
</script>

<div class="max-w-5xl mx-auto p-6 space-y-8">
  {#if Object.keys($errors).length > 0}
    <pre class="bg-destructive/10 text-destructive p-4 rounded text-xs overflow-auto">
      {JSON.stringify($errors, null, 2)}
    </pre>
  {/if}
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Gym Settings</h1>
    <p class="text-muted-foreground mt-2">Manage your schedule configuration and class types.</p>
  </div>

  <form method="POST" use:enhance>
    <div class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Schedule Preferences</Card.Title>
          <Card.Description
            >Configure how your calendar displays to staff and members.</Card.Description
          >
        </Card.Header>
        <Card.Content>
          <div class="space-y-4">
            <Label class="text-sm font-medium leading-none block mb-3">Operating Hours</Label>
            <div class="flex items-center gap-4">
              <div class="space-y-1.5">
                <span class="text-xs text-muted-foreground uppercase tracking-wider"
                  >Start Hour</span
                >
                <div class="relative w-24">
                  <Input
                    type="number"
                    bind:value={$form.startHour}
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
                    bind:value={$form.endHour}
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
                  {@const isHidden = $form.hiddenDays.includes(day.value)}
                  <Button
                    type="button"
                    variant={isHidden ? "default" : "outline"}
                    onclick={() => toggleHiddenDay(day.value)}>
                    {day.label}
                  </Button>
                {/each}
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <Card.Title>Class Types</Card.Title>
            <Card.Description
              >Define the tracks, defaults, and colors for your schedule.</Card.Description
            >
          </div>
          <Button type="button" size="sm" onclick={addClassType}>
            <Plus class="w-4 h-4 mr-2" />
            Add Class Type
          </Button>
        </Card.Header>

        <Card.Content class="space-y-2">
          <div class="flex items-center gap-3 px-3">
            <Label class="ml-10 w-48 text-xs uppercase tracking-wider text-muted-foreground">
              Class Name
            </Label>
            <Label
              class="w-24 text-xs uppercase tracking-wider text-muted-foreground text-center text-end">
              Duration
            </Label>
            <Label class="w-20 text-xs uppercase tracking-wider text-muted-foreground text-center ">
              Capacity
            </Label>
            <Label class="w-40 text-xs uppercase tracking-wider text-muted-foreground">
              Default Coach
            </Label>
          </div>
          {#each $form.classTypes as ct, i}
            {#if ct.isActive}
              <div
                class="flex flex-col gap-3 p-3 border rounded-md transition-colors"
                style="background-color: {ct.color}1A; border-color: {ct.color}40;">
                <div class="flex items-center gap-3">
                  <SwatchPicker bind:value={ct.color} colors={PALETTE} columns={5} />

                  <Input
                    type="text"
                    bind:value={ct.name}
                    class="w-48 bg-background h-8 text-sm font-semibold {$errors.classTypes?.[i]?.name ? 'border-destructive' : ''}"
                    placeholder="Class Type Name" />

                  <InputGroup.Root class="w-24 h-8 bg-background">
                    <InputGroup.Input
                      type="number"
                      bind:value={ct.defaultDuration}
                      title="Duration (min)"
                      placeholder="60"
                      class="text-right h-8 px-1" />
                    <InputGroup.Addon align="inline-end">
                      <InputGroup.Text>min</InputGroup.Text>
                    </InputGroup.Addon>
                  </InputGroup.Root>

                  <Input
                    type="number"
                    bind:value={ct.defaultCapacity}
                    class="w-20 h-8 bg-background text-sm text-end"
                    title="Capacity" />

                  <Select.Root
                    type="single"
                    name="defaultCoach"
                    value={ct.defaultCoachId ?? "none"}
                    onValueChange={(val) => ct.defaultCoachId = val === "none" ? null : val}>
                    <Select.Trigger class="h-8 w-40 text-sm bg-background">
                      {data.coaches.find(c => c.id === ct.defaultCoachId)?.full_name || "No default coach"}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Item value="none" label="No default coach" />
                        {#each data.coaches as coach}
                          <Select.Item value={coach.id} label={coach.full_name} />
                        {/each}
                      </Select.Group>
                    </Select.Content>
                  </Select.Root>

                  <div class="flex items-center gap-2 ml-auto mr-4">
                    <Checkbox
                      bind:checked={ct.isProgrammable}
                      id="prog-{i}"
                      aria-label="Toggle programming"
                      class="bg-background" />
                    <Label
                      for="prog-{i}"
                      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Programmable
                    </Label>
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger class="flex items-center gap-2">
                          <Info
                            class="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </Tooltip.Trigger>
                        <Tooltip.Content side="top" align="center">
                          <p class="max-w-[200px] text-xs">
                            If scheduled, this class type will appear in the Programming grid so you
                            can write WODs for it.
                          </p>
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onclick={() => requestArchive(i)}>
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            {/if}
          {/each}
        </Card.Content>
      </Card.Root>

      <div class="mt-8 flex justify-end"><Button type="submit">Save Settings</Button></div>
    </div>
  </form>
</div>

<AlertDialog.Root bind:open={archiveModalOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title class="flex items-center gap-2 text-destructive">
        <AlertTriangle class="w-5 h-5" />
        Archive Class Type
      </AlertDialog.Title>
      <AlertDialog.Description>
        This will remove the class from all scheduling and programming dropdowns. Past classes will
        remain on the calendar. You can restore this later.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => classToArchiveIndex = null}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onclick={confirmArchive}>
        Archive
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
