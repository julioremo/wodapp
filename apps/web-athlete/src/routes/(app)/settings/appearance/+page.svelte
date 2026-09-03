<script lang="ts">
import * as Form from "@ui/form";
import * as RadioGroup from "@ui/radio-group";
import { toast } from "@ui/sonner";
import type { UserPreferences } from "@wodapp/core";
import { setMode } from "mode-watcher";
import { getContext, tick } from "svelte";
import { superForm } from "sveltekit-superforms";
import BackButton from "$lib/components/BackButton.svelte";
import AppHeader from "$lib/components/layout/AppHeader.svelte";

let { data } = $props();

const formObj = superForm(data.form, {
  dataType: "json",
  resetForm: false,
  invalidateAll: "force",
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
  },
});

const { form: formData, enhance, submit } = formObj;

const themeOptions: Array<{
  value: UserPreferences["appearance"]["theme"];
  label: string;
}> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System default" },
];
</script>

<div class="max-w-xl mx-auto p-2">
  <AppHeader title="Appearance">
    {#snippet left()}
      <BackButton backUrl="/settings" />
    {/snippet}
  </AppHeader>

  <div class="pb-24">
    <form method="POST" use:enhance class="space-y-6">
      <input
        type="hidden"
        name="preferences.appearance.theme"
        value={$formData.preferences.appearance.theme} />

      <Form.Field form={formObj} name="preferences.appearance.theme">
        <Form.Control>
          {#snippet children({ props })}
            <div class="space-y-2">
              <!-- <Form.Label class="text-muted-foreground ml-1">Theme</Form.Label> -->
              <RadioGroup.Root
                {...props}
                bind:value={$formData.preferences.appearance.theme}
                class="flex flex-col gap-0 overflow-hidden"
                onValueChange={async (newValue: string) => {
                  const nextTheme = newValue as "light" | "dark" | "system";
                  // Update DOM instantly, then save
                  setMode(nextTheme);
                  await tick();
                  submit();
                }}>
                {#each themeOptions as option}
                  <RadioGroup.Row
                    value={option.value}
                    label={option.label}
                    class="pl-12 text-lg" />
                {/each}
              </RadioGroup.Root>
            </div>

            <Form.FieldErrors />
          {/snippet}
        </Form.Control>
      </Form.Field>
    </form>
  </div>
</div>
