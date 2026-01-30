<script lang="ts">
  import { addDays, format, isSameDay, startOfWeek, subWeeks, addWeeks } from 'date-fns';
  import { ChevronLeft, ChevronRight, Funnel, Calendar as CalIcon } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import ClassCard from './ClassCard.svelte';
  import { Button } from "$lib/components/ui/button";

  let { data } = $props();
  
  // State
  let selectedDate = $state(new Date());
  let currentWeekStart = $state(new Date(data.weekStart));

  // Derived: Filter classes for the currently selected day
  let dailyClasses = $derived(
    data.classes.filter(c => isSameDay(new Date(c.start_time), selectedDate))
  );

  // Navigation Handlers
  function changeWeek(dir: -1 | 1) {
    const newStart = dir === 1 ? addWeeks(currentWeekStart, 1) : subWeeks(currentWeekStart, 1);
    // Ideally, we reload data here via URL param
    goto(`?date=${format(newStart, 'yyyy-MM-dd')}`, { replaceState: true });
    currentWeekStart = newStart;
    selectedDate = newStart; // Reset selection to Monday of new week
  }
</script>

<div class="flex flex-col h-full bg-background">
  
  <header class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-2">
    
    <div class="flex items-center justify-between px-2 py-2">
      <button onclick={() => changeWeek(-1)} class="p-2"><ChevronLeft class="w-5 h-5" /></button>
      
      <div class="flex flex-1 justify-between px-2">
        {#each Array(7) as _, i}
          {@const day = addDays(currentWeekStart, i)}
          {@const isSelected = isSameDay(day, selectedDate)}
          {@const isToday = isSameDay(day, new Date())}
          
          <button 
            onclick={() => selectedDate = day}
            class="flex flex-col items-center w-10 p-1 rounded-lg transition-colors
              {isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
              {isToday && !isSelected ? 'text-primary font-bold' : ''}"
          >
            <span class="text-[10px] uppercase opacity-70">{format(day, 'EEE')}</span>
            <span class="text-sm font-semibold">{format(day, 'd')}</span>
          </button>
        {/each}
      </div>

      <button onclick={() => changeWeek(1)} class="p-2"><ChevronRight class="w-5 h-5" /></button>
    </div>

    <div class="flex items-center justify-between px-4 mt-1">
      <div>
        <h2 class="text-lg font-bold leading-none">{format(selectedDate, 'EEEE')}</h2>
        <span class="text-xs text-muted-foreground">{format(selectedDate, 'MMMM do')}</span>
      </div>
      
      <div class="flex gap-2">
         <button class="p-2 bg-muted rounded-full">
            <CalIcon class="w-4 h-4" />
         </button>
         <button class="p-2 bg-muted rounded-full">
            <Funnel class="w-4 h-4" />
         </button>
      </div>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#if !data.activeLocation}
        <div class="flex flex-col items-center justify-center h-[60vh] text-center p-8 space-y-4">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl">📍</div>
            <h2 class="text-xl font-bold">Find your box</h2>
            <p class="text-muted-foreground text-sm">
            You aren't a member of any gym yet. Here you'll see classes available at your favorite location.
            </p>
            <Button href="/search">Find a Gym</Button> </div>

    {:else}
        {#if dailyClasses.length === 0}
        <div class="text-center py-10 text-muted-foreground">
            <p>Rest Day 😴</p>
            <p class="text-xs">No classes scheduled.</p>
        </div>
        {:else}
        {#each dailyClasses as workout (workout.id)}
            <ClassCard 
                classData={workout} 
                userId={data.user.id} 
            />
        {/each}
        {/if}
    {/if}
  </div>

</div>