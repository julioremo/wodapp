<script lang="ts">
import { Button } from "@ui/button";
import { getAvailability } from "@wodapp/core";
import {
  addDays,
  addWeeks,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import AppHeader from "$lib/components/layout/AppHeader.svelte";
import { globalClock } from "$lib/time.svelte";
import type { PageData } from "./$types";
import ClassCard from "./ClassCard.svelte";
import FilterBar from "./FilterBar.svelte";
import ScrollHideHeader from "./ScrollHideHeader.svelte";
import type { ActiveScheduleFilters, ScheduledClass } from "./types";
import WeekNavigator from "./WeekNavigator.svelte";

let { data }: { data: PageData } = $props();

// --- Config ---
let hiddenDays = $derived(
  data.location?.settings?.schedulePrefs?.hiddenDays ??
    data.settings?.schedulePrefs?.hiddenDays ?? [0],
);

function getFirstValidDay(startDate: Date, hidden: number[]): Date {
  for (let i = 0; i < 7; i++) {
    const day = addDays(startDate, i);
    if (!hidden.includes(day.getDay())) {
      return day;
    }
  }
  return startDate;
}

// --- Time logic Config & State ---
const today = new Date();
const initialDate = (
  data.location?.settings?.schedulePrefs?.hiddenDays ??
  data.settings?.schedulePrefs?.hiddenDays ?? [0]
).includes(today.getDay())
  ? getFirstValidDay(startOfWeek(today, { weekStartsOn: 1 }), hiddenDays)
  : today;

let selectedDate = $state(initialDate);
let currentWeekStart = $state(startOfWeek(initialDate, { weekStartsOn: 1 }));

let activeFilters = $state<ActiveScheduleFilters>({
  selectedTypes: [],
  selectedCoaches: [],
  timeRange: [data.filterOptions.bounds.min, data.filterOptions.bounds.max],
});

// --- Time logic Derived
let monthYearLabel = $derived(format(selectedDate, "MMMM yyyy"));
// Only show days not in location.settings.schedulePrefs.hiddenDays
let visibleWeekDays = $derived(
  Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)).filter(
    (date) => !hiddenDays.includes(date.getDay()),
  ),
);

let weekClasses = $derived(
  (data.schedule || []).filter((c: ScheduledClass) => {
    const classTime = new Date(c.start_time);
    if (hiddenDays.includes(classTime.getDay())) return false;
    return (
      isAfter(classTime, subDays(currentWeekStart, 1)) &&
      isBefore(classTime, addDays(currentWeekStart, 7))
    );
  }),
);

let weekSchedule = $derived(
  visibleWeekDays.map((date) => {
    const totalDayClasses = (data.schedule || []).filter((c: ScheduledClass) =>
      isSameDay(new Date(c.start_time), date),
    );

    const filteredDayClasses = totalDayClasses.filter((c: ScheduledClass) => {
      // Class Type filter
      if (
        activeFilters.selectedTypes.length > 0 &&
        !activeFilters.selectedTypes.includes(c.class_type)
      )
        return false;
      // Coach filter
      if (
        activeFilters.selectedCoaches.length > 0 &&
        (!c.coach?.display_name ||
          !activeFilters.selectedCoaches.includes(c.coach.display_name))
      )
        return false;

      // Check if class mins from midnight not in Time range filter
      const classTime = new Date(c.start_time);
      const mins = classTime.getHours() * 60 + classTime.getMinutes();
      const range = activeFilters.timeRange;
      if (range && range[0] < range[1] && (mins < range[0] || mins > range[1]))
        return false;

      return true;
    });

    return {
      date,
      dateKey: `day-${format(date, "yyyy-MM-dd")}`,
      dateLabel: format(date, "EEEE, d MMM"),
      classes: filteredDayClasses,
      hasAnyScheduledClasses: totalDayClasses.length > 0,
    };
  }),
);

let availability = $derived.by(() => {
  const firstUpcomingClass = weekClasses.find(
    (c) => globalClock.now < new Date(c.start_time),
  );

  if (
    firstUpcomingClass?.bookingOpensType === "fixed_day" &&
    globalClock.now < new Date(firstUpcomingClass.openTime)
  )
    return getAvailability(firstUpcomingClass.openTime, globalClock.now);

  return null;
});

let classColorMap = $derived.by(() => {
  const map: Record<string, string> = {};
  const types =
    data.location?.settings?.classTypes ?? data.settings?.classTypes ?? [];
  for (const ct of types) {
    if (ct.name && ct.color) map[ct.name] = ct.color;
  }
  return map;
});

// --- Time logic Actions ---
function selectDate(date: Date) {
  if (hiddenDays.includes(date.getDay())) return;
  selectedDate = date;
  scrollToDay(date, "smooth");
}

// --- Scroll state + derived
const HEADER_TOP_OFFSET = 16;
let scrollContainer = $state<HTMLDivElement | null>(null);
let userHasScrolled = $state(false);
let hasInitialScrolled = false;
let appHeaderHeight = $state(0);
let totalHeaderHeight = $state(0);
let showScheduleTitle = $state(true);

let isProgrammaticScrolling = false;
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

// Calculate the active sticky height centrally so CSS and JS can both use it
let activeStickyHeight = $derived(
  userHasScrolled
    ? totalHeaderHeight - appHeaderHeight + HEADER_TOP_OFFSET
    : totalHeaderHeight,
);

// --- Scroll-related Actions ---
function scrollToDay(date: Date, behavior: ScrollBehavior = "smooth") {
  const dateStr = format(date, "yyyy-MM-dd");
  const target = document.getElementById(`day-${dateStr}`);

  if (!target) return;

  isProgrammaticScrolling = true;

  target.scrollIntoView({ behavior, block: "start" });

  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isProgrammaticScrolling = false;
  }, 750);
}

function handleScroll() {
  if (!isProgrammaticScrolling && !userHasScrolled) {
    userHasScrolled = true;
  }

  if (isProgrammaticScrolling || !scrollContainer) return;

  let activeDateKey: string | null = null;
  const sections = document.querySelectorAll<HTMLElement>(".day-section");
  const containerRect = scrollContainer.getBoundingClientRect();
  const detectionOffset = containerRect.top + activeStickyHeight + 50;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= detectionOffset) {
      activeDateKey = section.id.replace("day-", "");
    } else {
      break;
    }
  }

  if (!activeDateKey && sections.length > 0) {
    activeDateKey = sections[0].id.replace("day-", "");
  }

  // If scrolled near the bottom of the container, activate the last day
  if (
    scrollContainer.scrollTop + scrollContainer.clientHeight >=
    scrollContainer.scrollHeight - 50
  ) {
    const last = sections[sections.length - 1];
    if (last) {
      activeDateKey = last.id.replace("day-", "") || last.dataset.date || null;
    }
  }

  if (activeDateKey) {
    const matched = visibleWeekDays.find(
      (d) => format(d, "yyyy-MM-dd") === activeDateKey,
    );
    if (matched && !isSameDay(matched, selectedDate)) selectedDate = matched;
  }
}

function changeWeek(dir: -1 | 1) {
  const newStart =
    dir === 1 ? addWeeks(currentWeekStart, 1) : subWeeks(currentWeekStart, 1);
  currentWeekStart = newStart;
  selectedDate = getFirstValidDay(newStart, hiddenDays);
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
}

// --- Scroll Effects ---
// Timer for title swap
$effect(() => {
  const timer = setTimeout(() => {
    showScheduleTitle = false;
  }, 1000);
  return () => clearTimeout(timer);
});

$effect(() => {
  if (scrollContainer && !hasInitialScrolled && weekSchedule.length > 0) {
    hasInitialScrolled = true;
    if (!isSameDay(selectedDate, currentWeekStart)) {
      scrollToDay(selectedDate, "auto");
    }
  }
});

$effect(() => {
  if (!scrollContainer) return;
  const container = scrollContainer;

  const onScrollEnd = () => {
    isProgrammaticScrolling = false;
  };

  container.addEventListener("scrollend", onScrollEnd);
  return () => {
    container.removeEventListener("scrollend", onScrollEnd);
  };
});
</script>

<div
  bind:this={scrollContainer}
  onscroll={handleScroll}
  class="flex flex-col h-full bg-background overflow-y-auto scrollbar-none">
  <ScrollHideHeader
    {userHasScrolled}
    offset={HEADER_TOP_OFFSET}
    bind:topHeight={appHeaderHeight}
    bind:totalHeight={totalHeaderHeight}>
    {#snippet collapsible()}
      <AppHeader title={showScheduleTitle ? "Schedule" : monthYearLabel} />
    {/snippet}

    {#snippet sticky()}
      <WeekNavigator
        {selectedDate}
        {currentWeekStart}
        {hiddenDays}
        onSelectDate={selectDate}
        onChangeWeek={changeWeek} />

      <FilterBar
        filterOptions={data.filterOptions}
        classes={weekClasses}
        location={data.location ??
          (data.settings ? { settings: data.settings } : null)}
        onFilterChange={(f) => (activeFilters = f)} />
    {/snippet}
  </ScrollHideHeader>

  <div class="classcard-wrapper flex-1 px-0 pb-6 space-y-4">
    {#if !data.activeLocation}
      <div
        class="flex flex-col items-center justify-center h-[60vh] text-center p-8 space-y-4">
        <div
          class="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl">
          📍
        </div>
        <h2 class="text-xl font-bold">Find your box</h2>
        <p class="text-muted-foreground text-sm">
          You aren't a member of any gym yet. Here you'll see classes available
          at your active location.
        </p>
        <Button href="/search">Find a Gym</Button>
      </div>
    {:else}
      {#if availability}
        <div
          class="text-center p-3 bg-muted/50 rounded-lg border text-sm font-medium">
          {#if availability.type === "now"}
            Available now
          {:else if availability.type === "countdown"}
            Booking opens in {availability.minutes}m {availability.seconds}s
          {:else if availability.type === "today"}
            Booking opens today at {availability.timeStr}
          {:else if availability.type === "tomorrow"}
            Booking opens tomorrow at {availability.timeStr}
          {:else if availability.type === "this_week"}
            Booking opens {availability.dayStr} at {availability.timeStr}
          {:else if availability.type === "future"}
            Booking opens {availability.dateStr} at {availability.timeStr}
          {/if}
        </div>
      {/if}

      <div class="class-cards-container">
        {#each weekSchedule as day (day.dateKey)}
          <div
            id={day.dateKey}
            class="day-section space-y-2 pt-6"
            style="scroll-margin-top: {activeStickyHeight}px;">
            <div
              class="top-0 z-10 pl-6.5 py-1 rounded-full bg-background/95 backdrop-blur flex items-center justify-between">
              <span class="text-sm font-semibold text-foreground">
                {day.dateLabel}
              </span>
            </div>

            {#if day.classes.length === 0}
              <div
                class="text-center py-6 text-muted-foreground text-sm rounded-none border border-dashed">
                {#if day.hasAnyScheduledClasses}
                  <p>No classes match filters</p>
                {:else}
                  <p>Rest day 😴</p>
                  <p>No classes scheduled</p>
                {/if}
              </div>
            {:else}
              <div class="grid space-y-0">
                {#each day.classes as workout (workout.id)}
                  <ClassCard
                    id={workout.id}
                    classType={workout.class_type}
                    color={data.location?.settings?.classTypes?.find(
                      (ct) => ct.name === workout.class_type,
                    )?.color ??
                      classColorMap[workout.class_type] ??
                      workout.color}
                    startTime={workout.start_time}
                    duration={workout.duration}
                    capacity={workout.capacity}
                    confirmedBookingsCount={workout.confirmed_bookings_count}
                    coachDisplayName={workout.coach?.display_name}
                    coachAvatarUrl={workout.coach?.avatar_url}
                    attendees={workout.attendees}
                    userStatus={workout.userStatus}
                    openTime={workout.openTime}
                    waitlistTotal={workout.waitlistTotal}
                    waitlistPosition={workout.waitlistPosition}
                    bookingOpensType={workout.bookingOpensType}
                    cancellationWindowHours={workout.cancellationWindowHours}
                    waitlistPolicy={workout.waitlistPolicy} />
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
