<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { PasswordInput } from "$lib/components/ui/password-input";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import { enhance } from "$app/forms";

  let { form } = $props();
</script>

<div class="flex items-center justify-center min-h-screen bg-muted/20 p-4">
  <Tabs.Root value="login" class="w-full max-w-md">
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="login">Login</Tabs.Trigger>
      <Tabs.Trigger value="signup">Register your Box</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="login">
      <Card.Root>
        <Card.Header>
          <Card.Title>Welcome back to WodApp</Card.Title>
          <Card.Description>Login to manage your location and athletes.</Card.Description>
        </Card.Header>
        <Card.Content>
          <form method="POST" action="?/login" use:enhance class="space-y-4">
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input id="email" name="email" type="email" autocomplete="username" required />
            </div>
            <div class="space-y-2">
              <Label for="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                autocomplete="current-password"
                required
              />
            </div>
            {#if form?.error && !form?.isSignupError}
              <p class="text-sm text-destructive">{form.error}</p>
            {/if}
            <Button type="submit" class="w-full">Login</Button>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <Tabs.Content value="signup">
      <Card.Root>
        <Card.Header>
          <Card.Title>Launch Your Box</Card.Title>
          <Card.Description>Create your admin account and workspace.</Card.Description>
        </Card.Header>
        <Card.Content>
          <form method="POST" action="?/signup" use:enhance class="space-y-4">
            <div class="space-y-2">
              <Label for="su_email">Email</Label>
              <Input id="su_email" name="email" type="email" autocomplete="username" required />
            </div>
            <div class="space-y-2">
              <Label for="su_password">Password</Label>
              <PasswordInput
                id="su_password"
                name="password"
                autocomplete="new-password"
                required
              />
            </div>

            {#if form?.error && form?.isSignupError}
              <p class="text-sm text-destructive">{form.error}</p>
            {/if}
            <Button type="submit" class="w-full">Create Admin Account</Button>
          </form>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
</div>
