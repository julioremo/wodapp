<script lang="ts">
import * as Form from "@ui/form";
import { Switch } from "@ui/switch";
import type { SuperForm } from "sveltekit-superforms";

let {
  formObj,
  name,
  label,
  description,
  checked = $bindable(),
  disabled = false,
  onSubmit,
}: {
  formObj: SuperForm<any>; // Generic type since this component handles any schema
  name: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onSubmit: () => void;
} = $props();
</script>

<Form.Field form={formObj} name={name as any} class="space-y-1">
  <Form.Control>
    {#snippet children({ props })}
      <div class="flex flex-row items-center justify-between">
        <Form.Label class="text-lg font-medium">{label}</Form.Label>

        <Switch
          {...props}
          bind:checked
          {disabled}
          onclick={() => {
            setTimeout(() => onSubmit(), 50);
          }} />
      </div>
      <Form.Description class="text-sm font-light mr-8"
        >{description}</Form.Description>
    {/snippet}
  </Form.Control>
</Form.Field>
