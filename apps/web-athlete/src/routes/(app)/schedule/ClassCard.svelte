<script lang="ts">
import { CircleAlert } from "@lucide/svelte";
import * as Avatar from "@ui/avatar";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import * as Card from "@ui/card";
import { Spinner } from "@ui/spinner";
import { cn } from "@ui-utils";
import { format } from "date-fns";
import { enhance } from "$app/forms";
import { globalClock } from "$lib/time.svelte";
import LateActionDialog from "./LateActionDialog.svelte";
import ParticipantsList from "./ParticipantsList.svelte";
import type { ClassCardProps } from "./types";

let {
  id,
  classType,
  startTime,
  duration = 60,
  capacity,
  confirmedBookingsCount,
  coachDisplayName = null,
  coachAvatarUrl = null,
  attendees = [],
  userStatus = null,
  openTime,
  waitlistTotal = 0,
  waitlistPosition = null,
  bookingOpensType = "immediately",
  cancellationWindowHours = 0,
  waitlistPolicy = "broadcast",
  color = null,
}: ClassCardProps = $props();

let cardColor = $derived(color || "#4E79A7");

let formElement: HTMLFormElement;
let isSubmitting = $state(false);
let showDesktopModal = $state(false);
let pendingAction = $state<"book" | "cancel" | null>(null);
let bypassWarning = false;

let classTime = $derived(new Date(startTime));
let openTimeDate = $derived(new Date(openTime));

// Calculate the late threshold
let cancelWindowMs = $derived((cancellationWindowHours || 0) * 60 * 60 * 1000);
let cutoffTime = $derived(new Date(classTime.getTime() - cancelWindowMs));
let isLateWindow = $derived(globalClock.now > cutoffTime);

let isPast = $derived(classTime < globalClock.now);
let isOpen = $derived(globalClock.now >= openTimeDate);
let isFull = $derived(capacity !== null && confirmedBookingsCount >= capacity);
let spotsLeft = $derived(
  capacity !== null ? capacity - confirmedBookingsCount : null,
);
let isBooked = $derived(userStatus === "confirmed");

let uiState = $derived.by(() => {
  if (isPast) return "past";
  if (userStatus === "confirmed") return "booked";
  if (userStatus === "waitlist") return "waitlisted";
  if (!isOpen) return "outside_window";
  if (isFull) return "waitlist_available";
  return "bookable";
});

let buttonText = $derived.by(() => {
  switch (uiState) {
    case "past":
      return "Finished";
    case "booked":
      return "Cancel";
    case "waitlisted":
      return waitlistPolicy === "auto_enroll"
        ? `Waitlist (${waitlistPosition ?? ""})`
        : "Leave waitlist";
    case "outside_window":
      return bookingOpensType === "rolling_days"
        ? `Opens ${openTimeDate.toLocaleTimeString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}`
        : "Locked";
    case "waitlist_available":
      return waitlistPolicy === "broadcast" && waitlistTotal > 0
        ? `Waitlist (${waitlistTotal} waiting)`
        : "Waitlist";
    case "bookable":
      return "Book";
    default:
      return "Unavailable";
  }
});

let formAction = $derived(
  uiState === "booked" || uiState === "waitlisted" ? "?/cancel" : "?/book",
);
let isDisabled = $derived(
  isSubmitting || uiState === "past" || uiState === "outside_window",
);

function handleAction(e: SubmitEvent) {
  if (bypassWarning || !isLateWindow) return;

  if (uiState === "booked" || uiState === "bookable") {
    e.preventDefault();
    pendingAction = uiState === "booked" ? "cancel" : "book";

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      const message =
        pendingAction === "cancel"
          ? "This is a late cancellation. You may incur a penalty. Proceed?"
          : "You are booking past the free cancellation window. If you cancel later, you may incur a penalty. Proceed?";

      if (window.confirm(message)) {
        bypassWarning = true;
        formElement.requestSubmit();
      }
    } else {
      showDesktopModal = true;
    }
  }
}

function confirmDesktopAction() {
  showDesktopModal = false;
  bypassWarning = true;
  formElement.requestSubmit();
}
</script>

<Card.Root
  data-booked={isBooked}
  style="--card-color: {cardColor}; border-left-color: {cardColor};"
  class={cn(
    "class-card overflow-hidden transition-all border-0 border-t-1 last:border-b-1 p-0 rounded",
    isBooked
      ? "bg-[color-mix(in_srgb,var(--card-color)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--card-color)_16%,transparent)]"
      : "hover:bg-[color-mix(in_srgb,var(--card-color)_10%,transparent)]",
  )}>
  <div
    class="card-inner relative
    grid grid-cols-[4rem_1fr_5rem] grid-rows-[auto_auto]
    p-3 pl-6.5 xs:pl-6 pb-4 gap-y-2">
    <div class="h-full absolute top-0 left-0 py-0">
      <div class="bg-[var(--card-color)] h-full w-1"></div>
    </div>

    <div
      class="class-time col-start-1 row-start-1 self-baseline justify-self-start space-y-2">
      <span class="text-md font-regular font-sans leading-none block">
        {format(classTime, "HH:mm")}
      </span>
    </div>

    <div
      class="title-plus-coach col-start-2 row-start-1 self-baseline space-y-2 space-x-2
      flex flex-row items-baseline">
      <h3 class="class-type text-lg font-semibold leading-none gap-2">
        {classType || "Workout"}
      </h3>

      <div class="coach gap-1.5 text-xs">
        <!-- <Avatar.Root class="h-4 w-4">
              <Avatar.Image src={coachAvatarUrl ?? undefined} alt="Coach" />
              <Avatar.Fallback class="text-[8px]">C</Avatar.Fallback>
            </Avatar.Root> -->
        <!-- <div class="bg-[var(--card-color)] h-2 w-2 rounded-full"></div> -->
        <span>{coachDisplayName || "Coach"}</span>
      </div>
    </div>

    <div
      class="action-button col-start-3 row-start-1 self-baseline justify-self-center
      relative w-20 space-y-1">
      <form
        class="shrink-0"
        bind:this={formElement}
        method="POST"
        action={formAction}
        onsubmit={handleAction}
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
            bypassWarning = false;
          };
        }}>
        <input type="hidden" name="classId" value={id} />
        <input
          type="hidden"
          name="actionType"
          value={isBooked ? "cancel" : "book"} />

        <Button
          type="submit"
          variant={isBooked
            ? "destructive"
            : spotsLeft === 0
              ? "secondary"
              : "default"}
          class="h-8 w-20 px-3 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50 rounded-[5px]"
          disabled={isDisabled}>
          {#if isSubmitting}
            <Spinner />
          {:else}
            {buttonText}
          {/if}
        </Button>
      </form>
    </div>

    <!-- <div
      class="duration col-start-1 row-start-2 self-baseline justify-self-start text-xs text-muted-foreground">
      {duration}
      min
    </div> -->

    <div
      id="attendance"
      class="col-start-2 col-span-2 row-start-2 self-baseline transition-all">
      <ParticipantsList
        {attendees}
        {confirmedBookingsCount}
        {capacity}
        {spotsLeft} />
    </div>

    {#if uiState === "bookable" && spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0}
      <div
        class="col-start-3 row-start-2 justify-self-center self-baseline
        flex flex-row items-center justify-center gap-1
        text-xs text-amber-600 animate-pulse">
        <CircleAlert class="w-3 h-3" />
        Few left
      </div>
    {/if}
  </div>
</Card.Root>

<LateActionDialog
  bind:open={showDesktopModal}
  action={pendingAction}
  onConfirm={confirmDesktopAction} />

<style>
:global(.class-card) {
  border-left-color: var(--card-color) !important;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

:global(.class-card:hover) {
  background-color: color-mix(
    in srgb,
    var(--card-color) 10%,
    transparent
  ) !important;
}

:global(.class-card[data-booked="true"]) {
  background-color: color-mix(
    in srgb,
    var(--card-color) 12%,
    transparent
  ) !important;
}

:global(.class-card[data-booked="true"]:hover) {
  background-color: color-mix(
    in srgb,
    var(--card-color) 16%,
    transparent
  ) !important;
}
</style>
