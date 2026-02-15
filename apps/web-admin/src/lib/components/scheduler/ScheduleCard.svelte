<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { TriangleAlert, CircleAlert, Users, FileExclamationPoint as FileWarning, Clock } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { type Snippet } from "svelte";
  import { CLASS_TYPE_COLORS, DEFAULT_CLASS_COLOR } from "$lib/config/schedule";

  let {
    session,
    style,
    class: className,
    children
  } = $props<{
    session: any;
    style?: string;
    class?: string;
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
  );

  const colorStyles: Record<string, string> = {
    blue: "bg-blue text-white hover:bg-blue-600",
    red: "bg-red text-white hover:bg-red-600",
    purple: "bg-purple text-white hover:bg-purple-600",
    green: "bg-green text-white hover:bg-green-600"
  };

  let classColor = $derived(CLASS_TYPE_COLORS[session.class_type] || DEFAULT_CLASS_COLOR);

  let colorClasses = $derived(colorStyles[classColor]);

  let attendance = $derived(session.bookings_count ?? 0);
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class={cn(
      // Layout & Sizing
      "flex flex-col justify-between h-full overflow-hidden transition-all text-left",
      "rounded-lg p-1.5",
      "hover:z-20 hover:ring-2 ring-primary/20 hover:shadow-md",
      colorClasses,
      className
    )}
    {style}
  >
    <div class="flex justify-between items-start leading-none mb-0.5">
      <div class="font-bold uppercase truncate text-[13px]">
        {session.class_type}
      </div>

      <div
        class="flex items-center gap-0.5 font-medium opacity-80 text-[11px]"
        title="{attendance} of {session.capacity} spots booked"
      >
        <Users class="h-3 w-3" />
        <span>{attendance}/{session.capacity}</span>
      </div>
    </div>

    <div class="flex justify-between items-center text-[11px]">
      <div class="truncate flex items-center gap-1 max-w-[75%]">
        {#if session.coach}
          <span class="opacity-75 truncate">{session.coach.full_name}</span>
        {:else}
          <span
            class="text-destructive-foreground bg-destructive/15 p-0.5 rounded-full flex items-center gap-1 font-medium"
          >
            <CircleAlert class="h-2.5 w-2.5" /> Coach Unassigned
          </span>
        {/if}
      </div>

      {#if session.workout_id}
        <div>{session.workout_id}</div>
      {:else}
        <div
          class="px-1.5 bg-white text-ink rounded-full flex items-center gap-1 font-bold"
          title="Workout not assigned"
        >
          <!-- <CircleAlert class="h-3 w-3 stroke-3" /> -->
          !
          <!-- <div class="text-nowrap leading-none pr-1 h-3">No workout</div> -->
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-0.5 text-[11px] opacity-70 font-medium">
      <Clock class="h-3 w-3" /><span>{timeDisplay}</span>
    </div>
  </Popover.Trigger>

  <Popover.Content class="w-80 p-4 rounded" side="right">
    {@render children(() => (open = false))}
  </Popover.Content>
</Popover.Root>
