<script lang="ts">
import { Button } from "@ui/button";
import { toast } from "@ui/sonner"; // Assuming you did the re-export we talked about!
import { profileSchema } from "@wodapp/core";
import { superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import BasicInfoFields from "$lib/components/profile/BasicInfoFields.svelte";
import BiometricsFields from "$lib/components/profile/BiometricsFields.svelte";
import EmergencyContactFields from "$lib/components/profile/EmergencyContactFields.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

const formObj = superForm(data.form, {
  validators: zod4Client(profileSchema),
  resetForm: false,
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
  },
});

const { enhance, submitting } = formObj;
</script>

<div class="space-y-6 max-w-xl">
  <div>
    <h3 class="text-lg font-medium">Profile Settings</h3>
    <p class="text-sm text-muted-foreground">
      Manage your personal information and biometric data.
    </p>
  </div>

  <hr />

  <form method="POST" use:enhance class="space-y-10">
    <!-- Section 1: Basic Info -->
    <section class="space-y-4">
      <h4
        class="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
        Basic Information
      </h4>
      <BasicInfoFields form={formObj} />
    </section>

    <!-- Section 2: Biometrics -->
    <section class="space-y-4">
      <h4
        class="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
        Biometrics
      </h4>
      <BiometricsFields form={formObj} />
    </section>

    <!-- Section 3: Emergency Contact -->
    <section class="space-y-4">
      <h4
        class="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
        Emergency Contact
      </h4>
      <EmergencyContactFields form={formObj} />
    </section>

    <div class="pt-4 border-t">
      <Button type="submit" disabled={$submitting}>
        {$submitting ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  </form>
</div>
