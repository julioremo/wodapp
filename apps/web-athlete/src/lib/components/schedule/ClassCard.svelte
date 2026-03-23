<script lang="ts">
import { enhance } from "$app/forms";
import { format } from "date-fns";
import { globalClock } from "@wodapp/core";
import { Check, CircleAlert, Users, X } from "lucide-svelte";
import * as Avatar from "$lib/components/ui/avatar";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Spinner } from "$lib/components/ui/spinner";
import * as Dialog from "$lib/components/ui/dialog";
import { cn } from "$lib/utils";
import type { Booking } from "@wodapp/types";

let { classData } = $props();

let formElement: HTMLFormElement;
let isSubmitting = $state(false);
let showDesktopModal = $state(false);
let pendingAction = $state<"book" | "cancel" | null>(null);
let bypassWarning = false;

let classTime = new Date(classData.start_time);
let openTime = new Date(classData.openTime);

// Calculate the late threshold
let cancelWindowMs = (classData.cancellationWindowHours || 0) * 60 * 60 * 1000;
let cutoffTime = new Date(classTime.getTime() - cancelWindowMs);
let isLateWindow = $derived(globalClock.now > cutoffTime);

let confirmedBookings = $derived(
  classData.bookings.filter((booking: Booking) => booking.status === "confirmed")
);

let isPast = $derived(classTime < globalClock.now);
let isOpen = $derived(globalClock.now >= openTime);
let isFull = $derived(
  classData.capacity !== null && classData.confirmed_bookings_count >= classData.capacity
);
let status = $derived(classData.userStatus);
let spotsLeft = $derived(classData.capacity - classData.confirmed_bookings_count);
let isBooked = $derived(status === "confirmed");

let uiState = $derived.by(() => {
  if (isPast) return "past";
  if (status === "confirmed") return "booked";
  if (status === "waitlist") return "waitlisted";
  if (!isOpen) return "outside_window";
  if (isFull) return "waitlist_available";
  return "bookable";
});

let buttonText = $derived.by(() => {
  if (isSubmitting) return "Processing...";

  switch (uiState) {
    case "past":
      return "Finished";
    case "booked":
      return "Cancel";
    case "waitlisted":
      return classData.waitlistPolicy === "auto_enroll"
        ? `Waitlist (${classData.waitlistPosition})`
        : "Leave waitlist";
    case "outside_window":
      return classData.bookingOpensType === "rolling_days"
        ? `Opens ${openTime.toLocaleTimeString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}`
        : "Locked";
    case "waitlist_available":
      return classData.waitlistPolicy === "broadcast" && classData.waitlistTotal > 0
        ? `Waitlist (${classData.waitlistTotal} waiting)`
        : "Waitlist";
    case "bookable":
      return "Book";
    default:
      return "Unavailable";
  }
});

let formAction = $derived(uiState === "booked" || uiState === "waitlisted" ? "?/cancel" : "?/book");
let isDisabled = $derived(isSubmitting || uiState === "past" || uiState === "outside_window");

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
  class={cn("overflow-hidden transition-all border-l-4 p-0 rounded", isBooked ? "bg-primary/5 border-l-destructive" : "hover:border-l-destructive")}>
  <div class="flex flex-col p-3 gap-3">
    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <h3 class="font-bold leading-none">{classData.classType || 'Workout'}</h3>
          <div class="flex items-center gap-1.5">
            <Avatar.Root class="h-4 w-4">
              <Avatar.Image src={classData.coach?.avatar_url} alt="Coach" />
              <Avatar.Fallback class="text-[8px]">C</Avatar.Fallback>
            </Avatar.Root>
            <span class="text-xs">{classData.coach?.display_name || 'Coach'}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge
            variant="outline"
            class={cn("text-[10px] h-4 px-1 text-primary border-primary", !isBooked && "invisible")}
            >Booked</Badge
          >
        </div>
      </div>

      <div class="text-right">
        <span class="text-lg font-bold font-mono tracking-tight leading-none block">
          {format(classTime, 'HH:mm')}
        </span>
      </div>
    </div>

    <div class="flex justify-between items-end pt-1">
      <div class="flex flex-row gap-1.5">
        <div class="flex -space-x-2 overflow-hidden pl-1">
          {#each confirmedBookings.slice(0, 6) as booking (booking.id || booking.profile_id)}
            <Avatar.Root class="h-6 w-6 border-2 border-background ring-1 ring-muted">
              <Avatar.Image src={booking.profile?.avatar_url} />
              <Avatar.Fallback class="text-[8px] bg-muted text-muted-foreground">U</Avatar.Fallback>
            </Avatar.Root>
          {/each}
          {#if confirmedBookings.length > 6}
            <div
              class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background ring-1 ring-muted">
              +{confirmedBookings.length - 6}
            </div>
          {/if}
        </div>

        <div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span class={spotsLeft === 0 ? "text-destructive" : ""}>
            {classData.confirmed_bookings_count}/{classData.capacity}
          </span>
          {#if spotsLeft <= 3 && spotsLeft > 0}
            <span class="flex items-center gap-0.5 text-amber-600 animate-pulse">
              <CircleAlert class="w-3 h-3" />
              Few left
            </span>
          {/if}
        </div>
      </div>

      <form
        bind:this={formElement}
        method="POST"
        action={formAction}
        onsubmit={handleAction}
        use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update();
        isSubmitting = false;
        bypassWarning = false; // Reset the gatekeeper
      };
    }}>
        <input type="hidden" name="classId" value={classData.id} />
        <input type="hidden" name="actionType" value={isBooked ? 'cancel' : 'book'} />

        <Button
          type="submit"
          size="sm"
          variant={isBooked ? "destructive" : (spotsLeft === 0 ? "secondary" : "default")}
          class="h-8 px-3 text-xs font-bold transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isDisabled}>
          {#if isSubmitting}
            <Spinner />
          {/if}
          {buttonText}
        </Button>
      </form>
    </div>
  </div>
</Card.Root>

<Dialog.Root bind:open={showDesktopModal}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {pendingAction === 'cancel' ? 'Late Cancellation' : 'Late Booking'}
      </Dialog.Title>
      <Dialog.Description>
        {pendingAction === 'cancel' 
          ? 'You are cancelling past the free cancellation window. This may result in a penalty on your account.' 
          : 'You are booking past the free cancellation window. If you secure this spot and cancel later, you may incur a penalty.'}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showDesktopModal = false}> Go Back </Button>
      <Button variant="default" onclick={confirmDesktopAction}> I Understand </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
