<script lang="ts">
  import PageShell from "$lib/components/admin/PageShell.svelte";
  import * as Form from "$lib/components/ui/form";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Switch } from "$lib/components/ui/switch";
  import * as Select from "$lib/components/ui/select";
  import { toast } from "svelte-sonner";
  import { LoaderCircle as Loader2, WandSparkles as Wand2 } from "lucide-svelte";

  import { workoutSchema, type WorkoutSchema } from "$lib/schemas/workout.js";
  import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    data
  }: {
    data: {
      form: SuperValidated<WorkoutSchema>;
      uniqueClassTypes: string[];
    };
  } = $props();

  const form = superForm(data.form, {
    dataType: "json",
    validators: zod4Client(workoutSchema),
    resetForm: true,
    taintedMessage: "You have unsaved changes. Are you sure you want to leave?",
    onUpdated: ({ form: f }) => {
      if (f.valid) {
        toast.success("Workout saved successfully!");
      } else {
        toast.error("Please fix the errors in the form.");
      }
    }
  });

  const { form: formData, enhance, errors, tainted, submitting } = form;

  // --- LOCAL STATE FOR CLASS FETCHING ---
  let availableClasses = $state<any[]>([]);
  let isLoadingClasses = $state(false);

  // When Date or Type changes, fetch the specific times
  async function fetchClassTimes() {
    if (!$formData.date || !$formData.class_type) return;

    isLoadingClasses = true;

    // Use standard fetch instead of Supabase client
    const response = await fetch(`/api/classes/times?date=${$formData.date}&type=${$formData.class_type}`);

    if (response.ok) {
      availableClasses = await response.json();
    }

    isLoadingClasses = false;
  }

  function insertTemplate() {
    const templates = {
      template_1:
        "## WARM UP\n3 Rounds of:\n- 10 Air Squats\n- 5 Pushups\n\n" +
        "## STRENGTH\nBack Squat\n5-5-5-5-5 @ 75%\n\n" +
        "## WOD\n'Title'\nAMRAP 12:\n- 10 Wallballs\n- 10 Box Jumps\n\n"
    };
    $formData.description = ($formData.description || "") + templates["template_1"];
  }
</script>

<PageShell title="Plan Workout" subtitle="Create a new workout and assign it to the schedule.">
  <form method="POST" use:enhance class="h-full flex flex-col gap-6 max-w-4xl">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20">
      <Form.Field {form} name="date">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Date (Optional)</Form.Label>
            <Input type="date" {...props} bind:value={$formData.date} onchange={fetchClassTimes} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="class_type">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Program Type (Optional)</Form.Label>
            <Select.Root {...props} type="single" bind:value={$formData.class_type}>
              <Select.Trigger class="w-full">
                {$formData.class_type ? $formData.class_type : "Select a type..."}
              </Select.Trigger>
              <Select.Content>
                {#each data.uniqueClassTypes as classType}
                  <Select.Item value={classType}>{classType}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      {#if $formData.date && $formData.class_type}
        <div class="col-span-full border-t pt-4">
          <Form.Field {form} name="apply_to_all" class="flex flex-row items-center gap-6">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label class="flex flex-col items-start gap-1">
                  <span>Apply to all classes?</span>
                </Form.Label>
                <Switch {...props} bind:checked={$formData.apply_to_all} />
                <span class="font-normal text-muted-foreground text-xs">
                  (Automatically assigns this workout to all {$formData.class_type} classes on this date).
                </span>
              {/snippet}
            </Form.Control>

            <Form.FieldErrors />
          </Form.Field>

          {#if !$formData.apply_to_all}
            <div class="pl-4 border-l-2 space-y-2">
              <Form.Field {form} name="selected_class_ids">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Select specific times:</Form.Label>

                    {#if isLoadingClasses}
                      <div class="text-sm text-muted-foreground">
                        <Loader2 class="inline h-3 w-3 animate-spin" /> Loading times...
                      </div>
                    {:else if availableClasses.length === 0}
                      <div class="text-sm text-amber-600">No classes found for this date/type.</div>
                    {:else}
                      <div class="flex flex-wrap gap-2">
                        {#each availableClasses as cls}
                          {@const currentIds = $formData.selected_class_ids ?? []}
                          {@const isChecked = currentIds.includes(cls.id)}
                          <div class="flex items-center gap-2 border px-3 py-1 rounded cursor-pointer hover:bg-muted">
                            <Checkbox
                              {...props}
                              checked={isChecked}
                              onCheckedChange={(v) => {
                                if (v) {
                                  $formData.selected_class_ids = [...currentIds, cls.id];
                                } else {
                                  $formData.selected_class_ids = currentIds.filter((id) => id !== cls.id);
                                }
                              }}
                            />
                            <span class="text-sm font-mono">
                              {new Date(cls.start_time).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        {/each}
                      </div>
                      <input type="hidden" name="selected_class_ids" value={$formData.selected_class_ids} />
                    {/if}
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="space-y-4">
      <Form.Field {form} name="title" class="space-y-2">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Title <span class="text-muted-foreground font-normal">(Optional)</span></Form.Label>
            <div class="relative">
              <Input bind:value={$formData.title} placeholder="e.g. Fran, Murph, Heavy Day" />
              {#if !$formData.title && $formData.date}
                <div class="absolute right-3 top-2.5 text-xs text-muted-foreground">
                  Will generate: {$formData.class_type} - {$formData.date}
                </div>
              {/if}
            </div>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <div class="space-y-2 flex-1 flex flex-col">
        <Form.Field {form} name="description" class="flex flex-col justify-between items-center">
          <Form.Control>
            {#snippet children({ props })}
              <div class="flex flex-row w-full justify-between">
                <Form.Label>Description</Form.Label>
                <Button size="sm" variant="ghost" onclick={insertTemplate}
                  ><Wand2 class="w-3 h-3 mr-1" />Insert template</Button
                >
              </div>

              <Textarea
                {...props}
                bind:value={$formData.description}
                class="font-mono text-sm min-h-[300px] leading-relaxed"
                placeholder="Paste your workout text here..."
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      </div>

      <div class="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={$submitting}>
          {#if $submitting}Saving...{:else}Create & Assign{/if}
        </Button>
      </div>
    </div>
  </form>
</PageShell>
