<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    days = [],
    corner,
    headerCell,
    leftSidebar,
    gridContent,
    sidebarWidthClass = "w-16",
    minColWidthClass = "min-w-[140px]"
  } = $props<{
    days: any[];
    corner?: Snippet;
    headerCell: Snippet<[{ day: any; index: number }]>;
    leftSidebar?: Snippet;
    gridContent: Snippet;
    sidebarWidthClass?: string;
    minColWidthClass?: string;
  }>();
</script>

<div class="border rounded-xl bg-background flex flex-col h-full overflow-hidden shadow-sm">
  <div class="flex-1 overflow-auto relative bg-background">
    <div class="flex flex-col min-w-max min-h-full">
      <div class="flex border-b bg-muted/40 sticky top-0 z-30 shadow-sm">
        <div
          class={cn(
            "shrink-0 border-r bg-background sticky left-0 z-40 flex items-center justify-center",
            sidebarWidthClass
          )}
        >
          {#if corner}{@render corner()}{/if}
        </div>

        <div class="flex flex-1">
          {#each days as day, index}
            <div class={cn("flex-1 border-r last:border-r-0", minColWidthClass)}>
              {@render headerCell({ day, index })}
            </div>
          {/each}
        </div>
      </div>

      <div class="flex flex-1">
        <div class={cn("shrink-0 bg-background border-r sticky left-0 z-20", sidebarWidthClass)}>
          {#if leftSidebar}{@render leftSidebar()}{/if}
        </div>

        <div class="flex flex-1 relative">
          {@render gridContent()}
        </div>
      </div>
    </div>
  </div>
</div>
