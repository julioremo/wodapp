<script lang="ts">
import { toast } from "@ui/sonner";
import { privacyPreferencesSchema, type UserPreferences } from "@wodapp/core";
import { superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import BackButton from "$lib/components/BackButton.svelte";
import AppHeader from "$lib/components/layout/AppHeader.svelte";
import SettingsSwitchField from "../SettingsSwitchField.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

const formObj = superForm(data.form, {
  dataType: "json",
  validators: zod4Client(privacyPreferencesSchema),
  resetForm: false,
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
  },
});

const { form: formData, enhance, submit } = formObj;

type PrivacyField = {
  key: keyof UserPreferences["privacy"];
  label: string;
  description: string;
};

const privacyFields: PrivacyField[] = [
  {
    key: "show_on_leaderboard",
    label: "Show on leaderboards",
    description: "Your benchmarks will be visible to other users.",
  },
  {
    key: "allow_data_usage_for_research",
    label: "Share data for research",
    description:
      "Your benchmarks, gender, age and weight will be used by app developers as anonymized data to improve the app.",
  },
];
</script>

<div class="max-w-xl mx-auto p-2">
  <AppHeader title="Privacy">
    {#snippet left()}
      <BackButton backUrl="/settings" />
    {/snippet}
  </AppHeader>

  <div class="px-12 pb-24">
    <form
      method="POST"
      use:enhance
      onchange={(e) => e.currentTarget.requestSubmit()}
      class="space-y-6">
      {#each privacyFields as field}
        <SettingsSwitchField
          {formObj}
          name={`preferences.privacy.${field.key}`}
          label={field.label}
          description={field.description}
          bind:checked={$formData.preferences.privacy[field.key]}
          onSubmit={submit} />
      {/each}
    </form>
  </div>
</div>
