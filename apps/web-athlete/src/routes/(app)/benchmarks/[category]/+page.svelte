<script lang="ts">
import { Activity, ChevronLeft, ChevronRight } from "@lucide/svelte";
import { Button } from "@ui/button";
import { Card } from "@ui/card";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

// Quick helper to capitalize the category for the header
let displayCategory = $derived(data.category.charAt(0).toUpperCase() + data.category.slice(1));
</script>

<div class="flex flex-col h-full bg-background">
  <header
    class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-3 pt-4 px-2 space-y-4">
    <div class="flex items-center">
      <Button variant="ghost" size="icon" href="/benchmarks" class="mr-2 rounded-full">
        <ChevronLeft class="w-6 h-6" />
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">{displayCategory}</h1>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#if data.movements.length === 0}
      <div
        class="flex flex-col items-center justify-center h-[40vh] text-center text-muted-foreground">
        <Activity class="w-12 h-12 mb-4 opacity-20" />
        <p>No movements found for this category.</p>
      </div>
    {:else}
      <div class="grid gap-3">
        {#each data.movements as movement}
          <!-- Notice the URL dynamically appends the slug -->
          <a
            href="/benchmarks/{data.category}/{movement.slug}"
            class="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
            <Card
              class="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 active:bg-muted">
              <div class="flex flex-col space-y-1">
                <span class="font-semibold">{movement.name}</span>
                <!-- Placeholder for the athlete's actual PR -->
                <span class="text-sm text-muted-foreground">Unrecorded</span>
              </div>
              <ChevronRight class="w-5 h-5 text-muted-foreground opacity-50" />
            </Card>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
