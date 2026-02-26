<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import { tick } from "svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";

  type ComboboxOption = {
    value: string;
    label: string;
    [key: string]: any; // Allow extra data (like class_type)
  };

  let {
    value = $bindable(""),
    options = [],
    placeholder = "Select item...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    triggerClass = "w-[200px]",
    nullable = true,
    itemSnippet
  } = $props<{
    value?: string;
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerClass?: string;
    nullable?: boolean;
    itemSnippet?: Snippet<[{ option: ComboboxOption; isSelected: boolean }]>;
  }>();

  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement>(null!);

  const selectedValue = $derived(options.find((o) => o.value === value)?.label);

  // We want to refocus the trigger button when the user selects
  // an item from the list so users can continue navigating the
  // rest of the form with the keyboard.
  function closeAndFocusTrigger() {
    open = false;
    tick().then(() => {
      triggerRef.focus();
    });
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        class={cn(triggerClass, "justify-between")}
        role="combobox"
        aria-expanded={open}
      >
        {selectedValue || placeholder}
        <ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class={cn("p-0", triggerClass)}>
    <Command.Root class="">
      <Command.Input placeholder={searchPlaceholder} />
      <Command.List>
        <Command.Empty>{emptyText}</Command.Empty>
        <Command.Group>
          {#if nullable}
            <Command.Item
              value="Unassigned"
              class="text-muted-foreground italic"
              onSelect={() => {
                value = ""; // Clear the value
                closeAndFocusTrigger();
              }}
            >
              <Check class={cn("mr-2 size-4", value ? "opacity-0" : "opacity-100")} />
              Unassigned
            </Command.Item>
            <Command.Separator />
          {/if}
          {#each options as option (option.value)}
            <Command.Item
              value={option.value}
              onSelect={() => {
                value = option.value;
                closeAndFocusTrigger();
              }}
            >
              <Check class={cn("me-2 size-4", value !== option.value && "text-transparent")} />

              {#if itemSnippet}
                {@render itemSnippet({ option, isSelected: value === option.value })}
              {:else}
                {option.label}
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
