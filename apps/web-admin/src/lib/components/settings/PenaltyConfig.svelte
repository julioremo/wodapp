<script lang="ts">
import type { z } from "zod";
import { Input } from "$lib/components/ui/input";
import * as InputGroup from "$lib/components/ui/input-group/index.js";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select/index.js";
import { Switch } from "$lib/components/ui/switch";

import type { penaltySchema } from "$lib/schemas/settings";

let {
  penalty = $bindable(),
  hasLockedInPayments
}: {
  penalty: z.infer<typeof penaltySchema>;
  hasLockedInPayments: boolean;
} = $props();

function handleTypeChange(newType: string) {
  // Preserve the current strikes value when switching types
  const currentStrikes = penalty.strikes;

  if (newType === "credit_deduction") {
    penalty = { type: "credit_deduction", strikes: currentStrikes, needs_confirmation: false };
  } else if (newType === "booking_delay") {
    penalty = {
      type: "booking_delay",
      strikes: currentStrikes,
      delay_minutes: 60,
      needs_confirmation: false
    };
  } else if (newType === "fee") {
    penalty = { type: "fee", strikes: currentStrikes, amount: 5.0, needs_confirmation: false };
  }
}
</script>

<div class="space-y-4">
  <div class="flex items-center gap-3">
    <span class="text-sm w-24">Tolerance</span>
    <InputGroup.Root class="w-40 bg-background h-8">
      <InputGroup.Input type="number" bind:value={penalty.strikes} class="text-right h-8" />
      <InputGroup.Addon align="inline-end" class="h-8"
        ><InputGroup.Text class="text-xs">strikes</InputGroup.Text></InputGroup.Addon
      >
    </InputGroup.Root>
  </div>

  <div class="flex items-start gap-3">
    <span class="text-sm w-24 pt-1.5">Consequence</span>
    <div class="flex-1 space-y-3">
      <Select.Root type="single" value={penalty.type} onValueChange={handleTypeChange}>
        <Select.Trigger class="w-64 bg-background h-8 text-sm">Select Penalty</Select.Trigger>
        <Select.Content>
          <Select.Item value="credit_deduction" label="Credit Deduction" />
          <Select.Item value="booking_delay" label="Booking Window Delay" />
          {#if hasLockedInPayments}
            <Select.Item value="fee" label="Financial Fee" />
          {/if}
        </Select.Content>
      </Select.Root>

      {#if penalty.type === 'booking_delay'}
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Delay by</span>
          <Input type="number" bind:value={penalty.delay_minutes} class="w-20 h-8 bg-background" />
          <span class="text-sm text-muted-foreground">minutes</span>
        </div>
      {/if}

      {#if penalty.type === 'fee'}
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Charge</span>
          <Input type="number" bind:value={penalty.amount} class="w-20 h-8 bg-background" />
          <span class="text-sm text-muted-foreground">€</span>
        </div>
      {/if}

      <div class="flex items-center justify-between mt-4 pt-4 border-t border-muted-foreground/20">
        <div class="flex flex-col space-y-1">
          <Label for="confirm-switch" class="text-sm cursor-pointer">Require Manual Review</Label>
          <span class="text-xs text-muted-foreground"
            >Do not apply automatically. Managers must approve this penalty.</span
          >
        </div>
        <Switch id="confirm-switch" bind:checked={penalty.needs_confirmation} />
      </div>
    </div>
  </div>
</div>
