<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import { Checkbox } from "$lib/components/ui/checkbox"; 
  // You might need to install checkbox: pnpm dlx shadcn-svelte@latest add checkbox
  
  let { data, form } = $props();
  let isRecurring = $state(false);

  const daysOfWeek = [
    { id: '1', label: 'Mon' },
    { id: '2', label: 'Tue' },
    { id: '3', label: 'Wed' },
    { id: '4', label: 'Thu' },
    { id: '5', label: 'Fri' },
    { id: '6', label: 'Sat' },
    { id: '0', label: 'Sun' },
  ];
</script>

<div class="max-w-2xl mx-auto p-6">
  <Card.Root>
    <Card.Header>
      <Card.Title>Add Class to Schedule</Card.Title>
    </Card.Header>
    <Card.Content>
      <form method="POST" class="space-y-6">
        
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="startDate">Date</Label>
                <Input type="date" class="block w-full" name="startDate" required />
            </div>
            <div class="space-y-2">
                <Label for="startTime">Start Time</Label>
                <Input type="time" name="startTime" required />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="duration">Duration (minutes)</Label>
                <Input type="number" name="duration" value="60" required />
            </div>
            <div class="space-y-2">
                <Label for="capacity">Capacity</Label>
                <Input type="number" name="capacity" value="15" required />
            </div>
        </div>

        <div class="space-y-2">
            <Label for="coachId">Coach (Optional)</Label>
            <select name="coachId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                <option value="">-- TBD --</option>
                {#each data.coaches as coach}
                    <option value={coach.id}>{coach.full_name}</option>
                {/each}
            </select>
        </div>

        <div class="p-4 border rounded-lg bg-muted/20 space-y-4">
            <div class="flex items-center space-x-2">
                <input type="checkbox" name="isRecurring" id="isRecurring" bind:checked={isRecurring} class="h-4 w-4" />
                <Label for="isRecurring" class="font-bold">Repeat this class</Label>
            </div>

            {#if isRecurring}
                <div class="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div class="space-y-2">
                        <Label>Repeat on</Label>
                        <div class="flex gap-4 flex-wrap">
                            {#each daysOfWeek as day}
                                <label class="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" name="days" value={day.id} class="h-4 w-4 rounded border-gray-300" />
                                    <span class="text-sm">{day.label}</span>
                                </label>
                            {/each}
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="recurUntil">Repeat Until</Label>
                        <Input type="date" name="recurUntil" required={isRecurring} />
                    </div>
                </div>
            {/if}
        </div>

        {#if form?.error}
            <p class="text-destructive text-sm">{form.error}</p>
        {/if}

        <Button type="submit" class="w-full">Create Class(es)</Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>