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
import AppHeader from "$lib/components/layout/AppHeader.svelte";
import Insights from "./Insights.svelte";

// import { Input } from "@ui/input";

// Mock data for the layout structure
const categories = [
  {
    id: "weight",
    name: "Weightlifting",
    icon: Dumbbell,
    description: "Squats, deadlifts, presses, Olympic lifts",
  },
  {
    id: "distance",
    name: "Endurance",
    icon: Timer,
    description: "Run, row, bike, ski, swim",
  },
  {
    id: "skill",
    name: "Gymnastics",
    icon: Activity,
    description: "Rings, bar, handstand skills",
  },
];

const recentPRs = [
  { movement: "Back Squat", value: "140 kg", date: "2 days ago" },
  { movement: "500m Row", value: "1:32", date: "Last week" },
  { movement: "Fran", value: "3:45", date: "2 weeks ago" },
];
</script>

<AppHeader title="Benchmarks"></AppHeader>

<div class="flex flex-col">
  <main class="flex flex-col gap-12 pb-12">
    <!-- Insights section -->
    <!-- <section id="section-insights" class="flex flex-col space-y-2">
      <h2 class="text-md font-medium text-ink-400 ml-12">Insights</h2>
      <Insights />
    </section> -->

    <!-- Category Menu -->
    <section id="section-categories" class="flex flex-col space-y-2">
      <h2 class="text-md font-medium text-muted-foreground pl-6.5">
        Browse by category
      </h2>
      <div class="section-inner grid grid-cols-1 gap-0">
        {#each categories as cat}
          <a href="/benchmarks/{cat.id}" class="block focus:outline-none">
            <div
              class="transition-all hover:bg-muted py-3 pl-6.5 pr-3 flex items-center justify-between rounded-none">
              <!-- <div class="p-1 rounded-full text-foreground">
                <svelte:component this={cat.icon} size={20} />
              </div> -->
              <div class="flex flex-col gap-0.5">
                <span class="font-medium text-lg">{cat.name}</span>
                <span class="text-xs text-muted-foreground">
                  {cat.description}
                </span>
              </div>

              <ChevronRight class="size-5 text-muted-foreground" />
            </div>
          </a>
        {/each}
      </div>
    </section>
  </main>
</div>
