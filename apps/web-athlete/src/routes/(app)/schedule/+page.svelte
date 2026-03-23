<script lang="ts">
import { globalClock, getAvailability } from "@wodapp/core";
import { addDays, format, isSameDay, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Settings2, Calendar as CalIcon } from "lucide-svelte";
import { goto } from "$app/navigation";
import ClassCard from "$lib/components/schedule/ClassCard.svelte";
import { Button } from "$lib/components/ui/button";
import FilterSheet from "$lib/components/schedule/FilterSheet.svelte";
import type { PageData } from "./$types";
import FilterBar from "$lib/components/schedule/FilterBar.svelte";

let { data }: { data: PageData } = $props();

let selectedDate = $state(new Date());
let currentWeekStart = $state(startOfWeek(selectedDate, { weekStartsOn: 1 }));

// Local state to catch the output from FilterBar
let activeFilters = $state({
  selectedTypes: [] as string[],
  selectedCoaches: [] as string[],
  timeRange: [data.filterOptions.bounds.min, data.filterOptions.bounds.max]
});

// Helper for the time slider
function getMinutesFromMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

let dailyClasses = $derived(
  (data.schedule || []).filter((c) => {
    const classTime = new Date(c.start_time);
    // Day filter
    if (!isSameDay(classTime, selectedDate)) return false;
    // Class Type filter (empty array means all enabled)
    if (
      activeFilters.selectedTypes.length > 0
      && !activeFilters.selectedTypes.includes(c.class_type)
    ) {
      return false;
    }
    // Coach filter (empty array means all enabled)
    if (
      activeFilters.selectedCoaches.length > 0
      && (!c.coach?.display_name || !activeFilters.selectedCoaches.includes(c.coach.display_name))
    ) {
      return false;
    }
    // Time range
    const mins = getMinutesFromMidnight(classTime);
    if (mins < activeFilters.timeRange[0] || mins > activeFilters.timeRange[1]) {
      return false;
    }
    return true;
  })
);

let firstClass = $derived(dailyClasses[0]);
let viewState = $derived.by(() => {
  if (dailyClasses.length === 0) return "empty";

  if (
    firstClass?.bookingOpensType === "fixed_day"
    && globalClock.now < new Date(firstClass.openTime)
  ) {
    const isIncomingWeek =
      new Date(firstClass.openTime).getTime() - globalClock.now.getTime() < 7 * 24 * 60 * 60 * 1000;
    return isIncomingWeek ? "locked_incoming" : "locked_future";
  }

  return "visible";
});

let availability = $derived(
  firstClass && viewState === "locked_incoming"
    ? getAvailability(firstClass.openTime, globalClock.now)
    : null
);

function changeWeek(dir: -1 | 1) {
  const newStart = dir === 1 ? addWeeks(currentWeekStart, 1) : subWeeks(currentWeekStart, 1);
  goto(`?date=${format(newStart, "yyyy-MM-dd")}`, { replaceState: true });
  currentWeekStart = newStart;
  selectedDate = newStart;
}
</script>

<div class="flex flex-col h-full bg-background">
  <header class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-2">
    <div class="flex items-center px-4 mt-2 mb-1 text-sm">
      <Button variant="ghost" class="p-2 rounded-full -ml-2">
        <CalIcon class="w-4 h-4 mr-2" />
        <span>{format(selectedDate, 'MMMM yyyy')}</span>
      </Button>
    </div>

    <div class="flex items-center justify-between px-2 py-2">
      <Button type="button" variant="ghost" size="icon" onclick={() => changeWeek(-1)}>
        <ChevronLeft class="w-5 h-5" />
      </Button>

      <div class="flex flex-1 justify-between px-2">
        {#each Array(7) as _, i}
          {@const day = addDays(currentWeekStart, i)}
          {@const isSelected = isSameDay(day, selectedDate)}
          {@const isToday = isSameDay(day, new Date())}

          <Button
            type="button"
            variant={isSelected ? "default" : "ghost"}
            class="flex flex-col items-center w-10 h-auto py-1.5 px-1 {isToday && !isSelected ? 'text-primary font-bold' : ''}"
            onclick={() => selectedDate = day}>
            <span class="text-[10px] uppercase opacity-70">{format(day, 'EEE')}</span>
            <span class="text-sm font-semibold">{format(day, 'd')}</span>
          </Button>
        {/each}
      </div>

      <Button type="button" variant="ghost" size="icon" onclick={() => changeWeek(1)}>
        <ChevronRight class="w-5 h-5" />
      </Button>
    </div>

    <div class="px-3 border-t mt-1 pt-1">
      <FilterBar filterOptions={data.filterOptions} onFilterChange={(f) => activeFilters = f} />
    </div>
  </header>

  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#if !data.activeLocation}
      <div class="flex flex-col items-center justify-center h-[60vh] text-center p-8 space-y-4">
        <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl">
          📍
        </div>
        <h2 class="text-xl font-bold">Find your box</h2>
        <p class="text-muted-foreground text-sm">
          You aren't a member of any gym yet. Here you'll see classes available at your active
          location.
        </p>
        <Button href="/search">Find a Gym</Button>
      </div>
    {:else}
      {#if viewState === 'empty' || viewState === 'locked_future'}
        <div class="text-center p-8 border rounded-lg">
          <p>Rest day 😴</p>
          <p>No classes scheduled (yet)</p>
        </div>
      {:else if viewState === 'locked_incoming' && availability}
        <div class="text-center p-8 border rounded-lg">
          <p class="text-xl">
            {#if availability.type === 'now'}
              Available now
            {:else if availability.type === 'countdown'}
              Booking opens in {availability.minutes}m {availability.seconds}s
            {:else if availability.type === 'today'}
              Booking opens today at {availability.timeStr}
            {:else if availability.type === 'tomorrow'}
              Booking opens tomorrow at {availability.timeStr}
            {:else if availability.type === 'future'}
              Booking opens {availability.dayStr} at {availability.timeStr}
            {/if}
          </p>
        </div>
      {:else if viewState === 'visible'}
        <div class="grid gap-4">
          {#each dailyClasses as workout (workout.id)}
            <ClassCard classData={workout} />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
