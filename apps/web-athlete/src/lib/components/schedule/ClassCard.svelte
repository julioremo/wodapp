<script lang="ts">
import { format } from "date-fns";
import { CircleAlert, Clock, Users } from "lucide-svelte";
import { enhance } from "$app/forms";
import * as Avatar from "$lib/components/ui/avatar";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { cn } from "$lib/utils";

let { classData } = $props();

let isSubmitting = $state(false);

let startTime = $derived(new Date(classData.start_time));
let capacity = $derived(classData.capacity);
let confirmedCount = $derived(classData.confirmedCount);
let spotsLeft = $derived(capacity ? capacity - confirmedCount : null);
let confirmedBookings = $derived(
  (classData.bookings || []).filter((b: any) => b.status === "confirmed")
);

let isCanceling = $derived(classData.uiState === "booked" || classData.uiState === "waitlist");
let formAction = $derived(isCanceling ? "?/cancel" : "?/book");
let isDisabled = $derived(
  classData.uiState === "past" || classData.uiState === "outside_window" || isSubmitting
);

let cardBorder = $derived(
  classData.uiState === "booked"
    ? "border-l-primary bg-primary/5"
    : classData.uiState === "waitlist"
      ? "border-l-amber-500 bg-amber-500/5"
      : "border-l-muted hover:border-l-primary/50"
);

let buttonVariant: "default" | "secondary" | "outline" = $derived(
  isCanceling ? "outline" : classData.uiState === "waitlist_available" ? "secondary" : "default"
);
</script>

<Card.Root class={cn("overflow-hidden transition-all border-l-4 p-0 rounded", cardBorder)}>
  <div class="flex flex-col p-3 gap-3">
    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <h3 class="font-bold leading-none">{classData.class_type || 'Workout'}</h3>

          <div class="flex items-center gap-1.5">
            <Avatar.Root class="h-4 w-4">
              <Avatar.Image src={classData.coach?.avatar_url} alt="Coach" />
              <Avatar.Fallback class="text-[8px]">C</Avatar.Fallback>
            </Avatar.Root>
            <span class="text-xs">{classData.coach?.display_name || 'Coach'}</span>
          </div>
        </div>
      </div>

      <div class="text-right">
        <span class="text-lg font-bold font-mono tracking-tight leading-none block">
          {format(startTime, 'HH:mm')}
        </span>
      </div>
    </div>

    <div class="flex justify-between items-end pt-1">
      <div class="flex flex-row gap-1.5">
        <div class="flex -space-x-2 overflow-hidden pl-1">
          {#each confirmedBookings.slice(0, 6) as booking (booking.id)}
            <Avatar.Root class="h-6 w-6 border-2 border-background ring-1 ring-muted">
              <Avatar.Image src={booking.profile?.avatar_url} />
              <Avatar.Fallback class="text-[8px] bg-muted text-muted-foreground">U</Avatar.Fallback>
            </Avatar.Root>
          {/each}

          {#if confirmedBookings.length > 6}
            <div
              class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background ring-1 ring-muted z-10">
              +{confirmedBookings.length - 6}
            </div>
          {/if}
        </div>

        <div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground ml-2">
          <span class={spotsLeft === 0 ? "text-destructive" : ""}>
            {confirmedCount}{capacity ? `/${capacity}` : ''}
          </span>

          {#if spotsLeft && spotsLeft <= 3 && spotsLeft > 0}
            <span class="flex items-center gap-0.5 text-amber-600 animate-pulse ml-2">
              <CircleAlert class="w-3 h-3" />
              Few left
            </span>
          {/if}
        </div>

        {#if classData.uiState === 'waitlisted'}
          <span class="text-xs font-semibold text-amber-600 flex items-center gap-1 ml-2">
            <Clock class="w-3.5 h-3.5" />
            On Waitlist
          </span>
        {/if}
      </div>

      <form
        method="POST"
        action={formAction}
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
          };
        }}>
        <input type="hidden" name="classId" value={classData.id} />

        <Button
          type="submit"
          size="sm"
          variant={buttonVariant}
          class="h-8 px-3 text-xs font-bold transition-all shadow-sm"
          disabled={isDisabled}>
          {#if isSubmitting}
            Loading...
          {:else}
            {classData.buttonText}
          {/if}
        </Button>
      </form>
    </div>
  </div>
</Card.Root>
