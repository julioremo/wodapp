<script lang="ts">
import { Check, ChevronLeft, SquarePen, X } from "@lucide/svelte";
import { Button } from "@ui/button";
import { toast } from "@ui/sonner";
import { personalInfoSchema, type UserProfile } from "@wodapp/core";
import { superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import AppHeader from "$lib/components/layout/AppHeader.svelte";
import HeaderBackCancel from "$lib/components/layout/HeaderBackCancel.svelte";
import HeaderEditSave from "$lib/components/layout/HeaderEditSave.svelte";
import SettingsDynamicField from "../SettingsDynamicField.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
let isEditing = $state(false);

const formObj = superForm(data.form, {
  validators: zod4Client(personalInfoSchema),
  resetForm: false,
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
    if (form.valid) {
      isEditing = false;
    }
  },
});

const { form: formData, enhance, submitting, reset } = formObj;

function handleCancel() {
  reset();
  isEditing = false;
}

type FieldDef = {
  key: keyof UserProfile;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: { label: string; value: string }[];
  colSpan?: 1 | 2;
  suffix?: string;
};

const accountFields: FieldDef[] = [
  { key: "first_name", label: "First Name", type: "text", colSpan: 2 },
  { key: "last_name", label: "Last Name", type: "text", colSpan: 2 },
  { key: "phone", label: "Phone", type: "text", colSpan: 2 },
  // { key: "emoji", label: "Emoji", type: "text", colSpan: 2 },
  // { key: "display_name", label: "Display Name", type: "text", colSpan: 2 },
  // { key: "avatar_url", label: "Display Name", type: "file", colSpan: 2 },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  // converts native YYYY-MM-DD to DD / MM / YYYY.
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
  return dateStr;
}
</script>

<div class="max-w-xl mx-auto p-2">
  <AppHeader title="Personal Info">
    {#snippet left()}
      <HeaderBackCancel {isEditing} onCancel={() => (isEditing = false)} />
    {/snippet}

    {#snippet right()}
      <HeaderEditSave
        {isEditing}
        submitting={$submitting}
        formId="profile-form"
        onEdit={() => (isEditing = true)} />
    {/snippet}
  </AppHeader>

  <div class="px-12 pb-24">
    <form
      id="personal-info-form"
      method="POST"
      use:enhance
      class="grid grid-cols-2 space-y-12">
      {#each accountFields as field}
        <SettingsDynamicField
          {formObj}
          name={field.key}
          label={field.label}
          type={field.type}
          options={field.options}
          suffix={field.suffix}
          colSpan={field.colSpan}
          {isEditing}
          bind:value={$formData[field.key]} />
      {/each}
    </form>
  </div>
</div>
