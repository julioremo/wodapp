<script lang="ts">
  import { Filter, X, Check } from 'lucide-svelte';
  import { fade, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { cn } from "$lib/utils";

  // State
  let isOpen = $state(false);
  let activeFilter = $state('all'); // 'all' | 'wod' | 'open_gym'

  function toggle() {
    isOpen = !isOpen;
  }

  function select(type: string) {
    activeFilter = type;
    // Optional: Close on select? 
    // isOpen = false; 
  }

  // The "Apple" Easing Curve (Fast launch, soft landing)
  const iosEase = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";
</script>

<div 
  class={cn(
    "relative bg-background border border-border shadow-sm overflow-hidden",
    "hover:shadow-md", 
    iosEase, // The magic easing
    isOpen ? "rounded-xl w-full max-w-[300px]" : "rounded-full w-10 h-10" // Morph shapes
  )}
>
  
  <div class="relative w-full h-full min-h-[40px] flex flex-col">

    <button 
      onclick={toggle}
      class="absolute top-0 left-0 w-10 h-10 flex items-center justify-center z-20 focus:outline-none"
    >
      <div class="relative w-5 h-5">
        <div class={cn("absolute inset-0 transition-opacity duration-300", isOpen ? "opacity-0" : "opacity-100")}>
            <Filter class="w-5 h-5 text-muted-foreground" />
        </div>
        <div class={cn("absolute inset-0 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")}>
            <X class="w-5 h-5 text-foreground" />
        </div>
      </div>
    </button>

    <div 
      class={cn(
        "flex flex-col pt-12 pb-4 px-4 gap-2 min-w-[280px]", // Padding top pushes content below the X button
        "transition-opacity duration-300 delay-100", // Delay ensures box opens before text appears
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}
    >
        <span class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Filter by Class Type</span>
        
        <button 
            class={cn("flex items-center justify-between p-2 rounded-md text-sm transition-colors", activeFilter === 'all' ? "bg-secondary" : "hover:bg-muted")}
            onclick={() => select('all')}
        >
            <span>All Classes</span>
            {#if activeFilter === 'all'}<Check class="w-4 h-4" />{/if}
        </button>

        <button 
            class={cn("flex items-center justify-between p-2 rounded-md text-sm transition-colors", activeFilter === 'wod' ? "bg-secondary" : "hover:bg-muted")}
            onclick={() => select('wod')}
        >
            <span>WOD</span>
            {#if activeFilter === 'wod'}<Check class="w-4 h-4" />{/if}
        </button>
        
        <button 
            class={cn("flex items-center justify-between p-2 rounded-md text-sm transition-colors", activeFilter === 'open_gym' ? "bg-secondary" : "hover:bg-muted")}
            onclick={() => select('open_gym')}
        >
            <span>Open Gym</span>
            {#if activeFilter === 'open_gym'}<Check class="w-4 h-4" />{/if}
        </button>
    </div>

  </div>
</div>