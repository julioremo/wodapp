<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import { enhance } from '$app/forms';
  
  let { form } = $props();
</script>

<div class="flex items-center justify-center min-h-screen bg-muted/20 p-4">
  <Card.Root class="w-full max-w-lg">
    <Card.Header>
      <Card.Title>Create Your Gym</Card.Title>
      <Card.Description>You're almost there. Give your workspace a name.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Gym Name</Label>
          <Input id="name" name="name" placeholder="CrossFit Amsterdam" required />
        </div>
        <div class="space-y-2">
          <Label for="slug">URL Slug</Label>
          <Input id="slug" name="slug" placeholder="crossfit-amsterdam" required />
        </div>
        {#if form?.error}
          <p class="text-destructive text-sm">{form.error}</p>
        {/if}
        <Button type="submit" class="w-full">Create & Start</Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>