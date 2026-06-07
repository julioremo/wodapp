<script lang="ts">
import { BicepsFlexed, ClipboardClock, UserRoundCog } from "@lucide/svelte";
import { page } from "$app/stores";

let { children } = $props();
// Helper to check active tab
const isActive = (path: string) => $page.url.pathname.startsWith(path);
</script>

<div class="flex flex-col h-screen max-w-md mx-auto bg-background">
  <main class="flex-1 overflow-y-auto pb-20">
    {@render children()}
  </main>

  <nav
    class="fixed bottom-0 w-full max-w-md border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="grid grid-cols-3 h-16">
      <a
        href="/schedule"
        class="flex flex-col items-center justify-center gap-1 {isActive('/schedule') ? 'text-primary' : 'text-muted-foreground'}">
        <ClipboardClock class="h-6 w-6" />
        <span class="text-xs font-medium">Schedule</span>
      </a>

      <a
        href="/benchmarks"
        class="flex flex-col items-center justify-center gap-1 {isActive('/coach') ? 'text-primary' : 'text-muted-foreground'}">
        <BicepsFlexed class="h-6 w-6" />
        <span class="text-xs font-medium">Benchmarks</span>
      </a>

      <a
        href="/settings"
        class="flex flex-col items-center justify-center gap-1 {isActive('/settings') ? 'text-primary' : 'text-muted-foreground'}">
        <UserRoundCog class="h-6 w-6" />
        <span class="text-xs font-medium">Settings</span>
      </a>
    </div>
  </nav>
</div>
