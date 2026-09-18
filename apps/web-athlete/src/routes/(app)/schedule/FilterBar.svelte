<script lang="ts">
import { SlidersVertical } from "@lucide/svelte";
import { buttonVariants } from "@ui/button";
import * as Drawer from "@ui/drawer";
import * as Popover from "@ui/popover";
import { Slider } from "@ui/slider";
import { Toggle, toggleVariants } from "@ui/toggle";
import * as ToggleGroup from "@ui/toggle-group";
import { cn } from "@ui-utils";
import { defaultSettings, type GymSettings } from "@wodapp/core";
import type { Snippet } from "svelte";
import type {
  ActiveScheduleFilters,
  ScheduledClass,
  ScheduleFilterOptions,
} from "./types";

interface Props {
  filterOptions: ScheduleFilterOptions;
  classes?: ScheduledClass[];
  location?: { settings?: Partial<GymSettings> | null } | null;
  onFilterChange: (filters: ActiveScheduleFilters) => void;
}

let {
  filterOptions,
  classes = [],
  location = null,
  onFilterChange,
}: Props = $props();

let selectedTypes = $state<string[]>([]);
let selectedCoaches = $state<string[]>([]);
let timeRange = $state<number[]>([
  filterOptions.bounds.min,
  filterOptions.bounds.max,
]);

let initialized = $state(false);
let isDesktop = $state(true);

let minBound = $derived(filterOptions.bounds.min);
let maxBound = $derived(filterOptions.bounds.max);

let isTimeActive = $derived(timeRange[0] > minBound || timeRange[1] < maxBound);

// Derive visible class types:
// If filtering by coach, show only class types present in classes remaining on screen.
// Otherwise, show all class types.
let availableClassTypes = $derived.by(() => {
  if (selectedCoaches.length === 0) {
    return filterOptions.allClassTypes;
  }

  const matchingCoachClasses = classes.filter(
    (c) =>
      c.coach?.display_name && selectedCoaches.includes(c.coach.display_name),
  );
  const presentTypes = new Set(matchingCoachClasses.map((c) => c.class_type));

  return filterOptions.allClassTypes.filter((t) => presentTypes.has(t));
});

let shouldPromoteClassTypes = $derived(availableClassTypes.length <= 6);

let classColorMap = $derived.by(() => {
  const map: Record<string, string> = {};
  const classTypesList =
    location?.settings?.classTypes ?? defaultSettings.classTypes ?? [];
  for (const ct of classTypesList) {
    if (ct.name && ct.color) {
      map[ct.name] = ct.color;
    }
  }
  return map;
});

function getClassColor(type: string): string {
  return (
    classColorMap[type] ??
    defaultSettings.classTypes.find((ct) => ct.name === type)?.color ??
    (location?.settings as any)?.defaultClassColor ??
    "#4E79A7"
  );
}

function getContrastTextColor(color?: string): string {
  if (!color) return "#ffffff";
  let hex = color.trim().replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? "#18181b" : "#ffffff";
  }
  return "#ffffff";
}

// Prune any selected types that are no longer available when filtering by coach
$effect(() => {
  if (selectedCoaches.length > 0) {
    const valid = selectedTypes.filter((t) => availableClassTypes.includes(t));
    if (valid.length !== selectedTypes.length) {
      selectedTypes = valid;
    }
  }
});

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
    try {
      const parsed = JSON.parse(stored);
      selectedTypes = Array.isArray(parsed.selectedTypes)
        ? parsed.selectedTypes
        : [];
      selectedCoaches = Array.isArray(parsed.selectedCoaches)
        ? parsed.selectedCoaches
        : [];
      const parsedRange = parsed.timeRange;
      if (
        Array.isArray(parsedRange) &&
        parsedRange.length === 2 &&
        typeof parsedRange[0] === "number" &&
        typeof parsedRange[1] === "number" &&
        parsedRange[0] < parsedRange[1] &&
        parsedRange[0] >= minBound &&
        parsedRange[1] <= maxBound
      ) {
        timeRange = [parsedRange[0], parsedRange[1]];
      } else {
        timeRange = [minBound, maxBound];
      }
    } catch {
      timeRange = [minBound, maxBound];
    }
  } else {
    timeRange = [minBound, maxBound];
  }
  initialized = true;
});

// Sync back to local storage and parent
$effect(() => {
  if (!initialized) return;

  const filters: ActiveScheduleFilters = {
    selectedTypes,
    selectedCoaches,
    timeRange: [timeRange[0], timeRange[1]],
  };
  localStorage.setItem("scheduleFilters", JSON.stringify(filters));
  onFilterChange(filters);
});

function handleToggleType(type: string, pressed: boolean) {
  if (pressed) {
    if (!selectedTypes.includes(type)) {
      selectedTypes = [...selectedTypes, type];
    }
  } else {
    selectedTypes = selectedTypes.filter((t) => t !== type);
  }
}

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
  <div class="flex flex-wrap gap-2 justify-start">
    {#each availableClassTypes as type (type)}
      {@const isSelected = selectedTypes.includes(type)}
      {@const color = getClassColor(type)}
      <Toggle
        variant="ghost"
        size="sm"
        pressed={isSelected}
        onPressedChange={(pressed) => handleToggleType(type, pressed)}
        style={isSelected && color
          ? `background-color: ${color}; color: ${getContrastTextColor(color)}; border-color: transparent;`
          : undefined}
        class={cn(
          "rounded-full h-7 px-2.5 text-xs whitespace-nowrap font-medium",
          isSelected && "hover:opacity-90",
        )}>
        {type}
      </Toggle>
    {/each}
  </div>
{/snippet}

{#snippet coachesContent()}
  <ToggleGroup.Root
    type="multiple"
    bind:value={selectedCoaches}
    class="flex flex-wrap gap-2 justify-start">
    {#each filterOptions.allCoaches as coach}
      <ToggleGroup.Item
        value={coach}
        variant="ghost"
        size="sm"
        class="rounded-full h-7 text-xs">
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
        - {formatTime(timeRange[1])}</span>
    </div>
    <Slider
      type="multiple"
      bind:value={timeRange}
      min={filterOptions.bounds.min}
      max={filterOptions.bounds.max}
      step={30} />
  </div>
{/snippet}

{#snippet FilterBlock({
  contentTitle,
  triggerText,
  isActive,
  contentSnippet,
}: {
  contentTitle: string;
  triggerText: string;
  isActive: boolean;
  contentSnippet: Snippet;
})}
  {@const triggerClass = cn(
    buttonVariants({
      variant: isActive ? "default" : "ghost",
      size: "sm",
    }),
    "filter-toggle",
  )}
  {#if isDesktop}
    <Popover.Root>
      <Popover.Trigger class={triggerClass}>{triggerText}</Popover.Trigger>
      <Popover.Content class="w-64 p-4" align="start">
        <div class="space-y-3">
          <h4 class="font-medium text-sm leading-none">{contentTitle}</h4>
          {@render contentSnippet()}
        </div>
      </Popover.Content>
    </Popover.Root>
  {:else}
    <Drawer.Root>
      <Drawer.Trigger class={triggerClass}>{triggerText}</Drawer.Trigger>
      <Drawer.Content>
        <div class="px-4 pb-8 pt-4 space-y-4">
          <Drawer.Header class="p-0 text-left">
            <Drawer.Title class="text-lg">{contentTitle}</Drawer.Title>
          </Drawer.Header>
          {@render contentSnippet()}
        </div>
      </Drawer.Content>
    </Drawer.Root>
  {/if}
{/snippet}

<div
  class="w-full flex overflow-x-auto flex-nowrap gap-1 px-2 py-1 scrollbar-none items-center">
  <div class="py-1"><SlidersVertical class="size-3.5" /></div>

  {@render FilterBlock({
    contentTitle: "Time Window",
    triggerText: `${formatTime(timeRange[0])} - ${formatTime(timeRange[1])}`,
    isActive: isTimeActive,
    contentSnippet: timeContent,
  })}

  {#if shouldPromoteClassTypes}
    {#each availableClassTypes as type (type)}
      {@const isSelected = selectedTypes.includes(type)}
      {@const color = getClassColor(type)}
      <Toggle
        variant="ghost"
        size="sm"
        pressed={isSelected}
        onPressedChange={(pressed) => handleToggleType(type, pressed)}
        style={isSelected && color
          ? `background-color: ${color}; color: ${getContrastTextColor(color)}; border-color: transparent;`
          : undefined}
        class={cn(
          "filter-toggle px-3 shrink-0 rounded-[7px] text-nowrap",
          isSelected && "hover:opacity-90",
        )}>
        {type}
      </Toggle>
    {/each}
  {:else if availableClassTypes.length > 0}
    {@render FilterBlock({
      contentTitle: "Class Types",
      triggerText: getTriggerText("Class Type", selectedTypes),
      isActive: selectedTypes.length > 0,
      contentSnippet: classTypesContent,
    })}
  {/if}

  {#if filterOptions.showCoachFilter}
    {@render FilterBlock({
      contentTitle: "Coaches",
      triggerText: getTriggerText("Coach", selectedCoaches),
      isActive: selectedCoaches.length > 0,
      contentSnippet: coachesContent,
    })}
  {/if}
</div>

<style>
/* @reference "../../../app.css";

.filter-toggle {
  @apply h-9 px-3 shrink-0 rounded-[7px] text-nowrap;
} */
</style>
