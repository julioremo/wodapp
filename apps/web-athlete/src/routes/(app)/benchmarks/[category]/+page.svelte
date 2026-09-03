<script lang="ts">
import { Activity, ChevronLeft, ChevronRight } from "@lucide/svelte";
import { Badge } from "@ui/badge";
import BackButton from "$lib/components/BackButton.svelte";
import AppHeader from "$lib/components/layout/AppHeader.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let displayCategory = $derived(
  data.category.charAt(0).toUpperCase() + data.category.slice(1),
);
</script>

<div class="flex flex-col h-full bg-background">
  <AppHeader title={displayCategory}>
    {#snippet left()}
      <BackButton backUrl="/benchmarks" />
    {/snippet}
  </AppHeader>

  <div class="flex-1 overflow-y-auto pb-12">
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
            class="group flex items-center justify-between py-2.5 pl-12 pr-3 hover:bg-muted/50 active:bg-muted transition-colors focus:outline-none focus:bg-muted align-baseline border-b-1 last:border-b-0">
            <span class="text-lg font-medium truncate pr-4"
              >{movement.name}</span>

            <div class="flex items-center gap-3 shrink-0 align-baseline">
              {#if movement.pr}
                <span
                  class="text-base text-foreground text-center align-baseline"
                  >{Math.round(movement.pr * 10) / 10}</span>
              {:else}
                <Badge
                  variant="outline"
                  class="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-none text-grey-200 border-grey-200"
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
