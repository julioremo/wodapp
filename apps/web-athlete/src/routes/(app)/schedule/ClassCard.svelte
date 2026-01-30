<script lang="ts">
  import { format } from 'date-fns';
  import { Users, CircleAlert, Check, X } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Avatar from "$lib/components/ui/avatar";
  import { cn } from "$lib/utils";

  let { classData, userId } = $props();

  // 1. Data Parsing
  const startTime = new Date(classData.start_time);
  const capacity = classData.capacity;
  // Reactive State for Bookings (Mutable for Optimistic UI)
  let bookings = $state(classData.bookings || []);
  // Derived helpers
  let bookedCount = $derived(bookings.length);
  let spotsLeft = $derived(capacity - bookedCount);
  let myBooking = $derived(bookings.find((b: any) => b.profile_id === userId));
  let isBooked = $derived(!!myBooking);
  
  // 2. Optimistic UI Handler
  // We'll toggle state visually before the server responds
  const handleBooking = () => {
    // Snapshot strictly for rollback
    const previousBookings = [...bookings];

    return async ({ result, update }: any) => {
      // A. Optimistic Update (Before Server)
      // This runs immediately when form submits (before 'result' is available in some setups, 
      // but 'enhance' usually waits. For true instant feedback, we manually toggle state here).
      
      // Note: For true "instant" click feel, we often toggle state *outside* the enhance callback first,
      // but standard SvelteKit enhance waits for the server. 
      // To make it instant, we manually mutate 'bookings' right here.
      
      if (isBooked) {
            // OPTIMISTIC CANCEL: Filter myself out
            bookings = bookings.filter((b: any) => b.profile_id !== userId);
      } else {
            // OPTIMISTIC BOOK: Add myself (Mock ID)
            // We need a way to show "Me" in the beeswarm, we can grab the avatar from the page store or just show a placeholder
            bookings = [...bookings, { profile_id: userId, id: 'temp', status: 'confirmed', profile: { avatar_url: null } }];
      }

      await update({ reset: false }); // Wait for server...

      // B. Server Response Handling
      if (result.type === 'failure' || result.type === 'error') {
            // Rollback if it failed
            console.error("Booking failed:", result);
            bookings = previousBookings;
      } else if (result.type === 'success') {
            // Server Source of Truth: update with actual server data if returned, 
            // or just rely on the load function re-running (standard behavior).
            // Ideally, we let the load function refresh the data prop.
      }
    };
  };
  // Helper for color coding (Example logic)
  const typeColor = "bg-blue-100 border-blue-200"; // Dynamic based on classData.type
</script>

<Card.Root class={cn("overflow-hidden transition-all border-l-4 p-0 rounded-none", isBooked ? "border-l-primary bg-primary/5" : "border-l-transparent hover:border-l-muted-foreground/20")}>
  <div class="flex flex-col p-3 gap-3">
    
    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
           <h3 class="font-bold leading-none">{classData.name || 'Workout'}</h3>
           <Badge variant="outline" class={cn("text-[10px] h-4 px-1 text-primary border-primary", !isBooked && "invisible")}>Booked</Badge>
        </div>
        
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
           <div class="flex items-center gap-1.5">
             <Avatar.Root class="h-4 w-4">
                <Avatar.Image src={classData.coach?.avatar_url} alt="Coach" />
                <Avatar.Fallback class="text-[8px]">C</Avatar.Fallback>
             </Avatar.Root>
             <span class="text-xs">{classData.coach?.full_name || 'Coach'}</span>
           </div>
        </div>
      </div>

      <div class="text-right">
        <span class="text-lg font-bold font-mono tracking-tight leading-none block">
            {format(startTime, 'HH:mm')}
        </span>
      </div>
    </div>

    <div class="flex justify-between items-end pt-1">
        
        <div class="flex flex-col gap-1.5">
             <div class="flex -space-x-2 overflow-hidden pl-1">
                {#each bookings.slice(0, 6) as booking (booking.id || booking.profile_id)}
                    <Avatar.Root class="h-6 w-6 border-2 border-background ring-1 ring-muted">
                        <Avatar.Image src={booking.profile?.avatar_url} />
                        <Avatar.Fallback class="text-[8px] bg-muted text-muted-foreground">U</Avatar.Fallback>
                    </Avatar.Root>
                {/each}
                {#if bookings.length > 6}
                    <div class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background ring-1 ring-muted">
                        +{bookings.length - 6}
                    </div>
                {/if}
            </div>

            <div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span class={spotsLeft === 0 ? "text-destructive" : ""}>
                    {bookedCount}/{capacity} spots
                </span>
                {#if spotsLeft <= 3 && spotsLeft > 0}
                    <span class="flex items-center gap-0.5 text-amber-600 animate-pulse">
                        <CircleAlert class="w-3 h-3" /> Few left
                    </span>
                {/if}
            </div>
        </div>

        <form method="POST" action="?/toggleBooking" use:enhance={handleBooking}>
            <input type="hidden" name="classId" value={classData.id} />
            <input type="hidden" name="actionType" value={isBooked ? 'cancel' : 'book'} />
            
            <Button 
                type="submit" 
                size="sm" 
                variant={isBooked ? "destructive" : (spotsLeft === 0 ? "secondary" : "default")}
                class="h-8 px-3 text-xs font-bold transition-all shadow-sm"
                disabled={!isBooked && spotsLeft === 0}
            >
                {#if isBooked}
                    Cancel
                {:else if spotsLeft === 0}
                    Full
                {:else}
                    Book
                {/if}
            </Button>
        </form>

    </div>
  </div>
</Card.Root>