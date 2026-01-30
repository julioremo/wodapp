<script lang="ts">
  import { enhance } from '$app/forms';
  let { data } = $props();
  // We assume the server load (same logic as layout) passes the pending invite
  let invite = $derived(data.memberships.find(m => m.status === 'pending')); 
</script>

<div class="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
  <div class="space-y-2">
    <h1 class="text-2xl font-bold">You've been invited!</h1>
    <p class="text-muted-foreground">
      <span class="font-semibold text-foreground">{invite?.location?.name ?? 'A Gym'}</span> wants to add you as an athlete.
    </p>
  </div>

  <form method="POST" use:enhance class="flex gap-4 w-full max-w-xs">
    <input type="hidden" name="locationId" value={invite?.location?.id} />
    
    <button 
      formaction="?/reject"
      class="flex-1 py-3 border rounded-xl font-medium hover:bg-muted transition-colors">
      No thanks
    </button>
    
    <button 
      formaction="?/accept"
      class="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg">
      Join Gym
    </button>
  </form>
</div>