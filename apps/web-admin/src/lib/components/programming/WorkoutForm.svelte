<script lang="ts">
  import * as Form from "$lib/components/ui/form";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Switch } from "$lib/components/ui/switch";
  import * as Select from "$lib/components/ui/select";
  import { toast } from "svelte-sonner";
  import { LoaderCircle as Loader2, WandSparkles as Wand2 } from "lucide-svelte";
  import { workoutSchema, type WorkoutSchema } from "$lib/schemas/workout";
  import { type SuperValidated, superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { page } from "$app/state";

  let {
    formObj, // The empty "shell" form object passed from parent
    uniqueClassTypes = [],
    date,
    class_type,
    workoutId,
    initialData,
    onSuccess
  } = $props<{
    formObj: SuperValidated<WorkoutSchema>;
    uniqueClassTypes: string[];
    date: string;
    class_type: string;
    workoutId?: string;
    initialData?: any;
    onSuccess?: () => void;
  }>();

  // 1. INITIALIZE FORM
  const form = superForm(formObj, {
    dataType: "json",
    validators: zod4Client(workoutSchema),
    invalidateAll: true, // Refresh the grid data on success
    resetForm: false, // Don't reset if we are editing

    // Handle the custom action URL
    applyAction: true,

    onResult: ({ result }) => {
      if (result.type === "success" || result.type === "redirect") {
        toast.success(workoutId ? "Workout updated!" : "Workout created!");
        onSuccess?.();
      } else if (result.type === "failure") {
        toast.error("Please fix the errors.");
      }
    }
  });

  const { form: formData, enhance, submitting } = form;

  // 2. SYNC PROPS TO FORM STATE
  // When the component mounts (or props change), update the form store
  $effect(() => {
    // Always lock these to the cell's context
    $formData.date = date;
    $formData.class_type = class_type;

    if (initialData) {
      // Edit Mode: Pre-fill content
      $formData.title = initialData.title || "";
      $formData.description = initialData.description || "";
      // Note: We assume apply_to_all is true for edits to keep it simple
      // unless we fetch specific links.
      $formData.apply_to_all = true;
    }
  });

  // --- LOCAL STATE FOR CLASS FETCHING ---
  let availableClasses = $state<any[]>([]);
  let isLoadingClasses = $state(false);

  async function fetchClassTimes() {
    if (!$formData.date || !$formData.class_type) return;
    isLoadingClasses = true;
    try {
      const response = await fetch(`/api/classes/times?date=${$formData.date}&type=${$formData.class_type}`);
      if (response.ok) availableClasses = await response.json();
    } finally {
      isLoadingClasses = false;
    }
  }

  // Trigger fetch immediately if we are in "New" mode to show available slots
  $effect(() => {
    if (!initialData && $formData.date && $formData.class_type) {
      fetchClassTimes();
    }
  });

  function insertTemplate() {
    const template =
      "## WARM UP\n3 Rounds of:\n- 10 Air Squats\n- 5 Pushups\n\n## STRENGTH\nBack Squat\n5-5-5-5-5 @ 75%\n\n## WOD\n'Title'\nAMRAP 12:\n- 10 Wallballs\n- 10 Box Jumps\n\n";
    $formData.description = ($formData.description || "") + template;
  }
</script>

<form method="POST" action="?/save" use:enhance class="flex flex-col gap-6 h-full">
  {#if workoutId}
    <input type="hidden" name="id" value={workoutId} />
  {/if}

  <div class="grid grid-cols-2 gap-4 p-3 border rounded-lg bg-muted/20 text-sm">
    <div>
      <span class="text-muted-foreground block text-xs uppercase tracking-wider">Date</span>
      <span class="font-medium">{date}</span>
      <input type="hidden" name="date" bind:value={$formData.date} />
    </div>
    <div>
      <span class="text-muted-foreground block text-xs uppercase tracking-wider">Type</span>
      <span class="font-medium">{class_type}</span>
      <input type="hidden" name="class_type" bind:value={$formData.class_type} />
    </div>
  </div>

  <div class="space-y-4 flex-1">
    <Form.Field {form} name="title">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Title <span class="text-muted-foreground font-normal">(Optional)</span></Form.Label>
          <Input {...props} bind:value={$formData.title} placeholder="e.g. Fran, Murph" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="description" class="flex flex-col gap-2">
      <Form.Control>
        {#snippet children({ props })}
          <div class="flex flex-row w-full justify-between items-center">
            <Form.Label>Description</Form.Label>
            <Button size="sm" variant="ghost" type="button" onclick={insertTemplate} class="h-6 text-xs">
              <Wand2 class="w-3 h-3 mr-1" />Template
            </Button>
          </div>
          <Textarea
            {...props}
            bind:value={$formData.description}
            class="font-mono text-sm min-h-[250px] leading-relaxed resize-none"
            placeholder="Paste workout here..."
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
  </div>

  {#if !initialData}
    <div class="border-t pt-4">
      <Form.Field {form} name="apply_to_all" class="flex flex-row items-center justify-between">
        <Form.Control>
          {#snippet children({ props })}
            <div class="space-y-0.5">
              <Form.Label>Apply to all classes?</Form.Label>
              <div class="text-[10px] text-muted-foreground">
                Assign to all {class_type} classes on {date}.
              </div>
            </div>
            <Switch {...props} bind:checked={$formData.apply_to_all} />
          {/snippet}
        </Form.Control>
      </Form.Field>

      {#if !$formData.apply_to_all}
        <div class="mt-3 pl-4 border-l-2 space-y-2">
          <Form.Field {form} name="selected_class_ids">
            <Form.Control>
              {#snippet children({ props })}
                {#if isLoadingClasses}
                  <div class="text-xs text-muted-foreground">Loading...</div>
                {:else if availableClasses.length === 0}
                  <div class="text-xs text-amber-600">No classes found.</div>
                {:else}
                  <div class="flex flex-wrap gap-2">
                    {#each availableClasses as cls}
                      {@const currentIds = $formData.selected_class_ids ?? []}
                      {@const isChecked = currentIds.includes(cls.id)}
                      <div
                        class="flex items-center gap-2 border px-2 py-1 rounded cursor-pointer hover:bg-muted bg-background"
                      >
                        <Checkbox
                          {...props}
                          checked={isChecked}
                          onCheckedChange={(v) => {
                            $formData.selected_class_ids = v
                              ? [...currentIds, cls.id]
                              : currentIds.filter((id) => id !== cls.id);
                          }}
                        />
                        <span class="text-xs font-mono">
                          {new Date(cls.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    {/each}
                  </div>
                  <input type="hidden" name="selected_class_ids" value={$formData.selected_class_ids} />
                {/if}
              {/snippet}
            </Form.Control>
          </Form.Field>
        </div>
      {/if}
    </div>
  {/if}

  <div class="pt-4 border-t mt-auto sticky bottom-0 bg-background/95 backdrop-blur z-10 pb-2">
    <Button type="submit" disabled={$submitting} class="w-full">
      {#if $submitting}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
      {:else}
        {workoutId ? "Update Workout" : "Create Workout"}
      {/if}
    </Button>
  </div>
</form>
