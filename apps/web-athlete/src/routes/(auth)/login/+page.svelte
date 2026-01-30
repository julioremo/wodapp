<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import { enhance } from '$app/forms';
  
  // Svelte 5 Runes
  let isSignUp = $state(false);
  let { form } = $props(); // Get form response from server
</script>

<div class="flex items-center justify-center min-h-screen bg-muted/40 p-4">
  <Card.Root class="w-full max-w-md shadow-lg">
    <Card.Header class="space-y-1">
      <Card.Title class="text-2xl font-bold text-center">
        {isSignUp ? "Join WodApp" : "Welcome back, Athlete!"}
      </Card.Title>
      <Card.Description class="text-center">
        {isSignUp 
          ? "Enter your details to create an athlete account" 
          : "Enter your email to sign in to your account"}
      </Card.Description>
    </Card.Header>
    
    <Card.Content>
      <form method="POST" action={isSignUp ? '?/signup' : '?/login'} class="space-y-4">
        <input type="hidden" name="type" value={isSignUp ? 'signup' : 'login'} />

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        {#if form?.error}
          <p class="text-sm font-medium text-destructive text-center">{form.error}</p>
        {/if}

        {#if form?.success}
          <div class="p-3 text-sm text-green-700 bg-green-100 rounded-md">
            {form.message}
          </div>
        {/if}

        <Button type="submit" class="w-full">
          {isSignUp ? "Create Account" : "Sign In"}
        </Button>
      </form>
    </Card.Content>
    
    <Card.Footer>
      <div class="text-sm text-center w-full text-muted-foreground">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <button 
          class="underline underline-offset-4 hover:text-primary ml-1"
          onclick={() => isSignUp = !isSignUp}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </Card.Footer>
  </Card.Root>
</div>