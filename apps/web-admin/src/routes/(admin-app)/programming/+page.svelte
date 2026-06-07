<script lang="ts">
import { ChevronLeft, ChevronRight, Plus } from "@lucide/svelte";
import { Button } from "@ui/button";
import * as DropdownMenu from "@ui/dropdown-menu";
import { addDays, format, isSameDay } from "date-fns";
import ProgramCell from "$lib/components/programming/ProgramCell.svelte";

let { data } = $props();
const today = new Date();

// Track manually opened cells
let manualCells = $state<Record<string, string[]>>({});

function getDateForColumn(dayIndex: number) {
  const baseDate = typeof data.weekStart === "string" ? new Date(data.weekStart) : data.weekStart;
  const offset = (dayIndex + 6) % 7;
  return addDays(baseDate, offset);
}

function addClassTypeToDay(dateStr: string, class_type: string) {
  if (!manualCells[dateStr]) manualCells[dateStr] = [];
  if (!manualCells[dateStr].includes(class_type)) {
    manualCells[dateStr] = [...manualCells[dateStr], class_type];
  }
}

function isClassTypeScheduled(dateStr: string, class_type: string) {
  return data.daysMap[dateStr]?.[class_type]?.isScheduled ?? false;
}

// Get active class_types for a day (Scheduled + Manually Added), sorted by config
function getActiveClassTypes(dateStr: string) {
  const scheduledClassTypes = Object.keys(data.daysMap[dateStr] || {});
  const manuallyAdded = manualCells[dateStr] || [];
  // Deduplicate:
  const combined = Array.from(new Set([...scheduledClassTypes, ...manuallyAdded]));

  const classTypeSortingMap = new Map(
    data.settings.classTypes.map((ct: any, index: number) => [ct.name, index])
  );

  return combined.sort((a, b) => {
    const iA = classTypeSortingMap.get(a) ?? 999;
    const iB = classTypeSortingMap.get(b) ?? 999;
    // If indices are different, sort by index. Otherwise, sort alphabetically.
    return iA - iB || a.localeCompare(b);
  });
}

function handleDeleted(dateStr: string, class_type: string) {
  if (!isClassTypeScheduled(dateStr, class_type)) {
    // Remove it from our manual UI state so it vanishes instantly
    if (manualCells[dateStr]) {
      manualCells[dateStr] = manualCells[dateStr].filter((t) => t !== class_type);
    }
  }
}
</script>

<div class="flex flex-col h-full gap-5 overflow-hidden p-6 bg-neutral-50">
  <div class="flex items-center justify-between shrink-0">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Programming</h1>
      <!-- <p class="text-sm text-muted-foreground">Weekly block editor</p> -->
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        href="?date={format(addDays(data.weekStart, -7), 'yyyy-MM-dd')}">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="font-mono font-medium w-32 text-center text-sm">
        {format(data.weekStart, "d MMM")}- {format(data.weekEnd, "d MMM")}
      </span>
      <Button
        variant="outline"
        size="icon"
        href="?date={format(addDays(data.weekStart, 7), 'yyyy-MM-dd')}">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>

  <!-- TODO: review snap behavior on mobile -->
  <div class="flex-1 overflow-x-auto overflow-y-hidden flex h-full snap-x snap-proximity">
    {#each data.visibleDayIndices as dayIndex}
      {@const dayDate = getDateForColumn(dayIndex)}
      {@const dateStr = format(dayDate, "yyyy-MM-dd")}
      {@const isToday = isSameDay(dayDate, today)}
      {@const activeClassTypes = getActiveClassTypes(dateStr)}
      {@const unprogrammedClassTypes = data.availableProgrammableTypes.filter((t: string) => !activeClassTypes.includes(t))}

      <div class="flex flex-col w-[280px] shrink-0 h-full snap-start {isToday && 'bg-primary/5'}">
        <div class="p-3 text-left border-b bg-background/95 backdrop-blur z-10 sticky top-0">
          <span class="font-semibold text-sm {isToday ? 'text-primary' : 'text-foreground'}">
            {format(dayDate, "EEEE")}
          </span>
          <span class="text-xs {isToday ? 'text-primary/80' : 'text-muted-foreground'}">
            {format(dayDate, "d MMM")}
          </span>
        </div>

        <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-7">
          {#each activeClassTypes as class_type}
            {#key `${dateStr}-${class_type}`}
              <ProgramCell
                {class_type}
                programs={data.daysMap[dateStr]?.[class_type]?.programs || []}
                date={dayDate}
                isScheduled={isClassTypeScheduled(dateStr, class_type)}
                onDelete={() => handleDeleted(dateStr, class_type)} />
            {/key}
          {/each}

          {#if unprogrammedClassTypes.length > 0}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="ghost"
                    class="w-full font-mono text-muted-foreground border-dashed border-2 hover:border-primary bg-transparent hover:bg-muted/50 mt-2 font-semibold">
                    <Plus class="w-4 h-4 mr-2" />
                    Add program type
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {#each unprogrammedClassTypes as class_type}
                  <DropdownMenu.Item onclick={() => addClassTypeToDay(dateStr, class_type)}>
                    {class_type}
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
