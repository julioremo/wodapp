<script lang="ts">
import { page } from "$app/stores";
import { buttonVariants } from "$lib/components/ui/button";
import { cn } from "$lib/utils";

let { children } = $props();

const navItems = [
  {
    title: "Schedule",
    href: "/settings/schedule"
  },
  {
    title: "Class Types",
    href: "/settings/classes"
  },
  {
    title: "Booking Policies",
    href: "/settings/policies"
  }
];
</script>

<div class="max-w-6xl mx-auto p-6 space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Gym Settings</h1>
    <p class="text-muted-foreground mt-2">Manage your schedule configuration and operations.</p>
  </div>

  <div class="flex flex-col md:flex-row gap-8">
    <aside class="md:w-1/5 shrink-0">
      <nav
        class="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
        {#each navItems as item}
          <a
            href={item.href}
            class={cn(
              buttonVariants({ variant: "ghost" }),
              $page.url.pathname.includes(item.href)
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start text-sm"
            )}>
            {item.title}
          </a>
        {/each}
      </nav>
    </aside>

    <main class="flex-1 min-w-0">{@render children()}</main>
  </div>
</div>
