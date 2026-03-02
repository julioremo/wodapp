<script lang="ts">
import * as Popover from "$lib/components/ui/popover";
import { cn } from "$lib/utils";

let {
  value = $bindable(),
  colors,
  columns = 2
} = $props<{
  value: string;
  colors: string[];
  columns?: number;
}>();

let open = $state(false);

function selectColor(color: string) {
  value = color;
  open = false;
}
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
  >
    <div
      class="w-6 h-6 rounded-full shadow-sm border border-border transition-transform hover:scale-105"
      style="background-color: {value};"
      aria-label="Pick a color"
    ></div>
  </Popover.Trigger>

  <Popover.Content class="w-auto p-0 border-none shadow-md" sideOffset={8}>
    <div
      class="grid gap-[2px] bg-background border-[2px] border-background rounded-md overflow-hidden"
      style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"
    >
      {#each colors as color}
        <button
          type="button"
          class={cn(
            "w-8 h-8 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring inset-0 z-10",
            value === color ? "opacity-100 scale-95" : ""
          )}
          style="background-color: {color};"
          aria-label="Select color {color}"
          onclick={() => selectColor(color)}
        ></button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
