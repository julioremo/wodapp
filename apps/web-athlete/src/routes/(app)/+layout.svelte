<script lang="ts">
import { BicepsFlexed, ClipboardClock, UserRoundCog } from "@lucide/svelte";
import { page } from "$app/state";

let { children } = $props();

const navItems = [
  {
    href: "/schedule",
    label: "Schedule",
    icon: ClipboardClock
  },
  {
    href: "/benchmarks",
    label: "Benchmarks",
    icon: BicepsFlexed
  },
  {
    href: "/settings",
    label: "Settings",
    icon: UserRoundCog
  }
];

const isActive = (path: string) => page.url.pathname.startsWith(path);
</script>

<div
  class="flex flex-col h-screen max-w-md mx-auto bg-background pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
  <main class="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
    {@render children()}
  </main>

  <nav
    class="fixed bottom-0 w-full max-w-md bg-background border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
    <div class="grid grid-cols-3 h-16">
      {#each navItems as item (item.href)}
        {@const Icon = item.icon}
        {@const active = isActive(item.href)}
        <a
          href={item.href}
          class="flex flex-col items-center justify-center gap-1 {active
            ? 'text-primary'
            : 'text-muted-foreground'}">
          <Icon class="h-6 w-6" />
          <span class="text-xs font-medium">{item.label}</span>
        </a>
      {/each}
    </div>
  </nav>
</div>
