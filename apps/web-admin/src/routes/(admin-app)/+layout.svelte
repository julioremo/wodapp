<script lang="ts">
import {
  Calendar,
  ClipboardList,
  Dumbbell,
  House,
  LibraryBig,
  Settings,
  Users
} from "lucide-svelte";
import { Button } from "$lib/components/ui/button";

let { data, children } = $props();

const navItems = [
  { label: "Home", href: `/`, icon: House },
  { label: "Schedule", href: `/schedule`, icon: Calendar },
  { label: "Programming", href: `/programming`, icon: ClipboardList },
  { label: "Workout Library", href: `/workouts`, icon: LibraryBig },
  { label: "Members", href: `/members`, icon: Users },
  { label: "Staff", href: `/staff`, icon: Dumbbell },
  { label: "Settings", href: `/settings`, icon: Settings }
];
</script>

<div class="flex h-screen">
  <aside class="w-16 md:w-48 lg:w-60 2xl:w-80 border-r bg-muted/20 hidden md:block">
    <div class="p-2 md:p-6 h-full flex flex-col">
      {#if data.location}
        <div class="mb-8">
          <h2 class="font-bold text-lg tracking-tight">{data.location.name}</h2>
          <p class="text-xs text-muted-foreground uppercase hidden md:block">{data.userRole}</p>
        </div>

        <nav class="space-y-1 flex-1">
          {#each navItems as item}
            {@const Icon = item.icon}
            <Button
              href={item.href}
              variant="ghost"
              class="w-full justify-center md:justify-start rounded-full text-muted-foreground">
              <Icon class="w-4 h-4" />
              <span class="hidden md:inline-block">{item.label}</span>
            </Button>
          {/each}
        </nav>
      {:else}
        <div class="animate-pulse h-8 bg-muted rounded"></div>
      {/if}
    </div>
  </aside>

  <main class="flex-1 overflow-y-auto">{@render children()}</main>
</div>
