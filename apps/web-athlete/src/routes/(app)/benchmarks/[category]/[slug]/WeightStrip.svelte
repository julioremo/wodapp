<script lang="ts">
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@ui/table";

  let {
    oneRepMax = 100,
    mode = "percentage",
  }: {
    oneRepMax?: number;
    mode?: "percentage" | "reps";
  } = $props();

  const percentages = [50, 60, 65, 70, 75, 80, 85, 90, 100];
  const reps = [12, 10, 8, 6, 4, 2, 1];

  let columns = $derived(mode === "percentage" ? percentages : reps);

  function calculateWeight(val: number) {
    if (mode === "percentage") {
      return Math.round((oneRepMax * val) / 100);
    } else {
      if (val === 1) return Math.round(oneRepMax);
      else return Math.round(oneRepMax / (1 + val / 30));
    }
  }
</script>

<Table class="text-xs border-1 font-mono">
  <TableHeader class="bg-muted">
    <TableRow class="hover:bg-transparent">
      {#each columns as col}
        <TableHead class="h-6 p-1 text-center font-normal text-xs border-r">
          {mode === "percentage" ? `${col}%` : `${col}RM`}
        </TableHead>
      {/each}
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow class="bg-background">
      {#each columns as col}
        <TableCell class="h-6 p-1 text-center text-xs  border-r">
          {calculateWeight(col)}
        </TableCell>
      {/each}
    </TableRow>
  </TableBody>
</Table>
