<script lang="ts">
import { ChevronDown } from "@lucide/svelte";
import * as Avatar from "@ui/avatar";
import { cn } from "@ui-utils";
import type { LessonAttendee } from "./types";

interface Props {
  attendees?: LessonAttendee[];
  capacity: number | null;
  confirmedBookingsCount: number;
  spotsLeft: number | null;
  maxVisible?: number;
  class?: string;
}

let {
  attendees = [],
  capacity,
  confirmedBookingsCount,
  spotsLeft,
  maxVisible = 4,
  class: className = "",
}: Props = $props();

let isOpen = $state(false);

let visibleAttendees = $derived(attendees.slice(0, maxVisible));
let overflowCount = $derived(Math.max(0, attendees.length - maxVisible));
let hasAttendees = $derived(attendees.length > 0);
</script>

<div class={cn("participants align-baseline", className)}>
  <button
    type="button"
    class={cn(
      "participants-summary inline-flex items-center gap-1.5 text-xs text-left bg-transparent border-0 p-0 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default",
      hasAttendees ? "cursor-pointer group" : "cursor-default",
    )}
    onclick={() => {
      if (hasAttendees) isOpen = !isOpen;
    }}
    aria-expanded={hasAttendees ? isOpen : undefined}
    aria-label={hasAttendees
      ? "Toggle participants list"
      : "Participants count"}
    disabled={!hasAttendees}>
    {#if visibleAttendees.length > 0}
      <span class="inline-flex -space-x-2 align-middle">
        {#each visibleAttendees as attendee (attendee.id)}
          <Avatar.Root
            class="inline-block size-6 border-2 border-background shrink-0">
            <Avatar.Image
              src={attendee.avatarUrl ?? undefined}
              alt={attendee.name ?? "Attendee"} />
            <Avatar.Fallback
              class="text-[8px] bg-muted text-muted-foreground font-semibold">
              {(attendee.name ?? "U").slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        {/each}
        {#if overflowCount > 0}
          <span
            class="size-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-1 border-background shrink-0 font-medium">
            +{overflowCount}
          </span>
        {/if}
      </span>
    {/if}

    <span
      class={cn(
        "capacity-indicator inline-flex items-center gap-1 text-xs font-medium shrink-0 transition-colors",
        spotsLeft === 0
          ? "text-destructive"
          : "text-muted-foreground group-hover:text-foreground",
      )}>
      {#if capacity !== null}
        {confirmedBookingsCount}/{capacity}
      {/if}
      {#if hasAttendees}
        <ChevronDown
          class={cn(
            "size-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )} />
      {/if}
    </span>
  </button>

  {#if isOpen && hasAttendees}
    <div class="roster w-full mt-2 pt-2 border-t border-border/40">
      <div class="roster-inner flex flex-wrap gap-1.5">
        {#each attendees as attendee (attendee.id)}
          <div
            class="roster-chip inline-flex items-center gap-1.5 bg-muted/50 hover:bg-muted/80 border border-border/60 rounded-full py-0.5 pr-2.5 pl-0.5 transition-colors">
            <Avatar.Root class="size-5 border border-background shrink-0">
              <Avatar.Image
                src={attendee.avatarUrl ?? undefined}
                alt={attendee.name ?? "Attendee"} />
              <Avatar.Fallback
                class="text-[7.5px] bg-muted text-muted-foreground font-semibold font-mono">
                {(attendee.name ?? "U").slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            <span class="text-xs font-medium text-foreground leading-none">
              {attendee.name ?? "Athlete"}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
