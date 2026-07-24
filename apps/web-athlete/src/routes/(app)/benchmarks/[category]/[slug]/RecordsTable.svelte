<script lang="ts">
import { format } from "date-fns";

let { history, measurementType } = $props();
</script>

<div class="w-full overflow-hidden rounded-xl border bg-background">
  <table class="w-full text-sm text-left">
    <thead class="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
      <tr>
        <th class="px-4 py-3">Date</th>
        <th class="px-4 py-3">Score</th>
        <th class="px-4 py-3">Notes</th>
      </tr>
    </thead>
    <tbody class="divide-y">
      {#each history.slice().reverse() as record}
        <tr class="hover:bg-muted/30 transition-colors">
          <td class="px-4 py-3 whitespace-nowrap">
            {format(new Date(record.date), 'MMM d, yyyy')}
          </td>
          <td class="px-4 py-3 font-semibold">
            {record.score} {measurementType === 'weight' ? 'kg' : ''}
            {#if record.reps > 1}
              <span class="text-muted-foreground font-normal ml-1">x {record.reps}</span>
            {/if}
          </td>
          <td class="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
            {record.notes || '-'}
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="3" class="text-center py-6 text-muted-foreground">No records found.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
