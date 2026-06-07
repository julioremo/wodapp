<script lang="ts">
import { Plus, X } from "@lucide/svelte";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import * as Drawer from "@ui/drawer";
import { Separator } from "@ui/separator";
import * as Sheet from "@ui/sheet";
import { Slider } from "@ui/slider";
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";

let { children, filterData = { types: [], bounds: { min: 360, max: 1320 } } } = $props();

// State
let open = $state(false);
let isDesktop = $state(false);
// Parse URL for initial state
// 1. Types (No HIDDEN types in URL means "Show All")
let hiddenTypes = $state<Set<string>>(new Set());
// 2. Time Ranges (Array of [start, end] in minutes)
// Default: One range covering the whole day
let timeRanges = $state<number[][]>([[filterData.bounds.min, filterData.bounds.max]]);

// --- 1. RESPONSIVENESS ---
$effect(() => {
  if (browser) {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    isDesktop = mediaQuery.matches; // Set initial value
    const onChange = (e: MediaQueryListEvent) => (isDesktop = e.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }
});

// Sync state from URL when Sheet opens
$effect(() => {
  if (open) {
    const params = page.url.searchParams;
    // Sync Types
    const hiddenParam = params.get("hiddenTypes");
    hiddenTypes = new Set(hiddenParam ? hiddenParam.split(",") : []);
    // Sync Time
    const rangesParam = params.get("timeRanges");
    if (rangesParam) {
      // Format: "360-540,1000-1200"
      timeRanges = rangesParam.split(",").map((r) => r.split("-").map(Number));
    } else {
      resetTime();
    }
  }
});

// --- ACTIONS ---

// Type Toggles
function toggleType(type: string) {
  if (hiddenTypes.has(type)) {
    hiddenTypes.delete(type); // Un-hide (Select)
  } else {
    hiddenTypes.add(type); // Hide (Deselect)
  }
  // Re-trigger reactivity
  hiddenTypes = new Set(hiddenTypes);
}

// Time Logic
function addTimeRange() {
  // Add a default small range in the middle of the day
  timeRanges = [...timeRanges, [720, 840]]; // 12:00 - 14:00
}

function removeTimeRange(index: number) {
  timeRanges = timeRanges.filter((_, i) => i !== index);
}

function resetTime() {
  timeRanges = [[filterData.bounds.min, filterData.bounds.max]];
}

// Helper: Minutes to HH:mm
function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Apply to URL
function applyFilters() {
  const newUrl = new URL(page.url);

  // 1. Apply Hidden Types
  if (hiddenTypes.size > 0) {
    newUrl.searchParams.set("hiddenTypes", Array.from(hiddenTypes).join(","));
  } else {
    newUrl.searchParams.delete("hiddenTypes");
  }

  // 2. Apply Time Ranges
  // Only set param if it differs from default (full day)
  const isDefaultTime =
    timeRanges.length === 1
    && timeRanges[0][0] === filterData.bounds.min
    && timeRanges[0][1] === filterData.bounds.max;

  if (!isDefaultTime) {
    const rangeString = timeRanges.map((r) => `${r[0]}-${r[1]}`).join(",");
    newUrl.searchParams.set("timeRanges", rangeString);
  } else {
    newUrl.searchParams.delete("timeRanges");
  }

  goto(newUrl, { replaceState: true, keepFocus: true });
  open = false;
}

function resetAll() {
  hiddenTypes.clear();
  resetTime();
}
</script>
{#if isDesktop}
  <Sheet.Root bind:open>
    <Sheet.Trigger asChild>{@render children()}</Sheet.Trigger>
    <Sheet.Content side="right" class="w-[400px] sm:w-[540px] overflow-y-auto">
      <Sheet.Header>
        <Sheet.Title>Filter Schedule</Sheet.Title>
        <Sheet.Description>Adjust class types and times.</Sheet.Description>
      </Sheet.Header>

      {@render filterForm()}
    </Sheet.Content>
  </Sheet.Root>
{:else}
  <Drawer.Root bind:open>
    <Drawer.Trigger asChild>{@render children()}</Drawer.Trigger>
    <Drawer.Content class="max-h-[85vh]">
      <Drawer.Header class="text-left">
        <Drawer.Title>Filter Schedule</Drawer.Title>
        <Drawer.Description>Adjust class types and times.</Drawer.Description>
      </Drawer.Header>

      <div class="px-4 overflow-y-auto">
        {@render filterForm()}
      </div>

      <Drawer.Footer class="pt-2">
        <Drawer.Close asChild> <Button variant="outline">Cancel</Button> </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}

{#snippet filterForm()}
  <div class="grid gap-8 py-6">
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <h4 class="text-sm font-medium">Class Types</h4>
        {#if hiddenTypes.size > 0}
          <Button
            variant="ghost"
            size="sm"
            class="h-6 text-[10px]"
            onclick={() => hiddenTypes.clear()}>
            Reset
          </Button>
        {/if}
      </div>
      <div class="flex flex-wrap gap-2">
        {#each filterData.types as type}
          {@const isSelected = !hiddenTypes.has(type)}
          <button class="focus:outline-none group" onclick={() => toggleType(type)}>
            <Badge
              variant={isSelected ? "default" : "outline"}
              class="text-sm px-3 py-1 transition-all h-8 cursor-pointer select-none">
              {type}
            </Badge>
          </button>
        {/each}
      </div>
    </div>

    <Separator />

    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h4 class="text-sm font-medium">Time Ranges</h4>
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={resetTime}>Reset</Button>
          <Button variant="outline" size="sm" class="h-7 text-xs gap-1" onclick={addTimeRange}>
            <Plus class="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      {#each timeRanges as range, i}
        <div class="bg-secondary/30 p-4 rounded-lg space-y-4 relative group">
          {#if timeRanges.length > 1}
            <button
              onclick={() => removeTimeRange(i)}
              class="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1">
              <X class="w-3 h-3" />
            </button>
          {/if}
          <div class="flex justify-between text-xs font-mono text-muted-foreground">
            <span>{formatTime(range[0])}</span>
            <span>{formatTime(range[1])}</span>
          </div>
          <Slider
            value={[range[0], range[1]]}
            min={filterData.bounds.min}
            max={filterData.bounds.max}
            step={15}
            onValueChange={(vals) => timeRanges[i] = vals}
            class="w-full" />
        </div>
      {/each}
    </div>
  </div>

  <div class="pt-4 pb-4">
    <Button class="w-full font-bold" onclick={applyFilters}> Show Results </Button>
  </div>
{/snippet}
