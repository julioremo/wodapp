<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  
  let { data, children } = $props();
  
  // Svelte 5: Derive the ID from the data prop instead of the page store
  let locationId = $derived(data.location?.id);
  
  const navItems = [
    { label: 'Home', href: `/` },
    { label: 'Schedule', href: `/schedule` },
    { label: 'Workouts', href: `/workouts`},
    { label: 'Members', href: `/members`},
    { label: 'Settings', href: `/settings`},
  ];
</script>

<div class="flex min-h-screen">
  <aside class="w-64 border-r bg-muted/20 hidden md:block">
    <div class="p-6 h-full flex flex-col">
      {#if data.location}
        <div class="mb-8">
          <h2 class="font-bold text-lg tracking-tight">{data.location.name}</h2>
          <p class="text-xs text-muted-foreground uppercase">{data.userRole}</p>
        </div>
        
        <nav class="space-y-1 flex-1">
          {#each navItems as item}
            <Button 
              href={item.href} 
              variant="ghost" 
              class="w-full justify-start"
            >
              {item.label}
            </Button>
          {/each}
        </nav>
      {:else}
        <div class="animate-pulse h-8 bg-muted rounded"></div>
      {/if}
    </div>
  </aside>

  <main class="flex-1 p-8 overflow-y-auto">
    {@render children()} 
  </main>
</div>