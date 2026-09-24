<script lang="ts">
  import { CircleAlert } from "@lucide/svelte";
  import { Button } from "@ui/button";
  import * as Card from "@ui/card";
  import { Spinner } from "@ui/spinner";
  import { cn } from "@ui-utils";
  import { format } from "date-fns";
  import { enhance } from "$app/forms";
  import { globalClock } from "$lib/time.svelte";
  import {
    isCardActionDisabled,
    isFewSpotsLeft,
    isLessonFull,
    type PendingAction,
    resolveActionType,
    resolveButtonLabel,
    resolveCardState,
    resolveFormAction,
    resolveLateWindowConfirmation,
    resolveLessonTiming,
    resolveSpotsLeft,
  } from "./card-states";
  import {
    hueNameToClass,
    stateToButtonVariant,
    stateToCardClasses,
  } from "./card-theme";
  import LateActionDialog from "./LateActionDialog.svelte";
  import ParticipantList from "./ParticipantList.svelte";
  import type { LessonCardProps } from "./types";

  const DEFAULT_CARD_COLOR = "paper";

  let {
    id,
    lessonType,
    startTime,
    duration = 60,
    capacity,
    confirmedBookingsCount,
    coachDisplayName = null,
    coachAvatarUrl = null,
    showCoach = true,
    attendees = [],
    userStatus = null,
    openTime,
    waitlistTotal = 0,
    waitlistPosition = null,
    bookingOpensType = "immediately",
    cancellationWindowHours = 0,
    waitlistPolicy = "broadcast",
    lessonHue = DEFAULT_CARD_COLOR,
  }: LessonCardProps = $props();

  // --- Form & Dialog State ---
  let formElement: HTMLFormElement;
  let isSubmitting = $state(false);
  let showDesktopModal = $state(false);
  let pendingAction = $state<PendingAction | null>(null);
  let bypassWarning = false;

  // --- Timing & Capacity Calculations ---
  let timing = $derived(
    resolveLessonTiming({
      startTime,
      openTime,
      cancellationWindowHours,
      now: globalClock.now,
    }),
  );

  let spotsLeft = $derived(resolveSpotsLeft(capacity, confirmedBookingsCount));
  let isFull = $derived(isLessonFull(capacity, confirmedBookingsCount));

  // --- Card State Resolution ---
  let uiState = $derived(
    resolveCardState({
      isPast: timing.isPast,
      userStatus,
      isOpen: timing.isOpen,
      isFull,
    }),
  );

  let showFewSpotsLeft = $derived(isFewSpotsLeft(uiState, spotsLeft));

  // --- Actions & Presentation ---
  let formAction = $derived(resolveFormAction(uiState));
  let actionType = $derived(resolveActionType(uiState));
  let isDisabled = $derived(isCardActionDisabled(uiState, isSubmitting));
  let buttonText = $derived.by(() =>
    resolveButtonLabel(uiState, {
      waitlistPolicy,
      waitlistPosition,
      waitlistTotal,
      bookingOpensType,
      openTimeDate: timing.openTimeDate,
    }),
  );

  function handleAction(e: SubmitEvent) {
    if (bypassWarning) return;

    const confirmation = resolveLateWindowConfirmation(
      uiState,
      timing.isLateWindow,
    );
    if (!confirmation) return;

    e.preventDefault();
    pendingAction = confirmation.pendingAction;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      if (window.confirm(confirmation.message)) {
        bypassWarning = true;
        formElement.requestSubmit();
      }
    } else {
      showDesktopModal = true;
    }
  }

  function confirmDesktopAction() {
    showDesktopModal = false;
    bypassWarning = true;
    formElement.requestSubmit();
  }
</script>

<Card.Root
  data-confirmed={uiState === "confirmed"}
  class={cn(
    "lesson-card group overflow-hidden transition-all border-0 border-t-1 last:border-b-1 p-0 rounded",
    hueNameToClass(lessonHue),
    stateToCardClasses(uiState),
  )}
>
  <div
    class="card-inner relative
    grid grid-cols-[4rem_1fr_5rem] grid-rows-[auto_auto]
    p-3 pl-6.5 xs:pl-6 pb-4 gap-y-2"
  >
    <div class="card-edge h-full absolute top-0 left-0 py-0">
      <div class="bg-[var(--card-hue)] h-full w-1"></div>
    </div>
    <div
      class="class-time col-start-1 row-start-1 self-baseline justify-self-start space-y-2"
    >
      <span class="text-md font-regular font-sans leading-none block">
        {format(timing.classTime, "HH:mm")}
      </span>
    </div>

    <div
      class="title-plus-coach col-start-2 row-start-1 self-baseline space-y-2 space-x-2
      flex flex-row items-baseline"
    >
      <h3 class="class-type text-lg font-semibold leading-none gap-2">
        {lessonType || "Workout"}
      </h3>

      {#if showCoach}
        <div class="coach gap-1.5 text-xs text-muted-foreground">
          <!-- <Avatar.Root class="h-4 w-4">
                <Avatar.Image src={coachAvatarUrl ?? undefined} alt="Coach" />
                <Avatar.Fallback class="text-[8px]">C</Avatar.Fallback>
              </Avatar.Root> -->
          <!-- <div class="bg-[var(--card-hue)] h-2 w-2 rounded-full"></div> -->
          <span>{coachDisplayName || "Coach"}</span>
        </div>
      {/if}
    </div>

    <div
      class="action-button col-start-3 row-start-1 self-baseline justify-self-center
      relative w-20 space-y-1"
    >
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
        }}
      >
        <input type="hidden" name="classId" value={id} />
        <input type="hidden" name="actionType" value={actionType} />

        <Button
          type="submit"
          variant={stateToButtonVariant(uiState)}
          class={cn(
            "h-8 w-20 px-3 transition-all cursor-pointer disabled:cursor-not-allowed rounded-[5px]",
          )}
          disabled={isDisabled}
        >
          {#if isSubmitting}
            <Spinner />
          {:else}
            {buttonText}
          {/if}
        </Button>
      </form>
    </div>

    <!-- TODO <div
      class="duration col-start-1 row-start-2 self-baseline justify-self-start text-xs text-muted-foreground">
      {duration}
      min
    </div> -->

    <div
      id="attendance"
      class="col-start-2 col-span-2 row-start-2 self-baseline transition-all"
    >
      <ParticipantList
        {attendees}
        {confirmedBookingsCount}
        {capacity}
        {spotsLeft}
      />
    </div>

    {#if showFewSpotsLeft}
      <div
        class="col-start-3 row-start-2 justify-self-center self-baseline
        flex flex-row items-center justify-center gap-1
        text-xs text-amber-600 animate-pulse"
      >
        <CircleAlert class="w-3 h-3" />
        Few left
      </div>
    {/if}
  </div>
</Card.Root>

<LateActionDialog
  bind:open={showDesktopModal}
  action={pendingAction}
  onConfirm={confirmDesktopAction}
/>
