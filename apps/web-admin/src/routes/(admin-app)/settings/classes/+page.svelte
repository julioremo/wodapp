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
import SwatchPicker from "@ui/swatch-picker/SwatchPicker.svelte";
import { Switch } from "@ui/switch";
import * as Tooltip from "@ui/tooltip";
import { classTypesFormSchema } from "@wodapp/core";
import { toast } from "svelte-sonner";
import { superForm } from "sveltekit-superforms";
import { zod4Client as zodClient } from "sveltekit-superforms/adapters";
import { PALETTE } from "$lib/config/colors";

let { data } = $props();

const { form, errors, enhance, tainted, submitting } = superForm(data.form, {
  id: "class-types-form",
  validators: zodClient(classTypesFormSchema),
  dataType: "json",
  resetForm: false,
  onUpdated({ form }) {
    if (form.valid) toast.success("Class types updated");
    else toast.error("Failed to save class types");
  }
});

let archiveModalOpen = $state(false);
let classToArchiveIndex = $state<number | null>(null);

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

<div class="flex flex-row items-end justify-between space-y-0 px-6 mb-6">
  <div>
    <h3 class="text-lg font-medium">Booking Policies</h3>
    <p class="text-sm text-muted-foreground">
      Set the rules for when members can book and cancel classes.
    </p>
  </div>
  <Button type="button" size="sm" onclick={addClassType}>
    <Plus class="w-4 h-4 mr-2" />
    Add Class Type
  </Button>
</div>

<form method="POST" use:enhance>
  <Card.Root>
    <Card.Content class="space-y-4">
      <div
        class="hidden md:grid grid-cols-[auto_1fr_6rem_5rem_10rem_7rem_auto] gap-3 px-3 text-xs tracking-wider text-muted-foreground items-center">
        <div class="w-8"></div>
        <Label>Class Name</Label>
        <Label class="text-end">Duration</Label>
        <Label class="text-end">Capacity</Label>
        <Label>Default Coach</Label>
        <Label class="flex items-center justify-center gap-2">
          Programming
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger class="flex items-center gap-2">
                <Info
                  class="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Tooltip.Trigger>
              <Tooltip.Content side="top" align="center">
                <p class="max-w-[200px] text-xs">
                  Check this if you want to be able to write programs for this class type.
                </p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </Label>
        <div class="w-8"></div>
      </div>

      <div class="space-y-4">
        {#each $form.classTypes as ct, i}
          {#if ct.isActive}
            <div
              class="flex flex-col gap-4 md:grid md:grid-cols-[auto_1fr_6rem_5rem_10rem_7rem_auto] md:gap-3 p-4 md:p-3 border rounded-md transition-colors items-center"
              style="background-color: {$form.classTypes[i].color}1A; border-color: {$form.classTypes[i].color}40;">
              <div class="flex items-center gap-3 md:contents">
                <div class="w-8 flex justify-center shrink-0">
                  <SwatchPicker
                    bind:value={$form.classTypes[i].color}
                    colors={PALETTE}
                    columns={5} />
                </div>

                <Input
                  type="text"
                  bind:value={$form.classTypes[i].name}
                  class="flex-1 md:w-full bg-background h-8 text-sm font-semibold {$errors.classTypes?.[i]?.name ? 'border-destructive' : ''}"
                  placeholder="Class Type Name" />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="md:hidden h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onclick={() => requestArchive(i)}>
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>

              <div class="grid grid-cols-2 gap-4 md:contents">
                <div class="space-y-1.5 md:space-y-0 md:contents">
                  <Label
                    class="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden"
                    >Duration</Label
                  >
                  <InputGroup.Root class="h-8 bg-background">
                    <InputGroup.Input
                      type="number"
                      bind:value={$form.classTypes[i].defaultDuration}
                      placeholder="60"
                      class="text-right h-8 px-1" />
                    <InputGroup.Addon align="inline-end">
                      <InputGroup.Text>min</InputGroup.Text>
                    </InputGroup.Addon>
                  </InputGroup.Root>
                </div>

                <div class="space-y-1.5 md:space-y-0 md:contents">
                  <Label
                    class="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden"
                    >Capacity</Label
                  >
                  <Input
                    type="number"
                    bind:value={$form.classTypes[i].defaultCapacity}
                    class="h-8 bg-background text-sm text-end" />
                </div>
              </div>

              <div class="grid grid-cols-[1fr_auto] gap-4 items-end md:contents">
                <div class="space-y-1.5 md:space-y-0 md:contents">
                  <Label
                    class="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden"
                    >Default Coach</Label
                  >
                  <Select.Root
                    type="single"
                    name="defaultCoach"
                    value={$form.classTypes[i].defaultCoachId ?? "none"}
                    onValueChange={(val) => $form.classTypes[i].defaultCoachId = val === "none" ? null : val}>
                    <Select.Trigger class="h-8 w-full text-sm bg-background">
                      {data.coaches.find(c => c.id === $form.classTypes[i].defaultCoachId)?.display_name || "No default coach"}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Item value="none" label="No default coach" />
                        {#each data.coaches as coach}
                          <Select.Item
                            value={coach.id}
                            label={coach.display_name ?? "Unnamed Coach"} />
                        {/each}
                      </Select.Group>
                    </Select.Content>
                  </Select.Root>
                </div>

                <div class="flex items-center gap-3 md:contents">
                  <Label
                    class="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden"
                    >Programmable</Label
                  >
                  <div class="flex h-8 items-center md:justify-center w-full">
                    <Checkbox
                      bind:checked={$form.classTypes[i].isProgrammable}
                      id="prog-{i}"
                      aria-label="Toggle programming"
                      class="bg-background" />
                  </div>
                </div>
              </div>

              <div class="hidden md:flex w-8 justify-center shrink-0">
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
      </div>
    </Card.Content>

    <Card.Footer class="bg-muted/10 border-t px-6 py-4 flex justify-end">
      <Button type="submit" size="sm" disabled={!$tainted}>Save Class Types</Button>
    </Card.Footer>
  </Card.Root>
</form>

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
