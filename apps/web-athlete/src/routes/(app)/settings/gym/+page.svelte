<script lang="ts">
import * as Avatar from "@ui/avatar";
import * as Form from "@ui/form";
import * as RadioGroup from "@ui/radio-group";
import { toast } from "@ui/sonner";
import { tick } from "svelte";
import { superForm } from "sveltekit-superforms";
import BackButton from "$lib/components/BackButton.svelte";
import AppHeader from "$lib/components/layout/AppHeader.svelte";

let { data } = $props();

const formObj = superForm(data.form, {
  resetForm: false,
  invalidateAll: "force",
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
  },
});

const { form: formData, enhance, submit } = formObj;
</script>

<div class="max-w-xl mx-auto p-2">
  <AppHeader title="Active Gym">
    {#snippet left()}
      <BackButton backUrl="/settings" />
    {/snippet}
  </AppHeader>

  <div class="pb-24 px-4">
    <p class="text-sm text-muted-foreground mb-12">
      Choose your current home gym. This determines the class schedule,
      announcements and leaderboards you see by default.
    </p>

    <form method="POST" use:enhance class="space-y-6">
      <input
        type="hidden"
        name="last_location_id"
        value={$formData.last_location_id} />

      <Form.Field form={formObj} name="last_location_id">
        <Form.Control>
          {#snippet children({ props })}
            <div class="space-y-2">
              <RadioGroup.Root
                {...props}
                bind:value={$formData.last_location_id}
                class="flex flex-col gap-0 overflow-hidden"
                onValueChange={async () => {
                  await tick();
                  submit();
                }}>
                {#each data.activeMemberships as membership}
                  <RadioGroup.Row
                    value={membership.location.id}
                    class="text-lg">
                    {#snippet label()}
                      {@const isVector =
                        membership.location.logo_url?.endsWith(".svg")}
                      <div class="flex items-center gap-3">
                        {#if membership.location.logo_url && isVector}
                          <!-- Unmasked vector logo -->
                          <div class="size-8 flex items-center justify-center">
                            <img
                              src={membership.location.logo_url}
                              alt={membership.location.name}
                              class="w-full h-full object-contain" />
                          </div>
                        {:else}
                          <!-- Masked raster logo (or fallback) -->
                          <Avatar.Root class="size-8 border">
                            {#if membership.location.logo_url}
                              <Avatar.Image
                                src={membership.location.logo_url}
                                alt={membership.location.name}
                                class="object-cover" />
                            {/if}
                            <Avatar.Fallback
                              class="bg-secondary text-secondary-foreground text-xs font-medium">
                              {membership.location.name.charAt(0)}
                            </Avatar.Fallback>
                          </Avatar.Root>
                        {/if}

                        <span class="text-base"
                          >{membership.location.name}</span>
                      </div>
                    {/snippet}
                  </RadioGroup.Row>
                {/each}
              </RadioGroup.Root>
            </div>

            <Form.FieldErrors />
          {/snippet}
        </Form.Control>
      </Form.Field>
    </form>
  </div>
</div>
