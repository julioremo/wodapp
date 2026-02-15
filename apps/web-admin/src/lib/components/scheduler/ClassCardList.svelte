<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Plus, CircleAlert, Trash2, Calendar as CalendarIcon } from "lucide-svelte";

  let { data } = $props();
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {#each data.schedule as session}
    <Card.Root>
      <Card.Header class="pb-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-muted-foreground">
            {new Date(session.start_time).toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short"
            })}
          </span>
          <span class="font-bold text-lg">
            {new Date(session.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
      </Card.Header>
      <Card.Content>
        <div class="text-sm space-y-1">
          <div class="flex justify-between border-b pb-1">
            <span>Coach:</span>
            <span class={session.coach ? "" : "text-muted-foreground italic"}>
              {session.coach?.full_name ?? "TBD"}
            </span>
          </div>
          <div class="flex justify-between pt-1">
            <span>WOD:</span>
            <span class={session.workout ? "" : "text-muted-foreground italic"}>
              {session.workout?.title ?? "Not programmed"}
            </span>
          </div>
        </div>
      </Card.Content>

      <Card.Footer class="pt-2 flex justify-end border-t bg-muted/10">
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            return async ({ update }) => {
              await update(); // Wait for server to delete
            };
          }}
        >
          <input type="hidden" name="classId" value={session.id} />
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            type="submit"
            onclick={(e) => {
              if (!confirm("Are you sure you want to cancel this class?")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 class="h-4 w-4" />
            <span class="sr-only">Delete</span>
          </Button>
        </form>
      </Card.Footer>
    </Card.Root>
  {/each}
</div>
