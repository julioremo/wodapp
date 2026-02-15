<script lang="ts">
  import { cn } from "$lib/utils";
  import { Eye, EyeOff } from "lucide-svelte";
  import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../input-group";
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    class: className,
    value = $bindable(),
    type,
    files,
    ...props
  }: HTMLInputAttributes = $props();

  let show = $state(false);

  function handleToggle(e: MouseEvent) {
    e.preventDefault();
    show = !show;
  }
</script>

<InputGroup>
  <InputGroupInput {...props} type={show ? "text" : "password"} class={cn(className)} bind:value />

  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" onclick={handleToggle} type="button">
      {#if show}
        <EyeOff class="h-4 w-4" />
      {:else}
        <Eye class="h-4 w-4" />
      {/if}
      <span class="sr-only">{show ? "Hide" : "Show"} password</span>
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>
