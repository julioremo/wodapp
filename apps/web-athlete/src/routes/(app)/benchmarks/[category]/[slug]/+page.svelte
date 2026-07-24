<script lang="ts">
import {
  ChartSpline,
  ChevronLeft,
  Percent,
  Plus,
  Repeat,
  Table,
} from "@lucide/svelte";
import { Button, buttonVariants } from "@ui/button";
import * as Drawer from "@ui/drawer";
import * as Tabs from "@ui/tabs";
import * as ToggleGroup from "@ui/toggle-group";
import { invalidate } from "$app/navigation";
import LogScoreForm from "../../LogScoreForm.svelte";
import DistributionChart from "./DistributionChart.svelte";
import ProgressionChart from "./ProgressionChart.svelte";
import RecordsTable from "./RecordsTable.svelte";
import StreghtLevelsBg from "./StreghtLevelsBg.svelte";
import WeightCalcStrip from "./WeightStrip.svelte";

let { data } = $props();
let { movement, standardsSelection, history, peers, profile, user } =
  $derived(data);

let oneRepMax = $derived.by(() => {
  const validWeights = history
    .map((r) => r.estimated_1rm)
    .filter((rm): rm is number => rm !== null);

  return validWeights.length > 0 ? Math.max(...validWeights) : null;
});

// toggles
let standardsMode = $state<"general" | "ageWeightAdjusted">("general");
let standardsModes = {
  general: { label: "General" },
  ageWeightAdjusted: { label: "My age/weight" },
} as const;
let standardsSet = $derived(standardsSelection[standardsMode]);

let stripMode = $state<"percentage" | "reps">("percentage");
const stripModes = {
  percentage: { label: "1RM", Icon: Percent },
  reps: { label: "reps", Icon: Repeat },
} as const;

// Log score modal
let isDrawerOpen = $state(false);

function handleSuccess() {
  isDrawerOpen = false;
  invalidate("app:benchmarks");
}

// ── toggle styling ─────────────────────────────
// function pillClass(active: boolean) {
//   return [
//     "font-mono text-[9px] uppercase tracking-[0.07em] px-2 py-1",
//     "border-none cursor-pointer transition-colors duration-150",
//     active
//       ? "bg-[#1a1814] text-[#f5f2eb]"
//       : "bg-transparent text-[#4a4640] hover:bg-[#ede9df]",
//   ].join(" ");
// }
</script>

<div class="flex flex-col h-full bg-background">
  <header
    class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-3 pt-4 px-2 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        href="/benchmarks/{movement.category}"
        class="rounded-full -ml-2">
        <ChevronLeft class="w-6 h-6" />
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">{movement.name}</h1>
    </div>

    <Drawer.Root bind:open={isDrawerOpen}>
      <Drawer.Trigger
        class={buttonVariants({
          variant: "default",
          class: "rounded-full whitespace-nowrap",
        })}>
        <Plus class="w-4 h-4 mr-1" />
        Log Score</Drawer.Trigger>
      <Drawer.Content>
        <div class="px-4 pb-8 pt-4 space-y-4 mx-auto max-w-md">
          <Drawer.Header class="p-0 text-left">
            <Drawer.Title class="text-lg"
              >Log in your score for {data.movement.name}</Drawer.Title>
          </Drawer.Header>
          <LogScoreForm
            movementId={data.movement.id}
            onSuccess={handleSuccess} />
        </div>
      </Drawer.Content>
    </Drawer.Root>
  </header>

  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#if history.length > 0}
      <!-- <section class="mt-16 first:mt-4">
        <header class="flex items-end justify-between mb-3 ml-3">
          <h3 class="text-lg font-medium text-foreground">Highlights</h3>
        </header>
      </section> -->

      {#if movement.measurement_type === "weight" && oneRepMax}
        <section class="mt-16 first:mt-4">
          <header class="flex items-end justify-between mb-3 ml-3">
            <h3 class="text-lg font-medium text-foreground">
              Rep/percentage calculator
            </h3>
            <ToggleGroup.Root
              type="single"
              bind:value={stripMode}
              class="h-6 border rounded-none font-mono uppercase">
              {#each Object.entries(stripModes) as [mode, { label, Icon }]}
                <ToggleGroup.Item value={mode} class="h-full px-2 text-xs">
                  {#if Icon}
                    <Icon class="mr-1.5 h-3 w-3" />
                  {/if}
                  {label}
                </ToggleGroup.Item>
              {/each}
            </ToggleGroup.Root>
          </header>
          <div class="w-full overflow-hidden rounded-none border">
            <WeightCalcStrip mode={stripMode} {oneRepMax} />
          </div>
        </section>
      {/if}

      <section class="mt-16">
        <Tabs.Root value="chart" class="w-full gap-0">
          <div class="flex items-end justify-between mb-3 ml-3">
            <h3 class="text-lg font-medium text-foreground">My progress</h3>

            <Tabs.List class="flex bg-transparent p-0 border rounded-none">
              <Tabs.Trigger
                value="chart"
                class="rounded-none p-1 text-muted-foreground transition-all hover:bg-muted/50 data-[state=active]:bg-muted data-[state=active]:text-foreground"
                aria-label="Switch to chart view">
                <ChartSpline class="h-4 w-4" />
              </Tabs.Trigger>

              <Tabs.Trigger
                value="table"
                class="rounded-none p-1 text-muted-foreground transition-all hover:bg-muted/50 data-[state=active]:bg-muted data-[state=active]:text-foreground"
                aria-label="Switch to table view">
                <Table class="h-4 w-4" />
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          <Tabs.Content value="chart" class="mt-0">
            <!-- <div
              class="w-full rounded-xl overflow-hidden border-1 border-stone-300"> -->
            <div class="w-full overflow-hidden">
              <ProgressionChart {history}>
                {#snippet background(yScale, hairline)}
                  <StreghtLevelsBg {standardsSet} {yScale} {hairline} />
                {/snippet}
              </ProgressionChart>
            </div>
          </Tabs.Content>

          <Tabs.Content value="table" class="mt-0">
            <div class="w-full">
              <RecordsTable
                {history}
                measurementType={movement.measurement_type} />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </section>
      {#if standardsSelection.general.myGender || peers.length > 2}
        <section class="mt-16">
          <div class="flex items-end justify-between mb-3 ml-3">
            <h3 class="text-lg font-medium text-foreground">
              How do I compare?
            </h3>
            <ToggleGroup.Root
              type="single"
              bind:value={standardsMode}
              class="h-6 border rounded-none font-mono uppercase">
              {#each Object.entries(standardsModes) as [mode, { label }]}
                <ToggleGroup.Item value={mode} class="h-full px-2 text-xs ">
                  {label}
                </ToggleGroup.Item>
              {/each}
            </ToggleGroup.Root>
          </div>
          <div
            // class="overflow-hidden bg-white rounded-xl border-1 border-stone-300"
            class="overflow-hidden bg-white">
            <DistributionChart {peers} {standardsSet} userId={user.id} />
          </div>
        </section>
      {/if}
    {:else}
      <!-- TODO: rewrite logic and show blurred distribution chart when there's peer/standards data but no user data -->
      <section
        class="flex flex-col h-full w-full items-center justify-center text-muted-foreground">
        <h4>No data yet for this movement.</h4>
        <button
          type="button"
          class="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          onclick={() => (isDrawerOpen = true)}>Log your first score</button>
      </section>
    {/if}
  </div>
</div>
