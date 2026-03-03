<script lang="ts">
  import type { Block } from "$lib/types/program";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Label } from "$lib/components/ui/label";
  import { Plus, GripVertical, Trash2, Loader2 } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";

  let {
    date,
    class_type,
    program = null,
    onSuccess
  } = $props<{
    date: string;
    class_type: string;
    program?: any;
    onSuccess?: () => void;
  }>();

  // 1. LOCAL STATE
  let isSubmitting = $state(false);
  let programTitle = $state(program?.title || "");

  // Clone the incoming workouts to avoid mutating props directly
  let blocks = $state<any[]>(program?.workouts?.map((w: any, i: number) => ({ ...w, sort_order: i })) || []);

  // 2. BLOCK MANAGEMENT
  function addBlock() {
    blocks.push({
      title: "",
      description: "",
      duration: null,
      workout_type: "Metcon", // Default type
      sort_order: blocks.length
    });
  }

  function removeBlock(index: number) {
    blocks.splice(index, 1);
    // Re-index sort orders
    blocks.forEach((b, i) => (b.sort_order = i));
  }

  // 3. FORM SUBMISSION HANDLER
  function handleSubmit() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      isSubmitting = false;
      if (result.type === "success") {
        toast.success("Program saved");
        onSuccess?.();
      } else {
        toast.error("Failed to save program");
      }
      await update();
    };
  }
</script>

<form method="POST" action="?/saveProgram" use:enhance={handleSubmit} class="flex flex-col gap-8 h-full">
  <div class="space-y-4">
    <div class="flex gap-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">
      <span>{date}</span>
      <span>•</span>
      <span>{class_type}</span>
    </div>

    <div class="space-y-1">
      <Input
        name="title"
        bind:value={programTitle}
        placeholder="Program Title (e.g. Heavy Day A)"
        class="text-xl font-bold h-12 border-none shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
      />
    </div>
  </div>

  <input type="hidden" name="program_id" value={program?.id || ""} />
  <input type="hidden" name="date" value={date} />
  <input type="hidden" name="class_type" value={class_type} />
  <input type="hidden" name="blocks_json" value={JSON.stringify(blocks)} />

  <div class="space-y-6 flex-1">
    {#each blocks as block, i}
      <div
        class="group relative flex gap-3 p-4 border rounded-xl bg-card hover:border-muted-foreground/30 transition-colors"
      >
        <div class="pt-2 cursor-grab text-muted-foreground/30 group-hover:text-muted-foreground/60">
          <GripVertical class="w-4 h-4" />
        </div>

        <div class="flex-1 space-y-3">
          <div class="flex gap-3">
            <div class="w-1/3">
              <Label class="sr-only">Type</Label>
              <select
                bind:value={block.workout_type}
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Warmup">Warmup</option>
                <option value="Strength">Strength</option>
                <option value="Skill">Skill</option>
                <option value="Metcon">Metcon</option>
                <option value="Cool Down">Cool Down</option>
              </select>
            </div>
            <div class="flex-1">
              <Label class="sr-only">Title</Label>
              <Input bind:value={block.title} placeholder="Workout Title (e.g. Fran)" class="h-9" />
            </div>
            <div class="w-24">
              <Label class="sr-only">Duration</Label>
              <Input type="number" bind:value={block.duration} placeholder="Min" class="h-9" />
            </div>
          </div>

          <div>
            <Label class="sr-only">Description</Label>
            <Textarea
              bind:value={block.description}
              placeholder="Workout details..."
              class="font-mono text-sm min-h-[100px] resize-none"
            />
          </div>
        </div>

        <button
          type="button"
          onclick={() => removeBlock(i)}
          class="absolute -right-2 -top-2 bg-background border rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    {/each}

    <div class="flex justify-center pt-2">
      <Button type="button" variant="outline" size="sm" onclick={addBlock} class="gap-2 rounded-full px-6">
        <Plus class="w-4 h-4" /> Add Block
      </Button>
    </div>
  </div>

  <div class="pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur z-10 pb-4 mt-auto">
    <Button type="submit" disabled={isSubmitting} class="w-full">
      {#if isSubmitting}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" /> Saving...
      {:else}
        Save Program
      {/if}
    </Button>
  </div>
</form>
