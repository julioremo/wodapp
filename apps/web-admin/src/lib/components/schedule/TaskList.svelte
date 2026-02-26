<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Plus, CircleAlert, Trash2, Calendar as CalendarIcon } from "lucide-svelte";

  let { classes } = $props();

  // ⚡️ REAL-TIME DERIVATION
  // This automatically updates if 'classes' changes (e.g. next week)
  let tasks = $derived.by(() => {
    const missingCoach = classes.filter((c) => !c.coach_id);
    const missingprogram = classes.filter((c) => !c.program_id);

    return [
      ...missingCoach.map((c) => ({ type: "coach", ...c })),
      ...missingprogram.map((c) => ({ type: "program", ...c }))
    ];
  });
</script>

<Card.Root class="border-orange-200 bg-orange-50/10 dark:border-orange-900/50">
  <Card.Header class="pb-2">
    <Card.Title class="text-lg flex items-center text-orange-600 dark:text-orange-400">
      <CircleAlert class="mr-2 h-5 w-5" />
      Attention Needed
    </Card.Title>
  </Card.Header>
  <Card.Content>
    <div class="space-y-1">
      {#each tasks as task}
        <div class="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
          <div class="flex gap-2">
            <span class="font-mono"
              >{new Date(task.start_time).toLocaleDateString([], {
                weekday: "short",
                day: "numeric",
                month: "short"
              })}</span
            >
            <span class="font-bold"
              >{new Date(task.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}</span
            >
          </div>
          <div class="flex gap-2">
            {#if !task.coach_id}
              <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Missing Coach</span>
            {/if}
            {#if !task.program_id}
              <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Missing WOD</span>
            {/if}
          </div>
          <Button variant="ghost" size="sm" class="h-6" href={`schedule/${task.id}/edit`}>Fix</Button>
        </div>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
