<script lang="ts">
  import {
    type DateValue,
    endOfMonth,
    getLocalTimeZone,
    parseDate,
    today,
  } from "@internationalized/date";
  import Calendar from "@ui/calendar/calendar.svelte";
  import CalendarDay from "@ui/calendar/calendar-day.svelte";
  import { cn } from "@ui-utils";
  import { hueNameToClass, PALETTE } from "@wodapp/core";
  import { format } from "date-fns";
  import type { AttendanceItem } from "../types";

  let {
    placeholder = $bindable(),
    value = $bindable(),
    minValue,
    maxValue: maxValueProp,
    bookings = [],
    classTypes = [],
    isLoadingMonth = false,
  }: {
    placeholder: DateValue;
    value?: DateValue;
    minValue?: DateValue;
    maxValue?: DateValue;
    bookings?: AttendanceItem[];
    classTypes?: Array<{ name: string; color?: string; isActive?: boolean }>;
    isLoadingMonth?: boolean;
  } = $props();

  const maxValue = $derived.by(() => {
    if (maxValueProp) return maxValueProp;
    if (bookings.length === 0) return undefined;
    let latestTime = -Infinity;
    let latestItem: AttendanceItem | null = null;
    for (const b of bookings) {
      const t = new Date(b.startTime).getTime();
      if (!isNaN(t) && t > latestTime) {
        latestTime = t;
        latestItem = b;
      }
    }
    if (!latestItem) return undefined;
    const dateStr = format(new Date(latestItem.startTime), "yyyy-MM-dd");
    try {
      return endOfMonth(parseDate(dateStr));
    } catch {
      return undefined;
    }
  });

  const bookingsByDate = $derived.by(() => {
    const map: Record<string, AttendanceItem[]> = {};
    for (const item of bookings) {
      const key = format(new Date(item.startTime), "yyyy-MM-dd");
      if (!map[key]) {
        map[key] = [];
      }
      if (!map[key].some((b) => b.id === item.id)) {
        map[key].push(item);
      }
    }
    return map;
  });

  function getLessonHue(classType: string): string {
    const configured = classTypes.find((ct) => ct.name === classType)?.color;
    if (configured) return configured;
    // Deterministic fallback to PALETTE from @wodapp/core
    let hash = 0;
    for (let i = 0; i < classType.length; i++) {
      hash = classType.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
  }

  const todayDate = today(getLocalTimeZone());

  // Track if user has clicked a day to switch from legend to day details
  const hasUserClickedDay = $derived(!!value);
  let calendarWidth = $state<number>(0);
  let calendarContainer = $state<HTMLElement>();

  function handleDocumentClick(e: MouseEvent) {
    if (!value) return;
    if (!calendarContainer) return;
    const path = e.composedPath();
    if (path.includes(calendarContainer)) return;
    value = undefined;
  }

  // Selected day details
  const selectedDate = $derived(value?.toDate(getLocalTimeZone()) ?? null);
  const selectedDateKey = $derived(
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
  );
  const selectedDayBookings = $derived(
    selectedDateKey ? (bookingsByDate[selectedDateKey] ?? []) : [],
  );
  const selectedDateLabel = $derived(
    selectedDate ? format(selectedDate, "EEEE, d MMMM") : "Select a day",
  );

  // Legend class types (only lesson types present in bookings for current month in view)
  const legendTypes = $derived.by(() => {
    const typesSet = new Set<string>();

    for (const [dateStr, list] of Object.entries(bookingsByDate)) {
      const [y, m] = dateStr.split("-").map(Number);
      if (y === placeholder.year && m === placeholder.month) {
        for (const b of list) {
          if (b.type) {
            typesSet.add(b.type);
          }
        }
      }
    }
    return Array.from(typesSet).sort();
  });
</script>

{#snippet classSpot(type: string, className?: string, title?: string)}
  <span
    class={cn(
      "size-2 rounded-full shrink-0 bg-[var(--spot)]",
      hueNameToClass(getLessonHue(type)),
      className,
    )}
    {title}
  >
  </span>
{/snippet}

<svelte:document onclick={handleDocumentClick} />

<div class="flex flex-col items-center w-full">
  <div
    class="flex flex-col items-start w-fit max-w-full space-y-1"
    style={calendarWidth ? `width: ${calendarWidth}px` : undefined}
  >
    <div
      bind:this={calendarContainer}
      bind:clientWidth={calendarWidth}
      class="w-fit mx-auto"
    >
      <Calendar
        type="single"
        bind:placeholder
        bind:value
        preventDeselect={false}
        weekStartsOn={1}
        {minValue}
        {maxValue}
        navButtonClass="hover:bg-transparent dark:hover:bg-transparent"
        class="bg-transparent w-fit h-fit m-auto [--cell-size:--spacing(10)] [&_header]:text-base [&_cell]:rounded-none"
      >
        {#snippet day({ day, outsideMonth })}
          {@const dateKey = `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`}
          {@const dayBookings = bookingsByDate[dateKey] ?? []}
          {@const isCurrentDay =
            !outsideMonth &&
            day.year === todayDate.year &&
            day.month === todayDate.month &&
            day.day === todayDate.day}
          {@const isSelected =
            !!value &&
            day.year === value.year &&
            day.month === value.month &&
            day.day === value.day}

          <CalendarDay
            class={cn(
              "flex flex-col items-center justify-start py-1.5 relative h-11 w-1/1 aspect-square border-none group",
              "[&[data-today]:not([data-selected])]:bg-muted [&[data-today]:not([data-selected])]:text-foreground",
              "data-[selected]:bg-secondary data-[selected]:text-secondary-foreground",
              "[&>span]:opacity-100",
              "rounded-none data-[selected]:rounded-none",
            )}
          >
            <span
              class={cn(
                "text-base font-medium leading-none",
                isSelected && "text-primary-foreground",
                "group-data-[selected]:text-primary-foreground",
              )}
            >
              {day.day}
            </span>
            {#if !outsideMonth && dayBookings.length > 0}
              <div
                class="flex gap-1 pb-1 flex-wrap justify-center w-full px-0.5"
              >
                {#each dayBookings as booking (booking.id)}
                  {@render classSpot(
                    booking.type,
                    "size-1.5 ring-1 ring-background/20",
                    `${booking.type}${booking.coachName ? ` with ${booking.coachName}` : ""} (${format(new Date(booking.startTime), "HH:mm")})`,
                  )}
                {/each}
              </div>
            {/if}
          </CalendarDay>
        {/snippet}
      </Calendar>
    </div>

    <!-- Legend (shown until a day is clicked) OR Day Details (shown once a day is clicked) -->
    <div
      class="rounded-[7px] border bg-background w-full py-4 px-6 shadow-[inset_0_6px_6px_rgba(0,0,0,0.25)] dark:shadow-[inset_0_6px_6px_rgba(0,0,0,0.5)"
    >
      {#if !hasUserClickedDay}
        {#if legendTypes.length > 0}
          <div
            class="legend flex flex-wrap items-center justify-center gap-x-4 gap-y-2 w-full"
          >
            {#each legendTypes as type}
              <div
                class="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                {@render classSpot(type)}
                <span class="truncate">{type}</span>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="w-full space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-foreground">
              {selectedDateLabel}
            </h3>
            {#if selectedDayBookings.length > 0}
              <span class="text-xs text-muted-foreground">
                {selectedDayBookings.length}
                {selectedDayBookings.length === 1 ? "class" : "classes"}
              </span>
            {/if}
          </div>

          {#if selectedDayBookings.length === 0}
            <p class="text-sm text-muted-foreground py-1.5">
              No classes booked on this day.
            </p>
          {:else}
            <div class="space-y-1">
              {#each selectedDayBookings as booking (booking.id)}
                <div class="flex items-center justify-between text-sm py-1.5">
                  <div class="flex items-center gap-2">
                    {@render classSpot(booking.type)}
                    <span class="font-medium text-foreground">
                      {booking.type}{booking.coachName
                        ? ` with ${booking.coachName}`
                        : ""}
                    </span>
                  </div>
                  <span class="text-muted-foreground font-mono text-xs">
                    {format(new Date(booking.startTime), "HH:mm")}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
