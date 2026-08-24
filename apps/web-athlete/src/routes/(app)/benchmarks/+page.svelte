<script lang="ts">
import {
  Activity,
  ChevronRight,
  Dumbbell,
  Search,
  Timer,
  Trophy,
} from "@lucide/svelte";
import { Card, CardContent } from "@ui/card";
import * as InputGroup from "@ui/input";

// import { Input } from "@ui/input";

// Mock data for the layout structure
const categories = [
  {
    id: "weight",
    name: "Weightlifting",
    icon: Dumbbell,
    description: "Squats, deadlifts, presses and Olympic lifts",
  },
  {
    id: "distance",
    name: "Endurance",
    icon: Timer,
    description: "Run, row, bike and ski benchmarks",
  },
  {
    id: "skill",
    name: "Gymnastics",
    icon: Activity,
    description: "Rings, bar, and handstand proficiency",
  },
];

const recentPRs = [
  { movement: "Back Squat", value: "140 kg", date: "2 days ago" },
  { movement: "500m Row", value: "1:32", date: "Last week" },
  { movement: "Fran", value: "3:45", date: "2 weeks ago" },
];
</script>

<div class="flex flex-col p-2">
  <div class="gap-1 p-12">
    <h1 class="text-lg font-medium">Benchmarks</h1>
    <!-- <p class="text-sm text-muted-foreground">Track your performance.</p> -->
  </div>

  <div class="space-y-8 px-2 pb-24">
    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
      <!-- <Input placeholder="Search movements" class="pl-9 rounded-full" /> -->

      <InputGroup.Root class="pl-9 rounded-full bg-white">
        <InputGroup.Input placeholder="Search..." />
        <InputGroup.Addon>
          <Search class="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
        </InputGroup.Addon>
        <!-- <InputGroup.Addon align="inline-end">12 results</InputGroup.Addon> -->
      </InputGroup.Root>
    </div>

    <!-- Recent PRs (Horizontal Scroll) -->
    <div class="flex flex-col gap-3">
      <h2 class="text-md font-medium text-grey-400">Recent PRs</h2>
      <div class="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {#each recentPRs as pr}
          <Card
            class="min-w-[130px] shrink-0 snap-start bg-grey-50 third:bg-green-100 border-primary/10">
            <CardContent class="p-3 flex flex-col gap-1">
              <span class="text-xs font-medium text-muted-foreground truncate"
                >{pr.movement}</span>
              <span class="text-lg font-bold tracking-tight">{pr.value}</span>
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >{pr.date}</span>
            </CardContent>
          </Card>
        {/each}
      </div>
    </div>

    <!-- Category Menu (Single Column) -->
    <div class="flex flex-col gap-3">
      <h2 class="text-md font-medium text-grey-400">Categories</h2>
      <div class="flex flex-col gap-3">
        {#each categories as cat}
          <a href="/benchmarks/{cat.id}" class="block focus:outline-none">
            <Card class="transition-all hover:bg-muted/50 active:scale-[0.98]">
              <CardContent class="px-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="p-2.5 bg-muted rounded-full text-foreground">
                    <svelte:component this={cat.icon} size={20} />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium text-sm">{cat.name}</span>
                    <span class="text-xs text-muted-foreground"
                      >{cat.description}</span>
                  </div>
                </div>
                <ChevronRight
                  class="h-4 w-4 text-muted-foreground opacity-50" />
              </CardContent>
            </Card>
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
/* Utility to hide the scrollbar but keep functionality for the PR list */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
