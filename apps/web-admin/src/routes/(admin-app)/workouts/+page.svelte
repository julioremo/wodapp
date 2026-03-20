<script lang="ts">
import { Funnel, LayoutGrid, List, Search } from "lucide-svelte";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import * as Sheet from "$lib/components/ui/sheet";
import WorkoutEditor from "$lib/components/workouts/WorkoutEditor.svelte";
import { PALETTE } from "$lib/config/colors";

let { data } = $props();

// New State for the Sheet
let sheetOpen = $state(false);
let selectedWorkout = $state<any>(null);

function openEditor(workout: any) {
  selectedWorkout = workout;
  sheetOpen = true;
}

function handleCreateNew() {
  selectedWorkout = {
    id: null,
    slug: `new-workout-${Math.floor(Math.random() * 1000)}`,
    description: "",
    duration: 15,
    workout_type: "WOD",
    class_type: data.activeClassTypes?.[0] || ""
  };
  sheetOpen = true;
}

let searchQuery = $state("");
let viewMode = $state<"grid" | "list">("grid");

function getColorForString(str: string | null) {
  if (!str) return "bg-muted text-muted-foreground";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

let filteredWorkouts = $derived(
  data.workouts.filter((w) => {
    const searchTarget = `${w.slug || ""} ${w.description || ""}`.toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  })
);
</script>

<div class="max-w-7xl mx-auto p-6 space-y-8">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Workout Library</h1>
      <p class="text-muted-foreground mt-2">
        Manage your repository of workouts, strength cycles, and structured data.
      </p>
    </div>
    <Button onclick={handleCreateNew}>Create Workout</Button>
  </div>

  <div class="flex items-center gap-2 justify-between">
    <div class="flex items-center gap-2 flex-1 max-w-md">
      <div class="relative flex-1">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by slug or description..."
          class="pl-9 bg-background font-mono text-sm"
          bind:value={searchQuery} />
      </div>
      <!-- TODO: advanced filtering
       <Button variant="outline" size="icon"> <Funnel class="h-4 w-4" /> </Button> -->
    </div>

    <div class="flex items-center bg-muted/50 p-1 rounded-md border">
      <Button
        variant={viewMode === "grid" ? "secondary" : "ghost"}
        size="sm"
        class="h-7 px-2"
        onclick={() => viewMode = "grid"}>
        <LayoutGrid class="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        class="h-7 px-2"
        onclick={() => viewMode = "list"}>
        <List class="h-4 w-4" />
      </Button>
    </div>
  </div>

  {#if filteredWorkouts.length === 0}
    <div
      class="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20">
      <p class="text-muted-foreground">No workouts found matching your search.</p>
    </div>
  {:else if viewMode === "grid"}
    <div class="flex flex-wrap gap-6 items-start">
      {#each filteredWorkouts as workout}
        <Card.Root
          class="w-80 shrink-0 rounded-none border-2 border-border bg-stone-100 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col font-mono"
          onclick={() => openEditor(workout)}>
          <Card.Content class="p-4 flex flex-col h-full">
            <div class="flex flex-wrap gap-1.5 mb-3">
              {#if workout.class_type}
                <Badge
                  variant="secondary"
                  class="rounded-none border border-foreground/10 uppercase text-[10px]"
                  style="background-color: {getColorForString(workout.class_type)}20; color: {getColorForString(workout.class_type)};">
                  {workout.class_type}
                </Badge>
              {/if}
              {#if workout.workout_type}
                <Badge
                  variant="outline"
                  class="rounded-none border-foreground/30 text-foreground/70 uppercase text-[10px]">
                  {workout.workout_type}
                </Badge>
              {/if}
              {#if workout.duration}
                <Badge
                  variant="outline"
                  class="rounded-none border-foreground/30 text-foreground/70 uppercase text-[10px]">
                  {workout.duration}m
                </Badge>
              {/if}
            </div>

            <div class="text-sm font-bold lowercase text-foreground">
              {workout.slug || "untitled-slug"}
            </div>

            <hr class="border-t-2 border-dashed border-border my-3" />

            <p
              class="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-[10]">
              {workout.description}
            </p>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else if viewMode === "list"}
    <div class="flex flex-col gap-2">
      {#each filteredWorkouts as workout}
        <div
          class="flex items-center gap-4 p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors cursor-pointer font-mono group"
          role="button"
          tabindex="0"
          onclick={() => openEditor(workout)}>
          <div class="text-sm font-bold lowercase text-foreground w-50 shrink-0 truncate">
            {workout.slug || "untitled-slug"}
          </div>

          <div
            class="text-sm text-muted-foreground truncate flex-1 group-hover:text-foreground transition-colors">
            {workout.description}
          </div>

          <div class="flex items-center gap-1.5 shrink-0 ml-4">
            {#if workout.class_type}
              <Badge
                variant="secondary"
                class="uppercase text-[10px]"
                style="background-color: {getColorForString(workout.class_type)}20; color: {getColorForString(workout.class_type)};">
                {workout.class_type}
              </Badge>
            {/if}
            {#if workout.workout_type}
              <Badge
                variant="outline"
                class="border-muted-foreground/30 text-muted-foreground uppercase text-[10px]">
                {workout.workout_type}
              </Badge>
            {/if}
            {#if workout.duration}
              <Badge
                variant="outline"
                class="border-muted-foreground/30 text-muted-foreground uppercase text-[10px]">
                {workout.duration}m
              </Badge>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Sheet.Root bind:open={sheetOpen}>
  <Sheet.Content side="right" class="w-full sm:max-w-xl p-0 border-none shadow-2xl">
    {#if selectedWorkout}
      <WorkoutEditor
        workout={selectedWorkout}
        activeClassTypes={data.activeClassTypes}
        formData={data.form}
        onSaved={() => {
          // Optional: You could invalidateAll() here to refresh the grid, 
          // but the SvelteKit form action will actually do it automatically!
        }}
        onDeleted={() => {
          sheetOpen = false;
          selectedWorkout = null;
        }} />
    {/if}
  </Sheet.Content>
</Sheet.Root>
