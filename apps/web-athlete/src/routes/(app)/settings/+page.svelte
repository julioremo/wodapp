<script lang="ts">
import {
  Ambulance,
  Bell,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  EyeOff,
  House,
  type Icon,
  Monitor,
  PersonStanding,
} from "@lucide/svelte";
import * as Avatar from "@ui/avatar";
import { Badge } from "@ui/badge";
import * as Item from "@ui/item";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
// Fallbacks to prevent null errors
let profile = data.profile || {};
let memberships = data.memberships || [];

// Determine if data is missing for the warning badges
let isMissingBiometrics =
  !profile.birthdate || !profile.gender || !profile.weight;
let isMissingEmergency =
  !profile.emergency_contact_name || !profile.emergency_contact_phone;

let biometricsPreview = [
  profile.gender,
  profile.birthdate,
  profile.height ? `${profile.height}cm` : null,
  profile.weight ? `${profile.weight}kg` : null,
]
  .filter(Boolean)
  .join(" • ");

type SettingsRow = {
  href?: string;
  avatar?: { url: string; fallback?: string };
  icon?: typeof Icon;
  title: string;
  description?: string;
  badge?: { condition: boolean; text: string; variant?: "destructive" } | null;
};

const profileRows: SettingsRow[] = [
  {
    href: "/settings/profile",
    avatar: {
      url: profile.avatar_url,
      fallback: profile.display_name?.charAt(0),
    },
    title: profile.display_name || "Set Display Name",
    description: profile.email,
  },
  {
    href: "/settings/personal-info",
    icon: CircleUserRound,
    title: "Personal Info",
    description: "Manage your account and basic info",
  },
  {
    href: "/settings/my-body",
    icon: PersonStanding,
    title: "My body",
    description: biometricsPreview,
    badge: { condition: isMissingBiometrics, text: "Incomplete" },
  },
  {
    href: "/settings/emergency-contact",
    icon: Ambulance,
    title: "Emergency contact",
    description:
      profile.emergency_contact_name || "Who to call in an emergency",
    badge: { condition: isMissingEmergency, text: "Missing" },
  },
];

const membershipRows: SettingsRow[] = [
  {
    href: memberships.length > 1 ? "/settings/active-gym" : undefined,
    icon: House,
    title: "Active Gym",
    description: data.activeLocation?.name || "Select your location",
  },
  // {
  //   href: "/settings/subscription",
  //   icon: CreditCard,
  //   title: "Subscription & Payment",
  //   description: "Manage your plan and billing details",
  // },
];

const preferenceRows: SettingsRow[] = [
  {
    href: "/settings/appearance",
    icon: Monitor,
    title: "Appearance",
    description: "Light, Dark, or System",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Configure alerts and emails",
  },
  {
    href: "/settings/privacy",
    icon: EyeOff,
    title: "Privacy",
    description: "Manage data sharing and visibility",
  },
];
</script>

{#snippet navItem(item: SettingsRow)}
  <Item.Root class="rounded-lg {item.avatar ? '-mt-4' : ''}">
    {#snippet child({ props })}
      <svelte:element
        this={item.href ? "a" : "div"}
        href={item.href}
        class="block {item.href
          ? 'transition-colors cursor-pointer'
          : 'cursor-default'}"
        {...props}>
        <Item.Media>
          {#if item.avatar}
            <Avatar.Root class="size-20 border-2">
              <Avatar.Image src={item.avatar.url} />
              <Avatar.Fallback class="bg-grey-100 font-medium text-lg"
                >{item.avatar.fallback}</Avatar.Fallback>
            </Avatar.Root>
          {:else if item.icon}
            {@const Icon = item.icon}
            <Icon />
          {/if}
        </Item.Media>
        <Item.Content class="gap-0">
          <Item.Title class="text-lg font-medium">{item.title}</Item.Title>
          {#if item.avatar}
            <Item.Description>{item.description}</Item.Description>
          {/if}
        </Item.Content>
        <Item.Actions class="flex items-center gap-2">
          {#if item.badge?.condition}
            <Badge variant={item.badge.variant} class="h-5 text-[10px]"
              >{item.badge.text}</Badge>
          {/if}
          {#if item.href}
            <ChevronRight class="size-5 text-muted-foreground" />
          {/if}
        </Item.Actions>
      </svelte:element>
    {/snippet}
  </Item.Root>
{/snippet}

{#snippet settingsSection(rows: SettingsRow[], title?: string)}
  <section class="space-y-1">
    {#if title}
      <h2 class="text-md font-medium text-grey-400 ml-12">
        {title}
      </h2>
    {/if}
    <Item.Group class="gap-0">
      {#each rows as item}
        {@render navItem(item)}
      {/each}
    </Item.Group>
  </section>
{/snippet}

<div class="max-w-xl mx-auto p-2">
  <div class="p-12">
    <h1 class="text-lg font-medium">Settings</h1>
  </div>
  <div class="space-y-8 pb-12">
    {@render settingsSection(profileRows)}
    {@render settingsSection(membershipRows, "Membership")}
    {@render settingsSection(preferenceRows, "Preferences")}
  </div>
</div>
