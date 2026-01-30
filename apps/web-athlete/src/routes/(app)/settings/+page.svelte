<script lang="ts">
  import { enhance } from '$app/forms';
  import { 
    LogOut, 
    Building, 
    Check, 
    Settings, 
    Moon, 
    Sun, 
    User, 
    ChevronRight,
    Bell
  } from 'lucide-svelte';
  
  // Props passed down from the layout load function
  let { data } = $props();
  
  // Reactive derived state for cleaner access
  let user = $derived(data.user);
  let activeLocation = $derived(data.activeLocation);
  let memberships = $derived(data.memberships);
  
  // Mock state for Theme Toggle (To be connected to a real store later)
  let isDarkMode = $state(false); 
</script>

<div class="flex flex-col h-full bg-background">
  
  <header class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
    <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
  </header>

  <div class="flex-1 overflow-y-auto p-4 space-y-8 pb-24"> <section class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          My Gyms
        </h2>
      </div>

      {#if memberships.length === 0}
        <div class="p-6 border rounded-xl bg-muted/30 text-center space-y-2">
           <Building class="w-8 h-8 mx-auto text-muted-foreground/50" />
           <p class="text-sm text-muted-foreground">You haven't joined a gym yet.</p>
        </div>
      {:else}
        <form method="POST" action="?/switchGym" use:enhance class="space-y-2">
          {#each memberships as m (m.location.id)}
            {@const isActive = m.location.id === activeLocation?.id}
            
            <button 
              type="submit" 
              name="locationId" 
              value={m.location.id}
              disabled={isActive}
              class="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden
              {isActive 
                ? 'bg-primary/5 border-primary ring-1 ring-primary cursor-default' 
                : 'bg-card hover:bg-muted/50'}"
            >
              <div class="flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg shrink-0 border
                {isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent'}">
                {m.location.name[0].toUpperCase()}
              </div>

              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate leading-tight">{m.location.name}</div>
                <div class="text-xs text-muted-foreground truncate flex items-center gap-1">
                  {#if m.status === 'pending'}
                    <span class="text-amber-500 font-bold">Invite Pending</span>
                  {:else}
                    Athlete
                  {/if}
                </div>
              </div>

              {#if isActive}
                <div class="text-primary pr-1">
                  <Check class="w-5 h-5" />
                </div>
              {/if}
            </button>
          {/each}
        </form>
      {/if}
      
      <button class="w-full py-3 border border-dashed rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
        + Join another gym
      </button>
    </section>

    <section class="space-y-3">
       <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
          Preferences
       </h2>
       
       <div class="bg-card border rounded-xl divide-y shadow-sm">
          
          <div class="flex items-center justify-between p-4">
            <div class="flex items-center gap-3">
               {#if isDarkMode}
                 <Moon class="w-5 h-5 text-purple-500" />
               {:else}
                 <Sun class="w-5 h-5 text-orange-500" />
               {/if}
               <span class="font-medium text-sm">Dark Mode</span>
            </div>
            <button 
              onclick={() => isDarkMode = !isDarkMode}
              class="w-10 h-6 bg-muted rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20
              {isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'}">
              <span class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm
                {isDarkMode ? 'translate-x-4' : 'translate-x-0'}"></span>
            </button>
          </div>

          <button class="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
             <div class="flex items-center gap-3">
                <Bell class="w-5 h-5 text-muted-foreground" />
                <span class="font-medium text-sm">Notifications</span>
             </div>
             <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
          </button>
       </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
         Account
      </h2>
      
      <div class="bg-card border rounded-xl divide-y shadow-sm">
         
         <div class="p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border">
               <User class="w-5 h-5 text-muted-foreground" />
            </div>
            <div class="overflow-hidden">
               <p class="font-medium text-sm truncate">{user?.email}</p>
               <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Free Plan</p>
            </div>
         </div>

         <button class="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
             <div class="flex items-center gap-3">
                <Settings class="w-5 h-5 text-muted-foreground" />
                <span class="font-medium text-sm">Privacy & Security</span>
             </div>
             <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
          </button>

         <form method="POST" action="?/logout" use:enhance>
            <button class="w-full flex items-center gap-3 p-4 text-destructive hover:bg-destructive/5 transition-colors">
               <LogOut class="w-5 h-5" />
               <span class="font-medium text-sm">Sign Out</span>
            </button>
         </form>

      </div>
      
      <div class="text-center pt-6 pb-2">
         <p class="text-[10px] text-muted-foreground">
            WODAPP web 0.0.1
         </p>
      </div>
    </section>

  </div>
</div>