<script lang="ts">
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import * as InputGroup from "@ui/input-group/index.js";
import { Label } from "@ui/label";
import * as Select from "@ui/select/index.js";
import { Switch } from "@ui/switch";
import type { Penalty } from "@wodapp/core";

let {
  penalty = $bindable(),
  hasLockedInPayments
}: {
  penalty: Penalty | null;
  hasLockedInPayments: boolean;
} = $props();

function handleTypeChange(newType: string | undefined) {
  if (!newType) return;
  // Safely preserve strikes if the outgoing type had them, otherwise default to 1
  const currentStrikes = penalty && "strikes" in penalty ? penalty.strikes : 1;

  if (newType === "credit_deduction") {
    penalty = {
      type: "credit_deduction",
      strikes: currentStrikes,
      needs_confirmation: false
    };
  } else if (newType === "booking_delay") {
    penalty = {
      type: "booking_delay",
      strikes: currentStrikes,
      delay_minutes: 0.5,
      needs_confirmation: false
    };
  } else if (newType === "fee") {
    penalty = {
      type: "fee",
      strikes: currentStrikes,
      amount: 5.0,
      needs_confirmation: true
    };
  }
}

function addPenalty() {
  penalty = { type: "credit_deduction", strikes: 1, needs_confirmation: false };
}

function removePenalty() {
  penalty = null;
}
</script>

{#if penalty}
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
        <Select.Root
          type="single"
          value={penalty.type}
          onValueChange={(opt: any) => {
            const val = typeof opt === 'string' ? opt : opt?.value;
            if (val) handleTypeChange(val);
          }}>
          <Select.Trigger class="w-64 bg-background h-8 text-sm">Select Penalty</Select.Trigger>
          <Select.Content>
            <Select.Item value="credit_deduction" label="Credit Deduction" />
            <Select.Item value="booking_delay" label="Booking Window Delay" />
            {#if hasLockedInPayments}
              <Select.Item value="fee" label="Financial Fee" />
            {/if}
          </Select.Content>
        </Select.Root>

        {#if penalty.type === "booking_delay"}
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Delay by</span>
            <Input
              type="number"
              bind:value={penalty.delay_minutes}
              class="w-20 h-8 bg-background" />
            <span class="text-sm text-muted-foreground">minutes</span>
          </div>
        {/if}

        {#if penalty.type === "fee"}
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Charge</span>
            <Input type="number" bind:value={penalty.amount} class="w-20 h-8 bg-background" />
            <span class="text-sm text-muted-foreground">€</span>
          </div>
        {/if}

        <div
          class="flex items-center justify-between mt-4 pt-4 border-t border-muted-foreground/20">
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
    <Button variant="destructive" size="sm" onclick={removePenalty}>Remove Penalty</Button>
  </div>
{:else}
  <Button onclick={addPenalty}>Add Penalty</Button>
{/if}
