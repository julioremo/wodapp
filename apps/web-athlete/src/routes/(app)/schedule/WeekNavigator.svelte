<script lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/svelte";
import { Button } from "@ui/button";
import { addDays, format, isSameDay } from "date-fns";

interface Props {
  selectedDate: Date;
  currentWeekStart: Date;
  hiddenDays?: number[];
  onSelectDate: (date: Date) => void;
  onChangeWeek: (dir: -1 | 1) => void;
}

let {
  selectedDate,
  currentWeekStart,
  hiddenDays = [],
  onSelectDate,
  onChangeWeek,
}: Props = $props();

const today = new Date();

import { expoIn } from "svelte/easing";
import { crossfade } from "svelte/transition";

const [send, receive] = crossfade({
  duration: 300,
  easing: expoIn,
});
</script>

<div class="flex items-end justify-between px-2">
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    class="size-7 rounded-full"
    onclick={() => onChangeWeek(-1)}
    aria-label="Previous week">
    <ChevronLeft class="w-5 h-5" />
  </Button>

  <div class="flex flex-1 justify-between px-2">
    {#each Array(7) as _, i}
      {@const day = addDays(currentWeekStart, i)}
      {@const isSelected = isSameDay(day, selectedDate)}
      {@const isToday = isSameDay(day, today)}
      {@const isHidden = hiddenDays.includes(day.getDay())}

      <Button
        type="button"
        disabled={isHidden}
        variant="ghost"
        class="group hover:bg-transparent dark:hover:bg-transparent flex flex-col items-center gap-2 h-auto grow p-0 {isHidden
          ? 'opacity-30 pointer-events-none cursor-not-allowed'
          : ''}"
        onclick={() => !isHidden && onSelectDate(day)}>
        <span
          class="text-[9px] uppercase {isToday
            ? 'text-tomato-500 font-bold'
            : ''}">{format(day, "EEE")}</span>
        <div class="relative flex items-center justify-center size-7">
          {#if isSelected}
            <!-- sliding background -->
            <div
              class="absolute inset-0 bg-primary rounded-full shadow-sm"
              in:receive={{ key: "active-day" }}
              out:send={{ key: "active-day" }}>
            </div>
          {:else}
            <!-- hover state for unselected days -->
            <div
              class="absolute inset-0 rounded-full transition-colors duration-200 group-hover:bg-muted">
            </div>
          {/if}

          <!-- date number above the sliding background -->
          <span
            class="relative z-10 text-md font-semibold transition-colors duration-300 {isSelected
              ? 'text-primary-foreground'
              : 'text-foreground'}">
            {format(day, "d")}
          </span>
        </div>
      </Button>
    {/each}
  </div>

  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    class="rounded-full dark:hover:bg-muted"
    onclick={() => onChangeWeek(1)}
    aria-label="Next week">
    <ChevronRight class="w-5 h-5 text-[9px]" />
  </Button>
</div>
