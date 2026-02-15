<script lang="ts">
  import { type Snippet } from "svelte";

  let { title, subtitle, utility, controls, children } = $props<{
    title: string | Snippet;
    subtitle?: string | Snippet;
    utility?: Snippet;
    controls?: Snippet;
    children: Snippet;
  }>();
</script>

<div class="flex flex-col h-full gap-5 overflow-hidden">
  <div class="flex items-center justify-between shrink-0">
    <div>
      <h1 class="text-3xl tracking-tight text-foreground">
        {#if typeof title === "string"}
          <span class="font-bold inline-block">{title}</span>
        {:else}
          {@render title()}
        {/if}
      </h1>

      {#if subtitle}
        <div class="text-muted-foreground mt-1">
          {#if typeof subtitle === "string"}
            {subtitle}
          {:else}
            {@render subtitle()}
          {/if}
        </div>
      {/if}
    </div>

    {#if controls}
      <div class="flex items-center gap-4">
        {@render controls()}
      </div>
    {/if}

    {#if utility}
      <div class="flex justify-end shrink-0">
        {@render utility()}
      </div>
    {/if}
  </div>

  <div class="flex-1 min-h-0 relative">
    {@render children()}
  </div>
</div>
