<script lang="ts">
import type { ColumnDef, SortingState } from "@tanstack/table-core";
import { format } from "date-fns";
import {
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp10,
  ArrowUpDown,
  ArrowUpZA,
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  ChevronRight,
  Clock,
  Search,
  Send,
  X
} from "lucide-svelte";
import { toast } from "svelte-sonner";
import { enhance } from "$app/forms";
import * as Avatar from "$lib/components/ui/avatar";
import { Button } from "$lib/components/ui/button";
import { renderSnippet } from "$lib/components/ui/data-table/index.js";
import { Input } from "$lib/components/ui/input";
import DataTable from "./data-table.svelte";

let { data } = $props();

let globalFilter = $state("");
let sorting = $state<SortingState>([
  { id: "status", desc: false },
  { id: "display_name", desc: false }
]);

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "status",
    // 1. Disable user sorting for this column
    enableSorting: false,
    // 2. Define the exact hierarchy
    sortingFn: (rowA, rowB, columnId) => {
      const order: Record<string, number> = { pending: 1, active: 2, inactive: 3 };
      const a = order[rowA.getValue(columnId) as string] || 99;
      const b = order[rowB.getValue(columnId) as string] || 99;
      return a < b ? -1 : a > b ? 1 : 0;
    },
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const avatar = row.original.avatar_url;
      const name = row.original.display_name;
      return renderSnippet(statusSnippet, { status, avatar, name });
    },
    meta: {
      class: "w-4 text-center"
    }
  },
  {
    accessorKey: "display_name",
    header: ({ column }) => renderSnippet(sortHeader, { column, label: "Name", type: "text" }),
    cell: ({ row }) => {
      const name = row.getValue("display_name") as string;
      const fullName = row.original.full_name;
      return renderSnippet(nameSnippet, { name, fullName });
    }
  },
  {
    accessorKey: "email",
    header: ({ column }) => renderSnippet(sortHeader, { column, label: "Email", type: "text" })
  },
  {
    accessorKey: "phone",
    header: "Phone"
  },
  {
    accessorKey: "role",
    header: ({ column }) => renderSnippet(sortHeader, { column, label: "Role", type: "text" }),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return renderSnippet(roleSnippet, { role });
    },
    meta: {
      class: "w-6"
    }
  },
  {
    accessorKey: "joined",
    header: ({ column }) => renderSnippet(sortHeader, { column, label: "Joined", type: "date" }),
    cell: ({ row }) => {
      const dateStr = row.getValue("joined") as string;
      return format(new Date(dateStr), "MMM d, yyyy");
    },
    meta: {
      class: "w-6"
    }
  },
  {
    id: "actions",
    header: "", // Leave header blank for a cleaner look
    cell: ({ row }) => {
      // We use row.original.id which is the specific membership ID
      const memberId = row.original.id;
      return renderSnippet(actionSnippet, { id: memberId });
    },
    meta: {
      class: "w-12 text-right" // Keep it narrow and right-aligned
    }
  }
];
</script>

{#snippet nameSnippet({ name, fullName }: { name: string; fullName: string })}
  <div class="flex flex-col">
    <span class="font-medium">{name}</span>
    {#if fullName && fullName !== name}
      <span class="text-xs text-muted-foreground">{fullName}</span>
    {/if}
  </div>
{/snippet}

{#snippet statusSnippet({ status, avatar, name }: { status: string, avatar: string | null, name: string })}
  {@const initials = (name || "?").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}

  <div class="flex justify-center relative w-fit mx-auto" title={status}>
    <Avatar.Root
      class="h-8 w-8 transition-all {status === 'inactive' ? 'grayscale opacity-40' : ''} {status === 'pending' ? 'border-2 border-dashed border-muted-foreground/50 bg-transparent' : ''}">
      <Avatar.Image src={avatar || ''} alt={name} />
      <Avatar.Fallback
        class={status === 'pending' ? 'bg-transparent text-muted-foreground text-xs font-mono' : 'text-xs font-mono'}>
        {initials}
      </Avatar.Fallback>
    </Avatar.Root>

    {#if status === 'active'}
      <span
        class="absolute bottom-0 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"></span>
    {/if}
  </div>
{/snippet}

{#snippet roleSnippet({ role }: { role: string })}
  <span class="capitalize text-sm text-muted-foreground">{role}</span>
{/snippet}

{#snippet sortHeader({ column, label, type = 'text' }: { column: any, label: string, type?: string })}
  {@const isSorted = column.getIsSorted()}
  <Button
    variant="ghost"
    class="-ml-4 h-8 data-[state=open]:bg-accent {isSorted ? 'text-foreground font-semibold' : 'text-muted-foreground'}"
    onclick={() => column.toggleSorting(isSorted === "asc")}>
    {label}
    {#if isSorted === "asc"}
      {#if type === 'text'}
        <ArrowDownAZ class="ml-2 h-4 w-4" />
      {:else if type === 'date'}
        <CalendarArrowUp class="ml-2 h-4 w-4" />
      {:else}
        <ArrowDown01 class="ml-2 h-4 w-4" />
      {/if}
    {:else if isSorted === "desc"}
      {#if type === 'text'}
        <ArrowUpZA class="ml-2 h-4 w-4" />
      {:else if type === 'date'}
        <CalendarArrowDown class="ml-2 h-4 w-4" />
      {:else}
        <ArrowUp10 class="ml-2 h-4 w-4" />
      {/if}
    {:else}
      <ArrowUpDown class="ml-2 h-4 w-4 opacity-40" />
    {/if}
  </Button>
{/snippet}

{#snippet actionSnippet({ id }: { id: string })}
  <Button
    variant="ghost"
    size="icon"
    href={`/members/${id}`}
    class="h-8 w-8 text-muted-foreground hover:text-foreground">
    <span class="sr-only">View profile</span>
    <ChevronRight class="h-4 w-4" />
  </Button>
{/snippet}

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Members</h1>
      <p class="text-muted-foreground mt-2">Manage your athletes, coaches, and staff directory.</p>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-3">
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search members..."
          bind:value={globalFilter}
          class="pl-9 bg-background h-9" />
      </div>

      <form
        method="POST"
        action="?/invite"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === 'success') toast.success(result.data?.message || "Invite sent!");
            else toast.error("Failed to send invite.");
            await update();
          };
        }}
        class="flex items-center gap-2 w-full sm:w-auto">
        <Input
          type="email"
          name="email"
          placeholder="athlete@email.com"
          required
          class="h-9 w-full sm:w-56 bg-background" />
        <Button type="submit" size="sm" class="h-9 shrink-0">
          <Send class="w-4 h-4 mr-2" />
          Invite
        </Button>
      </form>
    </div>
  </div>

  <DataTable data={data.members} {columns} bind:globalFilter bind:sorting />
</div>
