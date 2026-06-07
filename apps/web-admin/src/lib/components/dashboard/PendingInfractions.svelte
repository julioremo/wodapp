<script lang="ts">
import { Loader2, Settings2 } from "@lucide/svelte";
import { Button } from "@ui/button";
import * as Card from "@ui/card";
import { format, parseISO } from "date-fns";
import { enhance } from "$app/forms";

let { infractions } = $props();
let resolvingId = $state<string | null>(null);
</script>

<Card.Root>
  <Card.Header class="flex flex-row items-center justify-between">
    <div>
      <Card.Title>Pending Reviews</Card.Title>
      <Card.Description>Manual confirmation required for penalties.</Card.Description>
    </div>
    {#if infractions.length > 5}
      <a
        href="/settings/policies"
        class="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
        <Settings2 class="w-3 h-3" />
        Automate this
      </a>
    {/if}
  </Card.Header>

  <Card.Content class="space-y-4">
    {#if infractions.length === 0}
      <p class="text-sm text-muted-foreground text-center py-4">The queue is clear.</p>
    {:else}
      <div class="space-y-3">
        {#each infractions as infraction}
          <div class="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div class="space-y-1">
              <p class="text-sm font-medium leading-none">{infraction.profile.display_name}</p>
              <p class="text-xs text-muted-foreground">
                {infraction.reason === 'late_cancel' ? 'Late Cancel' : 'No Show'}
                • {format(parseISO(infraction.class.start_time), "MMM d, h:mm a")}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <form
                method="POST"
                action="?/resolveInfraction"
                use:enhance={() => {
                resolvingId = infraction.id;
                return async ({ update }) => {
                  await update();
                  resolvingId = null;
                };
              }}>
                <input type="hidden" name="infractionId" value={infraction.id} />
                <input type="hidden" name="resolution" value="waived" />
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  disabled={resolvingId === infraction.id}>
                  Waive
                </Button>
              </form>

              <form
                method="POST"
                action="?/resolveInfraction"
                use:enhance={() => {
                resolvingId = infraction.id;
                return async ({ update }) => {
                  await update();
                  resolvingId = null;
                };
              }}>
                <input type="hidden" name="infractionId" value={infraction.id} />
                <input type="hidden" name="resolution" value="counted" />
                <Button
                  variant="default"
                  size="sm"
                  type="submit"
                  disabled={resolvingId === infraction.id}>
                  {#if resolvingId === infraction.id}
                    <Loader2 class="w-4 h-4 animate-spin" />
                  {:else}
                    Apply
                  {/if}
                </Button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
