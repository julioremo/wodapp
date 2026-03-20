<script lang="ts">
import { Loader2 } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { superForm } from "sveltekit-superforms";
import { zod4Client as zodClient } from "sveltekit-superforms/adapters";
import PenaltyConfig from "$lib/components/settings/PenaltyConfig.svelte";

import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import * as InputGroup from "$lib/components/ui/input-group/index.js";
import { Label } from "$lib/components/ui/label";
import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
import * as Select from "$lib/components/ui/select/index.js";
import { Separator } from "$lib/components/ui/separator";
import { Switch } from "$lib/components/ui/switch";
import { bookingPoliciesSchema } from "@wodapp/core";

let { data } = $props();

const { form, errors, enhance, tainted, submitting } = superForm(data.form, {
  id: "policies-form",
  validators: zodClient(bookingPoliciesSchema),
  dataType: "json",
  resetForm: false,
  onUpdated({ form }) {
    if (form.valid) toast.success("Booking policies updated");
    else toast.error("Failed to save booking policies");
  }
});

// Defaulting to false for now, assuming you'll pass this from your layout or page server load
let hasLockedInPayments = data.hasLockedInPayments ?? false;

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" }
];

let selectedDayLabel = $derived(
  DAYS.find((d) => d.value === $form.policies.booking_opens.dayOfWeek)?.label ?? "Select Day"
);

let cancellationSummary = $derived.by(() => {
  const p = $form.policies.cancellation;
  if (!p.active) return "No penalty applied.";

  const pen = p.penalty;
  let consequence = "a credit deduction";
  if (pen.type === "fee") consequence = `a €${pen.amount || 0} fee`;
  if (pen.type === "booking_delay") consequence = `a ${pen.delay_minutes || 0} min booking delay`;

  return `Cancelling within ${p.window_hours || 0} hours adds a strike. ${pen.strikes || 1} strikes trigger ${consequence}.`;
});
</script>

<div class="px-6 mb-6">
  <h3 class="text-lg font-medium">Booking Policies</h3>
  <p class="text-sm text-muted-foreground">
    Set the rules for when members can book and cancel classes.
  </p>
</div>

<form method="POST" use:enhance>
  <Card.Root>
    <!-- <Card.Header>
      <Card.Title>Booking Policies</Card.Title>
      <Card.Description
        >Set the rules for when members can book and cancel classes.</Card.Description
      >
    </Card.Header> -->

    <Card.Content class="space-y-4">
      <div class="space-y-4">
        <div class="flex flex-col space-y-1">
          <Label class="text-base">Booking Opens</Label>
          <span class="text-xs text-muted-foreground"
            >When members can first see and reserve spots.</span
          >
        </div>

        <RadioGroup.Root bind:value={$form.policies.booking_opens.type} class="space-y-3">
          <div class="flex items-center space-x-2">
            <RadioGroup.Item value="immediately" id="bo-imm" />
            <Label for="bo-imm" class="font-normal cursor-pointer">As soon as scheduled</Label>
          </div>

          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="fixed_day" id="bo-fixed" />
              <Label for="bo-fixed" class="font-normal cursor-pointer"
                >Specific day the previous week</Label
              >
            </div>
            {#if $form.policies.booking_opens.type === "fixed_day"}
              <div class="ml-6 flex items-center gap-3 p-3 bg-muted/40 rounded-md border">
                <Select.Root
                  type="single"
                  value={$form.policies.booking_opens.dayOfWeek?.toString()}
                  onValueChange={(v) => $form.policies.booking_opens.dayOfWeek = v ? parseInt(v, 10) : null}>
                  <Select.Trigger class="w-32 h-8 bg-background text-sm"
                    >{selectedDayLabel}</Select.Trigger
                  >
                  <Select.Content>
                    <Select.Item value="1" label="Monday" />
                    <Select.Item value="2" label="Tuesday" />
                    <Select.Item value="3" label="Wednesday" />
                    <Select.Item value="4" label="Thursday" />
                    <Select.Item value="5" label="Friday" />
                    <Select.Item value="6" label="Saturday" />
                    <Select.Item value="0" label="Sunday" />
                  </Select.Content>
                </Select.Root>
                <span class="text-sm text-muted-foreground">at</span>
                <Input
                  type="number"
                  bind:value={$form.policies.booking_opens.hour}
                  class="w-20 h-8 bg-background"
                  placeholder="12" />
                <span class="text-sm text-muted-foreground">:00</span>
              </div>
            {/if}
          </div>

          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="rolling_days" id="bo-rolling" />
              <Label for="bo-rolling" class="font-normal cursor-pointer"
                >Rolling window before class</Label
              >
            </div>
            {#if $form.policies.booking_opens.type === "rolling_days"}
              <div class="ml-6 flex items-center gap-3 p-3 bg-muted/40 rounded-md border">
                <Input
                  type="number"
                  bind:value={$form.policies.booking_opens.days}
                  class="w-20 h-8 bg-background"
                  placeholder="7" />
                <span class="text-sm text-muted-foreground">days prior</span>
              </div>
            {/if}
          </div>
        </RadioGroup.Root>
      </div>

      <Separator />

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex flex-col space-y-1">
            <Label for="bc-switch" class="text-base cursor-pointer">Booking Closes</Label>
            <span class="text-xs text-muted-foreground"
              >Lock the roster shortly before class starts.</span
            >
          </div>
          <Switch id="bc-switch" bind:checked={$form.policies.booking_closes.active} />
        </div>

        {#if $form.policies.booking_closes.active}
          <div class="flex items-center gap-3 p-4 bg-muted/40 rounded-md border">
            <span class="text-sm">Locks</span>
            <Input
              type="number"
              bind:value={$form.policies.booking_closes.minutes_prior}
              class="w-20 h-8 bg-background"
              placeholder="0" />
            <span class="text-sm text-muted-foreground">minutes before start time</span>
          </div>
        {/if}
      </div>

      <Separator />

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex flex-col space-y-1">
            <Label for="cw-switch" class="text-base cursor-pointer">Cancellation Penalty</Label>
            <span class="text-xs text-muted-foreground">Consequences for late drops.</span>
          </div>
          <Switch id="cw-switch" bind:checked={$form.policies.cancellation.active} />
        </div>

        {#if $form.policies.cancellation.active}
          <div class="space-y-4 p-4 bg-muted/40 rounded-md border">
            <div class="flex items-center gap-3">
              <span class="text-sm w-24">Window</span>
              <InputGroup.Root class="w-40 bg-background h-8">
                <InputGroup.Input
                  type="number"
                  bind:value={$form.policies.cancellation.window_hours}
                  class="text-right h-8" />
                <InputGroup.Addon align="inline-end" class="h-8"
                  ><InputGroup.Text class="text-xs">hours prior</InputGroup.Text></InputGroup.Addon
                >
              </InputGroup.Root>
            </div>

            <PenaltyConfig
              bind:penalty={$form.policies.cancellation.penalty}
              {hasLockedInPayments} />

            <Badge variant="secondary" class="mt-2">{cancellationSummary}</Badge>
          </div>
        {/if}
      </div>

      <Separator />

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex flex-col space-y-1">
            <Label
              for="ns-switch"
              class="text-base cursor-pointer {hasLockedInPayments ? '' : 'text-muted-foreground'}"
              >No-Show Penalty</Label
            >
            <span class="text-xs text-muted-foreground">
              {#if hasLockedInPayments}
                Charge users who fail to attend or cancel.
              {:else}
                Requires locked-in payment methods to activate.
              {/if}
            </span>
          </div>
          <Switch
            id="ns-switch"
            bind:checked={$form.policies.no_show.active}
            disabled={!hasLockedInPayments} />
        </div>

        {#if $form.policies.no_show.active && hasLockedInPayments}
          <div class="space-y-4 p-4 bg-muted/40 rounded-md border">
            <PenaltyConfig bind:penalty={$form.policies.no_show.penalty} {hasLockedInPayments} />
          </div>
        {/if}
      </div>

      <Separator />

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex flex-col space-y-1">
            <Label for="wl-switch" class="text-base cursor-pointer">Waitlist</Label>
            <span class="text-xs text-muted-foreground">Allow queuing for full classes.</span>
          </div>
          <Switch id="wl-switch" bind:checked={$form.policies.waitlist.active} />
        </div>

        {#if $form.policies.waitlist.active}
          <div class="space-y-4 p-4 bg-muted/40 rounded-md border">
            <div class="flex items-center gap-3">
              <span class="text-sm w-24">Max Size</span>
              <Input
                type="number"
                bind:value={$form.policies.waitlist.max_size}
                class="w-24 h-8 bg-background"
                placeholder="No limit" />
            </div>

            <div class="flex items-start gap-3">
              <span class="text-sm w-24 pt-1.5">Automation</span>
              <div class="flex-1 space-y-3">
                <RadioGroup.Root bind:value={$form.policies.waitlist.mode}>
                  <div class="flex items-center space-x-2">
                    <RadioGroup.Item value="broadcast" id="wl-broad" />
                    <Label for="wl-broad" class="font-normal cursor-pointer"
                      >Broadcast (First come, first served)</Label
                    >
                  </div>
                  <div class="flex items-center space-x-2">
                    <RadioGroup.Item value="auto_enroll" id="wl-auto" />
                    <Label for="wl-auto" class="font-normal cursor-pointer">Auto-Enroll</Label>
                  </div>
                </RadioGroup.Root>

                {#if $form.policies.waitlist.mode === 'auto_enroll'}
                  <div
                    class="flex items-center gap-2 mt-2 pt-2 border-t border-muted-foreground/20">
                    <span class="text-sm text-muted-foreground">Stop auto-enrolling</span>
                    <Input
                      type="number"
                      bind:value={$form.policies.waitlist.auto_enroll_cutoff_hours}
                      class="w-20 h-8 bg-background" />
                    <span class="text-sm text-muted-foreground"
                      >hours before class, fallback to broadcast.</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </Card.Content>

    <Card.Footer class="bg-muted/10 border-t px-6 py-4 flex justify-end">
      <Button type="submit" size="sm" disabled={!$tainted || $submitting}>
        {#if $submitting}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Saving...
        {:else}
          Save Policies
        {/if}
      </Button>
    </Card.Footer>
  </Card.Root>
</form>
