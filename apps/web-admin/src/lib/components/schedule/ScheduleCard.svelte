<script lang="ts">
// COMPONENT CONTRACT: This card is designed to fill 100% of its parent container's width and height. It does NOT control its own positioning or dimensions.
import {
  CircleAlert,
  ClipboardCheck,
  ClipboardX,
  Clock,
  TriangleAlert,
  Users
} from "lucide-svelte";
import type { Snippet } from "svelte";
import * as Popover from "$lib/components/ui/popover";
import { cn } from "$lib/utils";

let {
  session,
  style,
  class: className,
  color,
  children
} = $props<{
  session: any;
  style?: string;
  class?: string;
  color?: string;
  children?: Snippet<[() => void]>;
}>();

let open = $state(false);

function close() {
  open = false;
}

let timeDisplay = $derived(
  new Date(session.start_time).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  })
    + "–"
    + new Date(session.end_time).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    })
);

const colorStyles: Record<string, string> = {
  blue: "bg-paper text-charcoal border-l-blue hover:bg-blue hover:text-white",
  red: "bg-paper text-charcoal border-l-red hover:bg-red hover:text-white",
  purple: "bg-paper text-charcoal border-l-purple hover:bg-purple hover:text-white",
  green: "bg-paper text-charcoal border-l-green hover:bg-green hover:text-white"
};

let colorClasses = $derived(colorStyles["blue"]);

let attendance = $derived(session.bookings_count ?? 0);
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class={cn(
      // Layout & Sizing
      "flex flex-col justify-between h-full w-full overflow-hidden transition-all text-left",
      "rounded-lg p-1.5",
      "hover:z-20 shadow-sm hover:shadow-md transition-shadow",
      "border-l-6",
      colorClasses,
      className
    )}
    {style}>
    <div class="flex justify-between items-start leading-none mb-0.5">
      <h1 class="font-bold uppercase truncate text-[13px]">{session.class_type}</h1>

      <div
        class="flex items-center gap-0.5 font-medium opacity-80 text-[11px]"
        title="{attendance} of {session.capacity} spots booked">
        <Users class="h-3 w-3 stroke-2" />
        <span>{attendance}/{session.capacity}</span>
      </div>
    </div>

    <div class="flex justify-between items-center text-[11px]">
      <div class="truncate flex items-center gap-1 max-w-[75%]">
        {#if session.coach}
          <span class="opacity-75 truncate">{session.coach.full_name}</span>
        {:else}
          <span
            class="text-destructive-foreground bg-destructive/15 p-0.5 rounded-full flex items-center gap-1 font-medium">
            <CircleAlert class="h-2.5 w-2.5" />
            Coach Unassigned
          </span>
        {/if}
      </div>

      {#if session.program_id}
        <div title="program assigned"><ClipboardCheck class="h-3.5 w-3.5" /></div>
      {:else}
        <div
          class="flex items-end gap-1 text-red p-0.5 bg-paper rounded-full"
          title="program not assigned">
          <ClipboardX class="h-3.5 w-3.5" />
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-0.5 text-[11px] opacity-70 font-medium">
      <Clock class="h-3 w-3" /><span>{timeDisplay}</span>
    </div>
  </Popover.Trigger>

  <Popover.Content class="w-84 p-3 rounded" side="right">
    {@render children(() => (open = false))}
  </Popover.Content>
</Popover.Root>
