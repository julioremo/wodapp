<script lang="ts">
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import * as Card from "@ui/card";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import * as Table from "@ui/table";
import { enhance } from "$app/forms";
import PageShell from "$lib/components/admin/PageShell.svelte";

let { data, form } = $props();
</script>

<!-- <PageShell title="Members">
    {#snippet controls()}
        <Button>
            <Plus class="mr-2 h-4 w-4" /> Add Member
        </Button>
    {/snippet}

    <DataTable data={data.members} />
</PageShell> -->

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Athletes</h1>
      <p class="text-muted-foreground">Manage access to your gym.</p>
    </div>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Invite Athlete</Card.Title>
      <Card.Description>Enter the email address of an existing WodApp user.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/invite" use:enhance class="flex gap-4 items-end">
        <div class="space-y-2 flex-1">
          <Label for="email" class="sr-only">Email</Label>
          <Input id="email" name="email" type="email" placeholder="athlete@example.com" required />
        </div>
        <Button type="submit">Send Invite</Button>
      </form>
      {#if form?.error}
        <p class="text-destructive text-sm mt-2">{form.error}</p>
      {:else if form?.success}
        <p class="text-green-600 text-sm mt-2">Invitation sent successfully!</p>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Content class="p-0">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Role</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.members as member}
            <Table.Row>
              <Table.Cell class="font-medium">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                    {member.profile?.display_name?.[0] || "?"}
                  </div>
                  {member.profile?.display_name || "Unknown"}
                </div>
              </Table.Cell>
              <Table.Cell>
                {#if member.status === "active"}
                  <Badge variant="default" class="bg-green-600 hover:bg-green-700">Active</Badge>
                {:else if member.status === "pending"}
                  <Badge variant="outline" class="text-amber-600 border-amber-200">Pending</Badge>
                {:else}
                  <Badge variant="destructive">Rejected</Badge>
                {/if}
              </Table.Cell>
              <Table.Cell class="capitalize">{member.role}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>
