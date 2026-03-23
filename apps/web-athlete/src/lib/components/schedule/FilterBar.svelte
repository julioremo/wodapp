<script lang="ts">
import type { Snippet } from "svelte";
import { buttonVariants } from "$lib/components/ui/button";
import * as Popover from "$lib/components/ui/popover";
import * as Drawer from "$lib/components/ui/drawer";
import { Slider } from "$lib/components/ui/slider";
import * as ToggleGroup from "$lib/components/ui/toggle-group";
import { cn } from "$lib/utils";

let { filterOptions, onFilterChange } = $props();

let selectedTypes = $state<string[]>([]);
let selectedCoaches = $state<string[]>([]);
let timeRange = $state<number[]>([filterOptions.bounds.min, filterOptions.bounds.max]);

let initialized = $state(false);
let isDesktop = $state(true);

// Handle responsive layout detection
$effect(() => {
  const mql = window.matchMedia("(min-width: 768px)");
  isDesktop = mql.matches;

  const handler = (e: MediaQueryListEvent) => {
    isDesktop = e.matches;
  };

  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
});

// Local storage hydration
$effect(() => {
  const stored = localStorage.getItem("scheduleFilters");
  if (stored) {
    const parsed = JSON.parse(stored);
    selectedTypes = parsed.selectedTypes || [];
    selectedCoaches = parsed.selectedCoaches || [];
    timeRange = parsed.timeRange || [filterOptions.bounds.min, filterOptions.bounds.max];
  }
  initialized = true;
});

// Sync back to local storage and parent
$effect(() => {
  if (!initialized) return;

  const filters = { selectedTypes, selectedCoaches, timeRange };
  localStorage.setItem("scheduleFilters", JSON.stringify(filters));
  onFilterChange(filters);
});

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getTriggerText(label: string, selected: string[]) {
  if (selected.length === 0) return label;
  if (selected.length <= 3) return selected.join(", ");
  return `${label} (${selected.length})`;
}
</script>

{#snippet classTypesContent()}
  <ToggleGroup.Root
    type="multiple"
    bind:value={selectedTypes}
    class="flex flex-wrap gap-2 justify-start">
    {#each filterOptions.allClassTypes as type}
      <ToggleGroup.Item value={type} variant="outline" size="sm" class="rounded-full h-7 text-xs">
        {type}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
{/snippet}

{#snippet coachesContent()}
  <ToggleGroup.Root
    type="multiple"
    bind:value={selectedCoaches}
    class="flex flex-wrap gap-2 justify-start">
    {#each filterOptions.allCoaches as coach}
      <ToggleGroup.Item value={coach} variant="outline" size="sm" class="rounded-full h-7 text-xs">
        {coach}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
{/snippet}

{#snippet timeContent()}
  <div class="space-y-4 pt-2">
    <div class="flex justify-between items-center">
      <span class="text-xs text-muted-foreground"
        >{formatTime(timeRange[0])}
        - {formatTime(timeRange[1])}</span
      >
    </div>
    <Slider
      type="multiple"
      bind:value={timeRange}
      min={filterOptions.bounds.min}
      max={filterOptions.bounds.max}
      step={30} />
  </div>
{/snippet}

{#snippet FilterBlock(title: string, triggerText: string, isActive: boolean, contentSnippet: any)}
  {#if isDesktop}
    <Popover.Root>
      <Popover.Trigger
        class={cn(
          buttonVariants({ variant: isActive ? "default" : "secondary", size: "sm" }), 
          "rounded-full whitespace-nowrap"
        )}>
        {triggerText}
      </Popover.Trigger>
      <Popover.Content class="w-64 p-4" align="start">
        <div class="space-y-3">
          <h4 class="font-medium text-sm leading-none">{title}</h4>
          {@render contentSnippet()}
        </div>
      </Popover.Content>
    </Popover.Root>
  {:else}
    <Drawer.Root>
      <Drawer.Trigger
        class={cn(
          buttonVariants({ variant: isActive ? "default" : "secondary", size: "sm" }), 
          "rounded-full whitespace-nowrap"
        )}>
        {triggerText}
      </Drawer.Trigger>
      <Drawer.Content>
        <div class="px-4 pb-8 pt-4 space-y-4">
          <Drawer.Header class="p-0 text-left">
            <Drawer.Title class="text-lg">{title}</Drawer.Title>
          </Drawer.Header>
          {@render contentSnippet()}
        </div>
      </Drawer.Content>
    </Drawer.Root>
  {/if}
{/snippet}

<div class="flex overflow-x-auto flex-nowrap gap-2 py-2 no-scrollbar">
  {@render FilterBlock(
    "Class Types", 
    getTriggerText("Class Type", selectedTypes), 
    selectedTypes.length > 0, 
    classTypesContent
  )}

  {#if filterOptions.showCoachFilter}
    {@render FilterBlock(
      "Coaches", 
      getTriggerText("Coach", selectedCoaches), 
      selectedCoaches.length > 0, 
      coachesContent
    )}
  {/if}

  {@render FilterBlock(
    "Time Window", 
    `${formatTime(timeRange[0])} - ${formatTime(timeRange[1])}`, 
    false, 
    timeContent
  )}
</div>
