<script lang="ts">
import {
  BellOff,
  BellRing,
  ChevronLeft,
  TriangleAlert,
  X,
} from "@lucide/svelte";
import { Button } from "@ui/button";
import { toast } from "@ui/sonner";
import {
  notificationsPreferencesSchema,
  type UserPreferences,
} from "@wodapp/core";
import { onMount } from "svelte";
import { superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import { browser } from "$app/environment";
import SettingsHeader from "../SettingsHeader.svelte";
import SettingsSwitchField from "../SettingsSwitchField.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

const formObj = superForm(data.form, {
  dataType: "json",
  validators: zod4Client(notificationsPreferencesSchema),
  resetForm: false,
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
  },
});

const { form: formData, enhance, submit } = formObj;

type NotificationField = {
  key: keyof UserPreferences["notifications"];
  label: string;
  description: string;
  requiresPush: boolean;
};

const notificationFields: NotificationField[] = [
  {
    key: "workout_reminders",
    label: "Workout Reminders",
    description: "Get pinged 1 hour before class.",
    requiresPush: true,
  },
  {
    key: "marketing_emails",
    label: "Marketing Emails",
    description: "Receive updates about gym events and promos.",
    requiresPush: false,
  },
];

// 1. Permission state management
type PermStatus = NotificationPermission | "unsupported";
let permission = $state<PermStatus>("default");

function checkPermission() {
  if (!browser || !("Notification" in window)) {
    permission = "unsupported";
  } else {
    permission = Notification.permission;
  }
}

onMount(() => {
  checkPermission();
});

// 2. Request permission on explicit user click
async function requestBrowserPermission() {
  if (!("Notification" in window)) return;

  try {
    const result = await Notification.requestPermission();
    permission = result;

    if (result === "granted") {
      toast.success("Notifications enabled!");
    } else if (result === "denied") {
      toast.error("Notifications were blocked in your browser.");
    }
  } catch (err) {
    console.error("Error requesting permission:", err);
  }
}
</script>

<div class="max-w-xl mx-auto p-2">
  <SettingsHeader title="Notifications" />

  <div class="px-3 pb-8">
    {#if permission === "denied"}
      <div
        class="flex items-start gap-3.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-destructive">
        <BellOff class="h-5 w-5 shrink-0 mt-0.5" />
        <div class="text-sm space-y-1">
          <p class="font-medium">Notifications are blocked</p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Your browser or device is blocking notifications for this site. To
            receive alerts, please allow notifications in your browser's site
            settings or system preferences.
          </p>
        </div>
      </div>
      <!-- STATE 2: NOT YET REQUESTED (DEFAULT) -->
    {:else if permission === "default"}
      <div
        class="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-3">
        <div class="flex items-start gap-3">
          <BellRing class="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div class="text-sm">
            <p class="font-medium">Allow browser notifications</p>
            <p class="text-xs text-muted-foreground">
              Enable notifications to receive timely updates and reminders on
              this device.
            </p>
          </div>
        </div>
        <Button size="sm" onclick={requestBrowserPermission}>Enable</Button>
      </div>
      <!-- STATE 3: UNSUPPORTED (e.g. older browsers) -->
    {:else if permission === "unsupported"}
      <div
        class="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 text-muted-foreground">
        <TriangleAlert class="h-5 w-5 shrink-0" />
        <p class="text-xs">
          Web notifications are not supported on this browser.
        </p>
      </div>
    {/if}
  </div>
  <div class="pl-12 pr-3">
    <form
      method="POST"
      use:enhance
      onchange={(e) => e.currentTarget.requestSubmit()}
      class="space-y-9">
      {#each notificationFields as field}
        <SettingsSwitchField
          {formObj}
          name={`preferences.notifications.${field.key}`}
          label={field.label}
          description={field.description}
          bind:checked={$formData.preferences.notifications[field.key]}
          onSubmit={submit}
          disabled={field.requiresPush && permission !== "granted"} />
      {/each}
    </form>
  </div>
</div>
