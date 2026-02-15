<script lang="ts">
  import { onMount } from "svelte";
  import { cn } from "$lib/utils"; // Assuming you have a standard class merger

  export let variant: "circle" | "strike" | "underline" = "circle";
  export let color: string = "text-destructive"; // Tailwind text color class
  export let strokeWidth: number = 2;
  export let className: string = "";

  let visible = false;

  onMount(() => {
    // Trigger animation shortly after mount
    setTimeout(() => (visible = true), 100);
  });
</script>

<div class={cn("absolute pointer-events-none select-none overflow-visible z-20", className, color)}>
  <svg viewBox="0 0 100 60" preserveAspectRatio="none" class="w-full h-full overflow-visible">
    {#if variant === "circle"}
      <path
        d="M10,25 C15,5 80,0 90,20 C100,45 20,55 10,35 C5,20 60,15 80,30"
        fill="none"
        stroke="currentColor"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-all duration-700 ease-out"
        style:stroke-dasharray="300"
        style:stroke-dashoffset={visible ? 0 : 300}
      />
    {:else if variant === "strike"}
      <path
        d="M-5,30 Q 25,25 50,30 T 105,28"
        fill="none"
        stroke="currentColor"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        class="transition-all duration-300 ease-linear"
        style:stroke-dasharray="120"
        style:stroke-dashoffset={visible ? 0 : 120}
      />
    {:else if variant === "underline"}
      <path
        d="M0,50 Q 50,55 100,50 M 5,55 Q 55,60 95,55"
        fill="none"
        stroke="currentColor"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        opacity="0.6"
        class="transition-all duration-500 ease-out"
        style:stroke-dasharray="200"
        style:stroke-dashoffset={visible ? 0 : 200}
      />
    {/if}
  </svg>
</div>
