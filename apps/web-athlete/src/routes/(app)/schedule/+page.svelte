<script lang="ts">
import { addDays, format, isSameDay, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Settings2, Calendar as CalIcon } from "lucide-svelte";
import { goto } from "$app/navigation";
import ClassCard from "$lib/components/schedule/ClassCard.svelte";
import { Button } from "$lib/components/ui/button";
import FilterSheet from "$lib/components/schedule/FilterSheet.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let selectedDate = $state(new Date());
let currentWeekStart = $state(startOfWeek(selectedDate, { weekStartsOn: 1 }));

let dailyClasses = $derived(
  (data.schedule || []).filter((c) => isSameDay(new Date(c.start_time), selectedDate))
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
    <div class="flex items-center justify-between px-4 mt-1 text-sm">
      <Button variant="ghost" class="p-2 rounded-full">
        <CalIcon class="w-4 h-4" />
        <span>{format(selectedDate, 'MMMM')}</span>
      </Button>

      <FilterSheet filterData={data.filterOptions}>
        <Button variant="ghost" class="p-2 rounded-full"> <Settings2 class="w-4 h-4" /> </Button>
      </FilterSheet>
    </div>

    <div class="flex items-center justify-between px-2 py-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="rounded-full"
        onclick={() => changeWeek(-1)}>
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="rounded-full"
        onclick={() => changeWeek(1)}>
        <ChevronRight class="w-5 h-5" />
      </Button>
    </div>

    <div class="flex items-center justify-center px-4 mt-1">
      <h5 class="text-sm font-bold leading-none">{format(selectedDate, 'EEEE — d MMM y')}</h5>
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
      {#if dailyClasses.length === 0}
        <div class="h-full flex justify-center items-center">
          <div class="text-center py-10 text-muted-foreground">
            <p>Rest Day 😴</p>
            <p>No classes scheduled.</p>
          </div>
        </div>
      {:else}
        <!-- <h1 class="text-xl font-bold leading-none">Classes</h1> -->
        {#each dailyClasses as workout (workout.id)}
          <ClassCard classData={workout} />
        {/each}
      {/if}
    {/if}
  </div>
</div>
