<script lang="ts">
import { Activity, ChevronLeft, ChevronRight } from "@lucide/svelte";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let displayCategory = $derived(
  data.category.charAt(0).toUpperCase() + data.category.slice(1),
);
</script>

<div class="flex flex-col h-full bg-background">
  <header
    class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-3 pt-4 px-2">
    <div class="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        href="/benchmarks"
        class="mr-2 rounded-full">
        <ChevronLeft class="w-6 h-6" />
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">{displayCategory}</h1>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto">
    {#if data.movements.length === 0}
      <div
        class="flex flex-col items-center justify-center h-[40vh] text-center text-muted-foreground">
        <Activity class="w-12 h-12 mb-4 opacity-20" />
        <p>No movements found for this category.</p>
      </div>
    {:else}
      <!-- iOS-style grouped list container -->
      <div class="overflow-hidden">
        {#each data.movements as movement}
          <a
            href="/benchmarks/{data.category}/{movement.slug}"
            class="group flex items-center justify-between pl-4 pr-3 py-2 border-b last:border-b-0 hover:bg-muted/50 active:bg-muted transition-colors focus:outline-none focus:bg-muted align-baseline">
            <span class="text-xl font-medium truncate pr-4"
              >{movement.name}</span>

            <div class="flex items-center gap-3 shrink-0 align-baseline">
              {#if movement.pr}
                <span
                  class="text-base text-foreground text-center align-baseline"
                  >{movement.pr}</span>
              {:else}
                <Badge
                  variant="outline"
                  class="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-none text-tomato-200 border-tomato-200"
                  >! No record</Badge>
              {/if}
              <div
                class="p-0.5 rounded-full transition-colors group-active:bg-foreground/10 group-hover:bg-foreground/5">
                <ChevronRight
                  class="w-5 h-5 text-muted-foreground/30 shrink-0 rounded-full" />
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
