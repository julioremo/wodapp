<script lang="ts">
  import {
    CalendarDate,
    type DateValue,
    getLocalTimeZone,
    today,
  } from "@internationalized/date";
  import { format } from "date-fns";
  import { replaceState } from "$app/navigation";
  import { page } from "$app/state";
  import BackButton from "$lib/components/BackButton.svelte";
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import { Spinner } from "@ui/spinner";
  import type { AttendanceItem } from "../types";
  import type { PageData } from "./$types";
  import AttendanceCalendar from "./AttendanceCalendar.svelte";

  let { data }: { data: PageData } = $props();

  // --- Bookings State & Caching ---
  // svelte-ignore state_referenced_locally
  let bookings = $state<AttendanceItem[]>(data.initialBookings ?? []);
  // svelte-ignore state_referenced_locally
  let loadedMonths = $state<Set<string>>(
    new Set(data.initialLoadedMonths ?? []),
  );
  let isLoadingMonth = $state(false);

  function addBookings(items: AttendanceItem[]) {
    const existingIds = new Set(bookings.map((b) => b.id));
    const newItems = items.filter((item) => !existingIds.has(item.id));
    if (newItems.length > 0) {
      bookings = [...bookings, ...newItems];
    }
  }

  // Populate initial bookings
  $effect.pre(() => {
    if (data.initialBookings && data.initialBookings.length > 0) {
      addBookings(data.initialBookings);
    }
  });

  // --- Calendar Date Values ---
  const todayDate = today(getLocalTimeZone());

  // Parse initial target month
  function getInitialDateValue(targetMonthStr: string): CalendarDate {
    const parts = targetMonthStr.split("-").map(Number);
    if (
      parts.length === 2 &&
      !Number.isNaN(parts[0]) &&
      !Number.isNaN(parts[1])
    ) {
      return new CalendarDate(parts[0], parts[1], 1);
    }
    return todayDate;
  }

  // svelte-ignore state_referenced_locally
  const initialDate = getInitialDateValue(
    data.targetMonth ?? format(new Date(), "yyyy-MM"),
  );
  let placeholder = $state<DateValue>(initialDate);

  // Initially undefined so legend is shown until user clicks a day
  let value = $state<DateValue | undefined>(undefined);

  // Lower bound: user joined date
  const minValue = $derived.by(() => {
    if (!data.membershipJoinedAt) return undefined;
    const joined = new Date(data.membershipJoinedAt);
    if (Number.isNaN(joined.getTime())) return undefined;
    return new CalendarDate(joined.getFullYear(), joined.getMonth() + 1, 1);
  });

  // Class types from gym settings
  const classTypes = $derived(data.settings?.classTypes ?? []);

  // --- Subsequent Month Fetching ---
  async function loadMonth(monthStr: string) {
    if (loadedMonths.has(monthStr) || !data.activeLocation?.id) return;
    isLoadingMonth = true;
    try {
      const res = await fetch(
        `/schedule/calendar/api?month=${monthStr}&locationId=${data.activeLocation.id}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json.bookings) {
          addBookings(json.bookings);
        }
        loadedMonths.add(monthStr);
      }
    } catch (err) {
      console.error("Failed to load month bookings:", err);
    } finally {
      isLoadingMonth = false;
    }
  }

  // Monthly summary info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth = $derived(
    placeholder.year === currentYear && placeholder.month === currentMonth,
  );
  const currentMonthDate = $derived(placeholder.toDate(getLocalTimeZone()));
  const currentMonthName = $derived(format(currentMonthDate, "MMMM"));

  const currentMonthBookingsCount = $derived.by(() => {
    let count = 0;
    for (const item of bookings) {
      const dateStr = format(new Date(item.startTime), "yyyy-MM");
      const targetStr = `${placeholder.year}-${String(placeholder.month).padStart(2, "0")}`;
      if (dateStr === targetStr) {
        count += 1;
      }
    }
    return count;
  });
</script>

{#snippet bookingCount(count: number = currentMonthBookingsCount)}
  <strong class="font-medium text-foreground text-nowrap">
    {count}
    {count === 1 ? "class" : "classes"}
  </strong>
{/snippet}

<div class="flex flex-col h-full bg-card overflow-y-auto scrollbar-none">
  <AppHeader title="Attendance Calendar" class="bg-card sticky top-0">
    {#snippet left()}
      <BackButton backUrl="/schedule" />
    {/snippet}
  </AppHeader>

  <div class="flex flex-col items-start justify-center w-full px-4 space-y-10">
    <!-- Natural Language Monthly Booking Summary -->
    <div
      class="booking-summary flex items-center justify-between w-full px-8 pt-3 font-serif font-light"
    >
      <p class="text-md text-muted-foreground">
        {#if isCurrentMonth}
          This month you have booked a total of {@render bookingCount()}.
        {:else}
          In {currentMonthName} you booked a total of {@render bookingCount()} in
          total.
        {/if}
      </p>
      {#if isLoadingMonth}
        <Spinner class="size-4 text-muted-foreground animate-spin shrink-0" />
      {/if}
    </div>

    <AttendanceCalendar
      bind:placeholder
      bind:value
      {minValue}
      {bookings}
      {classTypes}
      {isLoadingMonth}
    />
  </div>
</div>
