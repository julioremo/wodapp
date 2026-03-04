<script lang="ts">
import { CircleCheck, LoaderCircle, Trash2 } from "lucide-svelte";
import { zod4Client as zodClient } from "sveltekit-superforms/adapters";
import { superForm } from "sveltekit-superforms/client";

import * as Form from "$lib/components/ui/form";
import { Input } from "$lib/components/ui/input";
import * as Select from "$lib/components/ui/select";
import { workoutSchema } from "$lib/schemas/workout";

let {
  workout,
  formData, // Pass data.form from the page
  uniqueClassTypes = [],
  onSaved,
  onDeleted
} = $props<{
  workout: any;
  formData: any;
  uniqueClassTypes?: string[];
  onSaved?: () => void;
  onDeleted?: () => void;
}>();

let syncState = $state<"idle" | "saving" | "saved" | "error">("idle");
let debounceTimer: ReturnType<typeof setTimeout>;
let deleteConfirming = $state(false);

const formObj = superForm(formData, {
  validators: zodClient(workoutSchema),
  id: "workout-editor-form",
  resetForm: false, // Keep data on screen after save
  onUpdated({ form: f }) {
    if (f.valid) {
      syncState = "saved";
      if (onSaved) onSaved();
      setTimeout(() => {
        if (syncState === "saved") syncState = "idle";
      }, 2000);
    } else {
      syncState = "error";
    }
  }
});

const { form, errors, enhance, submit } = formObj;

// Hydrate the form whenever the user clicks a different WOD card
$effect(() => {
  if (workout) {
    $form.id = workout.id || null;
    $form.slug = workout.slug || "";
    $form.description = workout.description || "";
    $form.duration = workout.duration || 15;
    $form.workout_type = workout.workout_type || "WOD";
    $form.class_type = workout.class_type || "";
  }
});

function triggerSave(immediate = false) {
  syncState = "saving";
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(
    () => {
      submit();
    },
    immediate ? 0 : 2000
  );
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
  triggerSave(true);
}
</script>

<div
  class="flex flex-col h-full bg-stone-100 font-mono shadow-inner border-l-2 border-border overflow-y-auto">
  <form method="POST" action="?/saveWorkout" use:enhance class="flex flex-col p-6 gap-6 h-full">
    <input type="hidden" name="id" bind:value={$form.id} />
    <input type="hidden" name="description" bind:value={$form.description} />

    <div
      class="flex justify-between items-start pb-4 border-b-2 border-primary border-dashed w-full gap-4">
      <Form.Field form={formObj} name="slug" class="flex-1 min-w-0">
        <Form.Control>
          {#snippet children({ props })}
            <Input
              {...props}
              bind:value={$form.slug}
              oninput={() => triggerSave(false)}
              placeholder="workout-slug"
              class="font-bold lowercase text-xl text-foreground bg-transparent border-none p-0 focus-visible:ring-0 shadow-none" />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors class="text-[10px]" />
      </Form.Field>

      <div
        class="text-[10px] text-muted-foreground/60 flex items-center leading-none gap-2 min-w-4 justify-end mt-2 shrink-0">
        {#if syncState === 'saving'}
          <LoaderCircle class="size-4 animate-spin" />
        {:else if syncState === 'saved'}
          <CircleCheck class="size-4 text-green-500/70" />
        {:else if syncState === 'error'}
          <span class="text-destructive text-nowrap">Error</span>
        {:else if syncState === 'idle' && $form.id}
          {#if deleteConfirming}
            <button
              type="submit"
              formaction="?/deleteWorkout"
              onmouseleave={() => deleteConfirming = false}
              onclick={() => { if (onDeleted) onDeleted(); }}
              class="font-mono font-bold text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors">
              Confirm?
            </button>
          {:else}
            <button
              type="button"
              onclick={(e) => { e.preventDefault(); deleteConfirming = true; }}
              class="p-1 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
              <Trash2 class="size-4" />
            </button>
          {/if}
        {/if}
      </div>
    </div>

    <div
      class="flex flex-wrap items-start gap-4 text-[10px] uppercase font-semibold tracking-wider">
      <Form.Field
        form={formObj}
        name="class_type"
        class="flex flex-col gap-1.5 flex-1 min-w-[120px]">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label class="text-[10px] text-muted-foreground">Class Type</Form.Label>
            <Select.Root
              type="single"
              name={props.name}
              bind:value={$form.class_type}
              onValueChange={() => triggerSave(true)}>
              <Select.Trigger
                {...props}
                class="bg-background border-2 border-border rounded-none px-2 py-1.5 h-8 font-mono focus:ring-primary focus:border-primary">
                {$form.class_type || "Global"}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">Global / Unassigned</Select.Item>
                {#each uniqueClassTypes as type}
                  <Select.Item value={type}>{type}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/snippet}
        </Form.Control>
      </Form.Field>

      <Form.Field
        form={formObj}
        name="workout_type"
        class="flex flex-col gap-1.5 flex-1 min-w-[120px]">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label class="text-[10px] text-muted-foreground">Block Type</Form.Label>
            <Select.Root
              type="single"
              name={props.name}
              bind:value={$form.workout_type}
              onValueChange={() => triggerSave(true)}>
              <Select.Trigger
                {...props}
                class="bg-background border-2 border-border rounded-none px-2 py-1.5 h-8 font-mono focus:ring-primary focus:border-primary">
                {$form.workout_type}
              </Select.Trigger>
              <Select.Content>
                {#each ["Warmup", "Strength", "Skill", "WOD", "Cool Down"] as type}
                  <Select.Item value={type}>{type}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/snippet}
        </Form.Control>
      </Form.Field>

      <Form.Field form={formObj} name="duration" class="flex flex-col gap-1.5 w-24">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label class="text-[10px] text-muted-foreground">Duration</Form.Label>
            <div
              class="flex items-center bg-background border-2 border-border px-2 h-8 focus-within:border-primary">
              <input
                {...props}
                type="number"
                bind:value={$form.duration}
                oninput={() => triggerSave(false)}
                class="bg-transparent border-none p-0 w-full text-right text-[10px] focus:ring-0 hide-arrows" />
              <span class="ml-1 text-muted-foreground">min</span>
            </div>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors class="text-[10px]" />
      </Form.Field>
    </div>

    <div class="flex-1 mt-2 flex flex-col relative">
      <label class="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-2"
        >Description</label
      >
      <div
        contenteditable="true"
        role="textbox"
        tabindex="0"
        aria-multiline="true"
        bind:innerText={$form.description}
        oninput={() => triggerSave(false)}
        onpaste={handlePaste}
        data-placeholder="Start typing workout description..."
        class="flex-1 w-full text-sm font-mono leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 {$errors.description ? 'text-destructive' : ''}"></div>
      {#if $errors.description}
        <span class="absolute -bottom-6 left-0 text-[10px] font-sans text-destructive"
          >{$errors.description}</span
        >
      {/if}
    </div>
  </form>
</div>

<style>
.hide-arrows::-webkit-outer-spin-button,
.hide-arrows::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hide-arrows {
  -moz-appearance: textfield;
}
[contenteditable="true"]:empty:before {
  pointer-events: none;
  display: block;
}
</style>
