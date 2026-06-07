<script lang="ts" generics="TData, TValue">
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState
} from "@tanstack/table-core";
import { createSvelteTable, FlexRender } from "@ui/data-table/index.js";
import * as Table from "@ui/table";

let {
  data,
  columns,
  globalFilter = $bindable(""),
  sorting = $bindable([])
} = $props<{
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  globalFilter?: string;
  sorting?: SortingState;
}>();

const table = createSvelteTable({
  get data() {
    return data;
  },
  get columns() {
    return columns;
  },
  state: {
    get sorting() {
      return sorting;
    },
    get globalFilter() {
      return globalFilter;
    }
  },
  onSortingChange: (updater) => {
    let next = typeof updater === "function" ? updater(sorting) : updater;
    // Strip out status if it somehow got in there via a user click
    next = next.filter((s) => s.id !== "status");
    // Force status to ALWAYS be the primary sort
    sorting = [{ id: "status", desc: false }, ...next];
  },
  onGlobalFilterChange: (updater) => {
    if (typeof updater === "function") globalFilter = updater(globalFilter);
    else globalFilter = updater;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel() // <-- This is the engine that makes search work!
});
</script>

<div class="rounded-md border bg-background">
  <Table.Root>
    <Table.Header>
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head class={header.column.columnDef.meta?.class}>
              {#if !header.isPlaceholder}
                <FlexRender
                  content={header.column.columnDef.header}
                  context={header.getContext()} />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row data-state={row.getIsSelected() && "selected"}>
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
