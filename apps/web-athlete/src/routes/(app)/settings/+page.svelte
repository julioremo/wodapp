<script lang="ts">
import {
  AlertTriangle,
  Bell,
  Building,
  Check,
  ChevronRight,
  LogOut,
  Moon,
  Settings,
  Sun,
  User
} from "@lucide/svelte";
import { Button } from "@ui/button";
import { enhance } from "$app/forms";

let { data } = $props();

let user = $derived(data.user);
let activeLocation = $derived(data.activeLocation);
let memberships = $derived(data.memberships);
let activeStrikes = $derived(data.activeStrikes || []);

let isDarkMode = $state(false);
</script>

<div class="flex flex-col h-full bg-background">
  <header class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
    <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
  </header>

  <div class="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
    <section class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">My Gyms</h2>
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

            <Button
              type="submit"
              name="locationId"
              value={m.location.id}
              disabled={isActive}
              variant={isActive ? "outline" : "ghost"}
              class="w-full flex items-center justify-start gap-3 p-3 h-auto rounded-xl border transition-all relative overflow-hidden
              {isActive ? 'bg-primary/5 border-primary ring-1 ring-primary cursor-default hover:bg-primary/5' : 'bg-card border-border hover:bg-muted/50'}">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg shrink-0 border
                {isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent'}">
                {m.location.name[0].toUpperCase()}
              </div>

              <div class="flex-1 min-w-0 text-left">
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
                <div class="text-primary pr-1"><Check class="w-5 h-5" /></div>
              {/if}
            </Button>
          {/each}
        </form>
      {/if}
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        Active Penalties
      </h2>

      {#if activeStrikes.length === 0}
        <div class="p-4 border rounded-xl bg-muted/30 text-center">
          <p class="text-sm text-muted-foreground">Your attendance record is clean.</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each activeStrikes as strike}
            <div
              class="p-3 border rounded-xl bg-destructive/10 border-destructive/20 flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-sm text-destructive">
                  {strike.reason === 'late_cancel' ? 'Late Cancellation' : 'No Show'}
                </p>
                <p class="text-xs text-destructive/80">
                  {strike.class?.name}
                  • {new Date(strike.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        Preferences
      </h2>

      <div class="bg-card border rounded-xl divide-y shadow-sm flex flex-col">
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
            <span
              class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm
                {isDarkMode ? 'translate-x-4' : 'translate-x-0'}"></span>
          </button>
        </div>

        <Button
          href="/settings/notifications"
          variant="ghost"
          class="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-muted/30">
          <div class="flex items-center gap-3">
            <Bell class="w-5 h-5 text-muted-foreground" />
            <span class="font-medium text-sm">Notifications</span>
          </div>
          <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
        </Button>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        Account
      </h2>

      <div class="bg-card border rounded-xl divide-y shadow-sm flex flex-col">
        <Button
          href="/settings/profile"
          variant="ghost"
          class="w-full flex items-center justify-start gap-3 p-4 h-auto rounded-none rounded-t-xl hover:bg-muted/30">
          <div
            class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border shrink-0">
            <User class="w-5 h-5 text-muted-foreground" />
          </div>
          <div class="overflow-hidden text-left">
            <p class="font-medium text-sm truncate">{user?.email}</p>
            <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Free Plan
            </p>
          </div>
        </Button>

        <Button
          href="/settings/privacy"
          variant="ghost"
          class="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-muted/30">
          <div class="flex items-center gap-3">
            <Settings class="w-5 h-5 text-muted-foreground" />
            <span class="font-medium text-sm">Privacy & Security</span>
          </div>
          <ChevronRight class="w-4 h-4 text-muted-foreground/50" />
        </Button>

        <form method="POST" action="?/logout" use:enhance>
          <Button
            type="submit"
            variant="ghost"
            class="w-full flex items-center justify-start gap-3 p-4 h-auto rounded-none rounded-b-xl text-destructive hover:bg-destructive/5 hover:text-destructive">
            <LogOut class="w-5 h-5" />
            <span class="font-medium text-sm">Sign Out</span>
          </Button>
        </form>
      </div>

      <div class="text-center pt-6 pb-2">
        <p class="text-[10px] text-muted-foreground">WODAPP web 0.0.1</p>
      </div>
    </section>
  </div>
</div>
