<script lang="ts">
import { addWeeks, endOfWeek, format, getWeek, startOfWeek } from "date-fns";
import {
  Calendar,
  Calendar as CalendarIcon,
  ArrowLeft as ChevronLeft,
  ArrowRight as ChevronRight,
  Plus
} from "lucide-svelte";
import EditClassForm from "$lib/components/schedule/EditClassForm.svelte";
import ScheduleCard from "$lib/components/schedule/ScheduleCard.svelte";
import WeeklyGrid from "$lib/components/schedule/WeeklyGrid.svelte";
import { Button } from "$lib/components/ui/button";
import * as ButtonGroup from "$lib/components/ui/button-group";

let { data } = $props();

let currentDate = $state(new Date());
let currentMonday = $derived(startOfWeek(currentDate, { weekStartsOn: 1 }));

// --- DATE HELPERS ---
let weekRange = $derived.by(() => {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Format: "9–15 Feb" or "28 Feb – 5 Mar"
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d MMM")}`;
  }
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
});

let thisWeekClasses = $derived.by(() => {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });

  return data.classes.filter((c: any) => {
    const classDate = new Date(c.start_time);
    return classDate >= start && classDate <= end;
  });
});

// Actions
function nextWeek() {
  currentDate = addWeeks(currentDate, 1);
}
function prevWeek() {
  currentDate = addWeeks(currentDate, -1);
}
function goToday() {
  currentDate = new Date();
}
</script>

<div class="flex flex-col h-full gap-5 overflow-hidden p-6">
  <div class="flex items-center justify-between shrink-0">
    <h1 class="text-3xl tracking-tight text-foreground">
      <span class="font-bold inline-block"> Week {getWeek(currentDate, { weekStartsOn: 1 })} </span>
      <span>—</span>
      <span class="hidden lg:inline-block">{format(currentDate, "MMMM")}</span>
      <span>{format(currentDate, "yyyy")}</span>
    </h1>

    <div class="flex items-center justify-end gap-10">
      <div class="flex items-center gap-2 h-full">
        <div class="flex items-center gap-2 rounded-full border h-full px-1 bg-muted/20">
          <Button variant="default" size="icon" class="h-7 w-7 rounded-full" onclick={prevWeek}>
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <span class="text-xs min-w-[100px] text-center px-2">{weekRange}</span>

          <Button variant="default" size="icon" class="h-7 w-7 rounded-full" onclick={nextWeek}>
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onclick={goToday}
          class="text-muted-foreground hover:text-foreground rounded p-2 text-xs"
          >This week</Button
        >
      </div>

      <Button href="schedule/new" class="rounded-full text-xs">
        <Plus class="h-4 w-4" />Add New Schedule
      </Button>
    </div>
  </div>

  <div class="flex-1 min-h-0 relative">
    <WeeklyGrid
      visibleDayIndices={data.visibleDayIndices}
      classes={thisWeekClasses}
      weekStart={currentMonday}
      settings={data.settings}>
      {#snippet children({ item })}
        <ScheduleCard
          session={item}
          color={data.settings.classTypes.find((t: any) => t.name === item.class_type)?.color}>
          {#snippet children(close)}
            <EditClassForm
              data={{
                ...data.editForm,
                id: data.editForm.id + "-" + item.id,
                data: {
                  ...data.editForm.data,
                  id: item.id,
                  date: item.start_time.split("T")[0],
                  time: new Date(item.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                  class_type: item.class_type,
                  coach_id: item.coach_id,
                  program_id: item.program_id,
                  duration: (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000,
                  capacity: item.capacity
                }
              }}
              coaches={data.coaches}
              classTypes={data.activeClassTypes}
              programs={data.programs}
              updateActionUrl="/schedule?/updateClass"
              deleteActionUrl="/schedule?/deleteClass"
              onCancel={close} />
          {/snippet}
        </ScheduleCard>
      {/snippet}
    </WeeklyGrid>
  </div>
</div>
