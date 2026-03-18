<script lang="ts">
import PendingInfractions from "$lib/components/dashboard/PendingInfractions.svelte";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";

let { data } = $props();
</script>

<div class="space-y-6 p-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-muted-foreground">Welcome to {data.location.name}.</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Description>Today's Classes</Card.Description>
        <Card.Title class="text-4xl">0</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-xs text-muted-foreground">+0% from last week</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Description>Active Members</Card.Description>
        <Card.Title class="text-4xl">1</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-xs text-muted-foreground">Capacity: Unlimited</div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="col-span-2 bg-primary text-primary-foreground border-none">
      <Card.Header>
        <Card.Title>Quick Actions</Card.Title>
        <Card.Description class="text-primary-foreground/80"
          >Get set up for the week</Card.Description
        >
      </Card.Header>
      <Card.Content class="flex gap-2">
        <Button variant="secondary" href={`/locations/${data.location.id}/wods/new`}
          >Program WOD</Button
        >
        <Button variant="secondary" href={`/locations/${data.location.id}/schedule/new`}
          >Add Class</Button
        >
      </Card.Content>
    </Card.Root>

    <PendingInfractions infractions={data.pendingInfractions} />
  </div>
</div>
