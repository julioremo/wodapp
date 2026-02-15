<script lang="ts" generics="T">
  import * as Select from "$lib/components/ui/select";
  import {NativeSelect} from "$lib/components/ui/native-select";
  import { page } from '$app/state';

  let { 
    value = $bindable(), 
    items = [], 
    labelKey = "label" as keyof T,
    valueKey = "value" as keyof T,
    placeholder = "Select an option",
    name
  } = $props<{
    value: string | undefined;
    items: T[];
    labelKey?: keyof T;
    valueKey?: keyof T;
    placeholder?: string;
    name?: string;
  }>();

  // --- RESPONSIVENESS ---
  let isDesktop = $state(false);

  $effect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    isDesktop = mql.matches;
    const onChange = (e: MediaQueryListEvent) => isDesktop = e.matches;
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  });

  // Helper to find the label for the current value (for the trigger text)
  const selectedLabel = $derived(
    items.find(i => String(i[valueKey]) === value)?.[labelKey] as string || placeholder
  );
</script>

{#if isDesktop}
  <Select.Root type="single" bind:value {name}>
    <Select.Trigger class="w-full">
      {selectedLabel}
    </Select.Trigger>
    <Select.Content>
      {#each items as item}
        <Select.Item value={String(item[valueKey])} label={String(item[labelKey])}>
           {item[labelKey]}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  
  <input type="hidden" {name} bind:value />

{:else}
  <NativeSelect bind:value {name}>
      <option value="" disabled selected>{placeholder}</option>
      {#each items as item}
        <option value={String(item[valueKey])}>
            {item[labelKey]}
        </option>
      {/each}
  </NativeSelect>
{/if}