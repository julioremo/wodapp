<script lang="ts">
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CircleAlert,
  Mail,
  Phone,
  Save
} from "@lucide/svelte";
import * as Avatar from "@ui/avatar";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import Calendar from "@ui/calendar/calendar.svelte";
import CalendarDay from "@ui/calendar/calendar-day.svelte";
import { Label } from "@ui/label";
import * as Select from "@ui/select";
import { MediaQuery } from "svelte/reactivity";
import { toast } from "svelte-sonner";
import { enhance } from "$app/forms";
import { PALETTE } from "$lib/config/colors";

let { data } = $props();
const m = data.membership;
const p = m.profiles;

const initials = (p.display_name || "?")
  .split(" ")
  .map((n: string) => n[0])
  .join("")
  .substring(0, 2)
  .toUpperCase();
const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();

// State for the administration form
let role = $state(m.role);
let status = $state(m.status);
// Derived state to check if the form is dirty
let hasChanges = $derived(role !== data.membership.role || status !== data.membership.status);
// Sync state if the server data updates after a successful form submission
$effect(() => {
  role = data.membership.role;
  status = data.membership.status;
});

const attendances = data.attendances;
const currentDate = today(getLocalTimeZone());
let calendarValue = $state(currentDate);

const isMobile = new MediaQuery("(max-width: 767px)");
const isTablet = new MediaQuery("(min-width: 768px) and (max-width: 1023px)");
let numberOfMonths = $derived(isMobile.current ? 1 : isTablet.current ? 2 : 3);

let placeholder = $state(currentDate.subtract({ months: 2 }));
let previousMonths = 3;

$effect(() => {
  // If the window resizes and the number of visible months changes,
  // we shift the placeholder to keep the right-most month anchored perfectly.
  if (numberOfMonths !== previousMonths) {
    const diff = previousMonths - numberOfMonths;
    placeholder =
      diff > 0
        ? placeholder.add({ months: diff })
        : placeholder.subtract({ months: Math.abs(diff) });
    previousMonths = numberOfMonths;
  }
});

function getColorForString(str: string | null) {
  if (!str) return "bg-muted text-muted-foreground";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const joinedDate = new Date(m.created_at);
const joinedStr = joinedDate.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});
</script>

<div class="mx-auto p-6 space-y-6">
  <div>
    <Button variant="ghost" size="sm" href="/members" class="text-muted-foreground -ml-3">
      <ArrowLeft class="h-4 w-4 mr-2" />
      Directory
    </Button>
  </div>

  <div
    class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
    <div class="p-6 border-b flex flex-row justify-between">
      <div class="flex flex-row gap-6">
        <Avatar.Root class="h-28 w-28 border shrink-0">
          <Avatar.Image src={p.avatar_url || ''} alt={p.display_name} />
          <Avatar.Fallback class="text-lg font-mono">{initials}</Avatar.Fallback>
        </Avatar.Root>

        <div class="flex flex-col items-start gap-1.5 text-sm text-muted-foreground">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold tracking-tight text-primary">{p.display_name}</h1>
            <Badge
              variant={m.status === 'active' ? 'default' : m.status === 'pending' ? 'secondary' : 'destructive'}>
              {m.status}
            </Badge>
          </div>

          {#if fullName && fullName !== p.display_name}
            <span class="text-muted-foreground text-sm">{fullName}</span>
          {/if}
          <span class="flex items-center gap-2">
            <Mail class="h-3.5 w-3.5" /> {p.email || 'No email provided'}
          </span>
          <span class="flex items-center gap-2">
            <Phone class="h-3.5 w-3.5" /> {p.phone || 'No phone provided'}
          </span>
          <span class="flex items-center gap-2">
            <CalendarIcon class="h-3.5 w-3.5" />
            Member since {joinedStr}
          </span>
        </div>
      </div>

      <div
        class="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg h-full">
        <span
          class="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-3">
          <CircleAlert class="h-3.5 w-3.5" />
          Emergency Contact
        </span>
        {#if p.emergency_contact_name || p.emergency_contact_phone}
          <div class="text-sm space-y-1">
            <p class="font-medium">{p.emergency_contact_name || 'Name not provided'}</p>
            <p class="text-muted-foreground">{p.emergency_contact_phone || 'Phone not provided'}</p>
          </div>
        {:else}
          <p class="text-sm text-muted-foreground italic">No emergency information on file.</p>
        {/if}
      </div>
    </div>

    <div class="p-6 border-b">
      <h3 class="text-lg tracking-tight mb-4">Administration</h3>
      <form
        method="POST"
        action="?/updateAdministration"
        use:enhance={() => {
                return async ({ result, update }) => {
                  if (result.type === 'success') toast.success(result.data?.message || "Updated successfully");
                  else toast.error("Failed to update membership");
                  await update({ reset: false });
                };
              }}
        class="flex flex-col gap-3">
        <div class="space-y-1">
          <Label class="text-xs text-muted-foreground">Role</Label>
          <Select.Root type="single" name="role" bind:value={role}>
            <Select.Trigger class="h-9 bg-background"> {role} </Select.Trigger>
            <Select.Content>
              <Select.Item value="athlete">Athlete</Select.Item>
              <Select.Item value="coach">Coach</Select.Item>
              <Select.Item value="manager">Manager</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        <div class="space-y-1">
          <Label class="text-xs text-muted-foreground">Status</Label>
          <Select.Root type="single" name="status" bind:value={status}>
            <Select.Trigger class="h-9 bg-background"> {status} </Select.Trigger>
            <Select.Content>
              <Select.Item value="active">Active</Select.Item>
              <Select.Item value="pending">Pending</Select.Item>
              <Select.Item value="inactive">Inactive</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        <Button type="submit" size="sm" class="h-9 mt-1 w-fit" disabled={!hasChanges}>
          <Save class="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </form>
    </div>

    <div class="p-6 border-b bg-muted/5">
      <h3 class="text-lg tracking-tight mb-4">Subscription & Billing</h3>
      <div
        class="border border-dashed rounded-lg p-8 flex items-center justify-center text-muted-foreground text-sm bg-background/50">
        TODO: Stripe Integration & Subscription Logic
      </div>
    </div>

    <div class="p-6">
      <h3 class="text-lg tracking-tight mb-6">Recent Attendance</h3>

      <div class="flex md:block justify-center mx-auto">
        <Calendar
          type="single"
          {numberOfMonths}
          bind:placeholder
          maxValue={currentDate}
          class="rounded-lg border shadow-sm w-fit">
          {#snippet day({ day, outsideMonth })}
            {@const dayAttendances = attendances.filter(a => a.year === day.year && a.month === day.month && a.day === day.day)}

            <CalendarDay
              class="flex flex-col items-center justify-start py-1 relative h-full w-full data-[outside-month=true]:opacity-30">
              <span class="text-xs">{day.day}</span>
              {#if !outsideMonth && dayAttendances.length > 0}
                <div class="flex gap-0.5 mt-auto pb-1 flex-wrap justify-center w-full px-1">
                  {#each dayAttendances as attendance}
                    <div
                      class="h-1.5 w-1.5 rounded-full"
                      style="background-color: {getColorForString(attendance.type)};"
                      title={attendance.type}></div>
                  {/each}
                </div>
              {/if}
            </CalendarDay>
          {/snippet}
        </Calendar>
      </div>
    </div>
  </div>
</div>
