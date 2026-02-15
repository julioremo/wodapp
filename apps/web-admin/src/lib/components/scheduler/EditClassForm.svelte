<script lang="ts">
  import * as Form from "$lib/components/ui/form";
  import * as Select from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import { editClassSchema, type EditClass } from "$lib/schemas/schedule";
  import { type SuperValidated, superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    data,
    updateActionUrl,
    deleteActionUrl,
    coaches = [],
    classTypes = [],
    workouts = [],
    onCancel
  } = $props<{
    data: SuperValidated<EditClass>;
    updateActionUrl: string;
    deleteActionUrl: string;
    coaches: { id: string; full_name: string }[];
    classTypes: string[];
    workouts: { id: string; title: string }[];
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
  let selectedCoachLabel = $derived(coaches.find((c) => c.id === $formData.coach_id)?.full_name ?? "Unassigned");
  let selectedTypeLabel = $derived($formData.class_type || "Select type");
  let selectedWorkoutLabel = $derived(workouts.find((w) => w.id === $formData.workout_id)?.title ?? "Unassigned");
</script>

<form method="POST" action={updateActionUrl} use:enhance class="grid gap-4">
  <input type="hidden" name="id" bind:value={$formData.id} />

  <div class="grid grid-cols-2 gap-4">
    <Form.Field {form} name="date">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Date</Form.Label>
          <Input {...props} type="date" bind:value={$formData.date} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="class_type">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Class Type</Form.Label>
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

    <Form.Field {form} name="time">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Start Time</Form.Label>
          <Input {...props} type="time" bind:value={$formData.time} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="duration">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Duration (min)</Form.Label>
          <Input {...props} type="number" bind:value={$formData.duration} min={10} step={5} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="coach_id">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Coach</Form.Label>
          <Select.Root type="single" bind:value={$formData.coach_id} name={props.name}>
            <Select.Trigger {...props} class="w-full">{selectedCoachLabel}</Select.Trigger>
            <Select.Content>
              <Select.Item value="unassigned" label="Unassigned">
                <span class="text-muted-foreground italic">Unassigned</span>
              </Select.Item>
              {#each coaches as coach}
                <Select.Item value={coach.id} label={coach.full_name}>
                  {coach.full_name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="workout_id">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>WOD</Form.Label>
          <Select.Root type="single" bind:value={$formData.workout_id} name={props.name}>
            <Select.Trigger {...props} class="w-full">{selectedWorkoutLabel}</Select.Trigger>
            <Select.Content>
              {#each workouts as wod}
                <Select.Item value={wod.id} label={wod.title}>{wod.title}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
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
      }}
    >
      Delete Class
    </Button>

    <div class="flex gap-1">
      <Button type="button" variant="outline" onclick={onCancel} class="rounded-full w-[5em]">Cancel</Button>
      <Button type="submit" disabled={$submitting} class="rounded-full w-[5em]">
        {$submitting ? "Saving..." : "Save"}
      </Button>
    </div>
  </div>
</form>
