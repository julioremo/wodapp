<script lang="ts">
import * as Form from "@ui/form";
import { Input } from "@ui/input";
import * as InputGroup from "@ui/input-group";
import * as Select from "@ui/select";
import type { SuperForm } from "sveltekit-superforms";
import { formatDate } from "$lib/utils";

let {
  formObj,
  name,
  label,
  type = "text",
  options,
  suffix,
  colSpan = 1,
  isEditing,
  value = $bindable(),
}: {
  formObj: SuperForm<any>;
  name: string;
  label: string;
  type?: string;
  options?: Array<{ label: string; value: string }>;
  suffix?: string;
  colSpan?: number;
  isEditing: boolean;
  value: any;
} = $props();
</script>

<Form.Field
  form={formObj}
  name={name as any}
  class="{colSpan === 2 ? 'col-span-2' : 'col-span-1'} h-9">
  <Form.Control>
    {#snippet children({ props })}
      <div
        class="animate-in fade-in duration-200 space-y-1 text-md font-medium">
        <Form.Label class="text-md font-medium text-grey-400">
          {label}
        </Form.Label>

        {#if isEditing}
          <div class="w-full -mr-3">
            {#if type === "select" && options}
              <Select.Root type="single" name={props.name} bind:value>
                <Select.Trigger {...props} class="h-9 w-full">
                  {value
                    ? options.find((o) => o.value === value)?.label
                    : `Select ${label.toLowerCase()}`}
                </Select.Trigger>
                <Select.Content>
                  {#each options as option}
                    <Select.Item value={option.value}
                      >{option.label}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {:else if suffix}
              <InputGroup.Root class="h-9 w-full">
                <InputGroup.Input {...props} {type} bind:value />
                <InputGroup.Addon align="inline-end">
                  <InputGroup.Text>{suffix}</InputGroup.Text>
                </InputGroup.Addon>
              </InputGroup.Root>
            {:else}
              <Input {...props} {type} bind:value class="h-9 w-full" />
            {/if}
          </div>
        {:else}
          <!-- Read-only mode: use props.id so the Label finds its target -->
          <div
            id={props.id}
            class="h-9 py-2 w-full text-sm {type === 'select'
              ? 'capitalize'
              : ''}">
            {#if value}
              {#if type === "date"}
                {formatDate(value as string)}
              {:else}
                {value} {suffix || ""}
              {/if}
            {:else}
              —
            {/if}
          </div>
        {/if}
      </div>
    {/snippet}
  </Form.Control>

  {#if isEditing}
    <Form.FieldErrors />
  {/if}
</Form.Field>
