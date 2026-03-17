<!-- TODO: make sure today's column is shaded. RN columns don't exist  -->
<script lang="ts">
import type { GymSettings } from "@wodapp/types";
import { addDays, format, isSameDay } from "date-fns";
import type { Snippet } from "svelte";
import { SCHEDULE_GRID_CONFIG as config } from "$lib/config/schedule";
import { cn } from "$lib/utils";

let {
  visibleDayIndices,
  classes = [],
  weekStart = new Date(),
  settings,
  children
} = $props<{
  visibleDayIndices: number[];
  classes: any[];
  weekStart?: Date;
  settings: GymSettings;
  children: Snippet<[{ item: any }]>;
}>();

const today = new Date();
const startHour = settings.startHour || 0;
const endHour = settings.endHour || 24;

function getDateForColumn(dayIndex: number) {
  const offset = (dayIndex + 6) % 7;
  return addDays(weekStart, offset);
}

function getPositionStyle(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  const h = start.getHours();
  const m = start.getMinutes();
  const minutesFromStart = (h - startHour) * 60 + m;

  return `
        top: ${minutesFromStart * config.pixelPerMinute}px; 
        height: ${durationMinutes * config.pixelPerMinute}px;
      `;
}
</script>

<div class="border rounded-xl bg-background flex flex-col h-full overflow-hidden shadow-sm">
  <div class="flex border-b divide-x bg-muted/40 overflow-hidden shrink-0">
    <div class="w-16 shrink-0 border-r bg-background z-20"></div>

    <div class="flex flex-1 overflow-hidden">
      {#each visibleDayIndices as dayIndex}
        {@const colDate = getDateForColumn(dayIndex)}
        {@const isToday = isSameDay(colDate, today)}
        <div
          class="flex-1 min-w-[140px] py-3 text-center text-sm font-semibold text-muted-foreground {isToday
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground'}">
          {format(colDate, "EEE d")}
        </div>
      {/each}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto overflow-x-auto relative">
    <div class="flex min-w-max">
      <div
        class="w-16 shrink-0 bg-background text-[10px] text-muted-foreground border-r sticky left-0 z-10">
        {#each Array(endHour - startHour + 1) as _, i}
          {@const hour = startHour + i}
          <div
            class="absolute w-full text-right pr-2 -mt-1.5"
            style="top: {i * 60 * config.pixelPerMinute}px">
            {hour.toString().padStart(2, "0")}:00
          </div>
        {/each}
      </div>

      {#each visibleDayIndices as dayIndex}
        {@const isToday = isSameDay(getDateForColumn(dayIndex), today)}

        <div
          class={cn("flex-1 min-w-[140px] relative border-r-2 border-ink-100 group", isToday && "bg-slate-50")}>
          {#each Array(endHour - startHour) as _, i}
            <div
              class="absolute w-full border-t-[0.5px] border-ink-100"
              style="top: {i * 60 * config.pixelPerMinute}px"></div>
          {/each}

          {#each classes.filter((c) => new Date(c.start_time).getDay() === dayIndex) as session (session.id)}
            <div
              class="absolute inset-x-0.5 z-10 py-[1px]"
              style={getPositionStyle(session.start_time, session.end_time)}>
              {@render children({ item: session })}
            </div>
          {/each}
        </div>
      {/each}
    </div>
    {#if classes.length === 0}
      <div
        class="absolute z-0 flex flex-col items-center justify-center pointer-events-none w-full h-full">
        <div
          class="bg-background/80 backdrop-blur-[2px] p-6 rounded-xl text-center opacity-70 text-red-100 w-4/5">
          <p class="text-8xl font-semibold">No classes<br />this week.</p>
        </div>
      </div>
    {/if}
  </div>
</div>
