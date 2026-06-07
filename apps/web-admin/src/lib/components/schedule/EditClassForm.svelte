<script lang="ts">
import { Plus, Trash } from "@lucide/svelte";
import { Button } from "@ui/button";
import { Combobox } from "@ui/combobox";
import * as Form from "@ui/form";
import { Input } from "@ui/input";
import * as InputGroup from "@ui/input-group";
import * as Select from "@ui/select";
import { toast } from "svelte-sonner";
import { type SuperValidated, superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import { type EditClass, editClassSchema } from "$lib/schemas/schedule";

let {
  data,
  updateActionUrl,
  deleteActionUrl,
  coaches = [],
  classTypes = [],
  programs = [],
  onCancel
} = $props<{
  data: SuperValidated<EditClass>;
  updateActionUrl: string;
  deleteActionUrl: string;
  coaches: { id: string; display_name: string }[];
  classTypes: string[];
  programs: { id: string; title: string }[];
  onCancel: () => void;
}>();

const form = superForm(data, {
  dataType: "json",
  resetForm: false,
  validators: zod4Client(editClassSchema),
  onResult: ({ result }) => {
    if (result.type === "success") {
      toast.success(result.data?.deleted ? "Class deleted" : "Class updated");
      onCancel(); // Close popover
    }
  }
});

const { form: formData, enhance, submitting } = form;

// Helpers for Selects (Connects ID <-> Label)
let selectedCoachLabel = $derived(
  coaches.find((c) => c.id === $formData.coach_id)?.display_name ?? "Unassigned"
);
let selectedTypeLabel = $derived($formData.class_type || "Select type");
let selectedprogramLabel = $derived(
  programs.find((w) => w.id === $formData.program_id)?.title ?? "Unassigned"
);

let programOptions = $derived.by(() => {
  const named = programs.filter((w) => w.title);
  named.sort((a, b) => a.title.localeCompare(b.title));

  const unnamed = programs.filter((w) => !w.title);
  unnamed.sort((a, b) => {
    // Primary: Type
    const typeA = a.program_type || "zz"; // push nulls to end
    const typeB = b.program_type || "zz";
    if (typeA !== typeB) return typeA.localeCompare(typeB);
    // Secondary: Date (Newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const sorted = [...named, ...unnamed];

  return sorted.map((w) => ({
    value: w.id,
    label: w.title || w.slug,
    type: w.class_type
  }));
});
</script>

<form method="POST" action={updateActionUrl} use:enhance>
  <input type="hidden" name="id" bind:value={$formData.id} />

  <div class="grid grid-cols-6 gap-3">
    <Form.Field {form} name="class_type" class="col-span-3">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">Class Type</Form.Label>
          <Select.Root type="single" bind:value={$formData.class_type} name={props.name}>
            <Select.Trigger {...props} class="w-full truncate">{selectedTypeLabel}</Select.Trigger>
            <Select.Content>
              {#each classTypes as type}
                <Select.Item value={type} label={type}>{type}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="capacity" class="col-span-3">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">Capacity</Form.Label>
          <Input {...props} type="number" bind:value={$formData.capacity} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="program_id" class="col-span-6">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">program</Form.Label>
          <div class="w-full flex gap-1">
            <Combobox
              {...props}
              bind:value={$formData.program_id}
              options={programOptions}
              placeholder="Select program..."
              searchPlaceholder="Search programs...">
              {#snippet itemSnippet({ option })}
                <div class="flex flex-col text-left truncate">
                  <span class="font-medium">{option.label}</span>
                  {#if option.type}
                    <span class="text-xs text-muted-foreground"> {option.type} </span>
                  {/if}
                </div>
              {/snippet}
            </Combobox>

            <Button
              variant="secondary"
              size="md"
              href={`/programs/new?date=${$formData.date}&type=${$formData.class_type}`}
              target="_blank"
              class="grow">
              <Plus class="h-4 w-4" />
              Add new
            </Button>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="coach_id" class="col-span-3">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">Coach</Form.Label>
          <Select.Root type="single" bind:value={$formData.coach_id} name={props.name}>
            <Select.Trigger {...props} class="w-full truncate">{selectedCoachLabel}</Select.Trigger>
            <Select.Content>
              <Select.Item value="unassigned" label="Unassigned">
                <span class="text-muted-foreground italic">Unassigned</span>
              </Select.Item>
              {#each coaches as coach}
                <Select.Item value={coach.id} label={coach.display_name}>
                  {coach.display_name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="date" class="col-span-3">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">Date</Form.Label>
          <Input {...props} type="date" bind:value={$formData.date} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="time" class="col-span-3">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">Start Time</Form.Label>
          <Input {...props} type="time" bind:value={$formData.time} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="duration" class="col-span-3">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label class="text-xs mb-1">Duration (min)</Form.Label>
          <Input {...props} type="number" bind:value={$formData.duration} min={10} step={5} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </div>

  <div class="flex justify-between gap-1 pt-4">
    <Button
      type="submit"
      variant="ghost"
      class="text-destructive hover:text-destructive hover:bg-destructive/10 h-auto"
      formaction={deleteActionUrl}
      formnovalidate
      onclick={(e) => {
        if (!confirm("Sure you want to delete this class?")) e.preventDefault();
      }}>
      <Trash class="h-3 w-3" />
      Delete Class
    </Button>

    <div class="flex gap-1">
      <Button type="button" variant="outline" onclick={onCancel} class="rounded-full w-[5em]"
        >Cancel</Button
      >
      <Button type="submit" disabled={$submitting} class="rounded-full w-[5em]">
        {$submitting ? "Saving..." : "Save"}
      </Button>
    </div>
  </div>
</form>
