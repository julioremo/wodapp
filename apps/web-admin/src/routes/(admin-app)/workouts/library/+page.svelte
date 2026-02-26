<script lang="ts">
  import PageShell from "$lib/components/admin/PageShell.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Table from "$lib/components/ui/table";
  import { Badge } from "$lib/components/ui/badge";

  import { Plus, Search, Dumbbell } from "lucide-svelte";

  let { data } = $props();

  // Simple client-side search
  let searchTerm = $state("");
  let filteredWorkouts = $derived(
    data.workouts.filter((w: any) => w.slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );
</script>

<PageShell title="Workouts" subtitle="Manage your library of WODs and lifting sessions.">
  {#snippet utility()}
    <Button href="/workouts/new" size="sm" class="gap-1 px-4 [&_svg]:size-4">
      <Plus class="stroke-[3]" />
      <span class="text-xs font-semibold">Plan New Workout</span>
    </Button>
  {/snippet}

  {#snippet controls()}
    <div class="relative w-64">
      <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search workouts..." class="pl-8" bind:value={searchTerm} />
    </div>
  {/snippet}

  <div class="border rounded-md h-full overflow-hidden flex flex-col">
    <div class="overflow-auto flex-1">
      <Table.Root>
        <Table.Header class="sticky top-0 bg-background z-10">
          <Table.Row>
            <Table.Head>Title</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Description</Table.Head>
            <Table.Head class="text-right">Created</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each filteredWorkouts as workout (workout.id)}
            <Table.Row>
              <Table.Cell class="font-medium">
                <div class="flex items-center gap-2">
                  <div class="p-1 bg-primary/10 rounded text-primary">
                    <Dumbbell class="h-4 w-4" />
                  </div>
                  {workout.title}
                </div>
              </Table.Cell>

              <Table.Cell>
                <span
                  class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {workout.type || "General"}
                </span>
              </Table.Cell>

              <Table.Cell class="max-w-[300px] truncate text-muted-foreground">
                {workout.description || "No description"}
              </Table.Cell>

              <Table.Cell class="text-right text-muted-foreground">
                {new Date(workout.created_at).toLocaleDateString()}
              </Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={4} class="h-24 text-center">No workouts found.</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </div>
</PageShell>
