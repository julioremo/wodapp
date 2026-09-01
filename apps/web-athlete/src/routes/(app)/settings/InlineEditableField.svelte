<script lang="ts">
import { Button } from "@ui/button";
import * as Form from "@ui/form";
import { Input } from "@ui/input";
import * as InputGroup from "@ui/input-group";
import type { SuperForm } from "sveltekit-superforms";
import { formatDate } from "$lib/utils";

let {
  formObj,
  name,
  label,
  type = "text",
  options,
  suffix,
  isEditing = $bindable(false),
  value = $bindable(),
}: {
  formObj: SuperForm<any>;
  name: string;
  label: string;
  type?: string;
  options?: Array<{ label: string; value: string }>;
  suffix?: string;
  isEditing?: boolean;
  value: any;
} = $props();

const { submitting } = formObj;

let containerNode: HTMLElement | undefined = $state();
let backupValue = $state(value);

function startEditing() {
  backupValue = value;
  isEditing = true;
}

function cancelEditing() {
  value = backupValue;
  isEditing = false;
}

$effect(() => {
  if (!isEditing) return;

  const handleClickOutside = (e: PointerEvent) => {
    if (containerNode && !containerNode.contains(e.target as Node)) {
      cancelEditing();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") cancelEditing();
  };

  // Defer attachment slightly to prevent the Edit button click from triggering cancellation instantly
  const timeout = setTimeout(() => {
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
  }, 0);

  return () => {
    clearTimeout(timeout);
    document.removeEventListener("pointerdown", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  };
});
</script>

<div bind:this={containerNode}>
  <Form.Field form={formObj} {name}>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label class="text-lg font-medium text-grey-400"
          >{label}</Form.Label>

        <div class="flex flex-row items-center justify-between gap-2">
          {#if isEditing}
            {#if suffix}
              <InputGroup.Root class="w-full h-8">
                <InputGroup.Input {...props} {type} bind:value />
                <InputGroup.Addon align="inline-end">
                  <InputGroup.Text>{suffix}</InputGroup.Text>
                </InputGroup.Addon>
              </InputGroup.Root>
            {:else}
              <Input {...props} {type} bind:value class="w-full h-8" />
            {/if}

            <Button
              type="submit"
              disabled={$submitting}
              class="rounded-none animate-in fade-in duration-200">
              {$submitting ? "Saving..." : "Save"}
            </Button>
          {:else}
            <div
              id={props.id}
              class="h-8 py-2 w-full text-sm font-medium {type === 'select'
                ? 'capitalize'
                : ''}">
              {#if value}
                {#if type === "date"}
                  {formatDate(value as string)}
                {:else}
                  {value} {suffix || ""}
                {/if}
              {:else}
                <span class="text-muted-foreground">—</span>
              {/if}
            </div>

            <Button
              type="button"
              variant="outline"
              class="rounded-none"
              onclick={startEditing}>
              Edit
            </Button>
          {/if}
        </div>
      {/snippet}
    </Form.Control>

    {#if isEditing}
      <Form.FieldErrors />
    {/if}
  </Form.Field>
</div>
