<script lang="ts">
import { Button } from "@ui/button";
import * as ImageCropper from "@ui/image-cropper";
import { Input } from "@ui/input";
import { toast } from "@ui/sonner";
import { superForm } from "sveltekit-superforms";

// ... import schema and data

let { data } = $props();
const { supabase, user } = data;
let isEditingName = $state(false);

const { form, enhance, submitting } = superForm(data.form, {
  onUpdated({ form }) {
    if (form.valid) {
      isEditingName = false;
      toast.success("Display name updated");
    }
  },
});

async function handleCrop(croppedBlob: Blob) {
  // 1. Upload croppedBlob to Supabase Storage
  // 2. Get public URL
  // 3. Update profiles table with new avatar_url
  toast.success("Avatar updated");
}
</script>

<div class="max-w-xl mx-auto p-12 space-y-12">
  <!-- 1. AVATAR SECTION -->
  <div class="flex flex-col items-center space-y-4">
    <ImageCropper.Root
      onUnsupportedFile={(file) =>
        toast.error(`Unsupported file type: ${file.type}`)}
      onCrop={handleCrop}>
      <ImageCropper.UploadTrigger>
        <!-- If user has an avatar, show it here, otherwise show fallback/preview -->
        <ImageCropper.Preview
          class="size-24 rounded-full border-2 cursor-pointer hover:opacity-80 transition" />
      </ImageCropper.UploadTrigger>

      <ImageCropper.Dialog>
        <ImageCropper.Cropper />
        <ImageCropper.Controls>
          <ImageCropper.Cancel />
          <ImageCropper.Crop />
        </ImageCropper.Controls>
      </ImageCropper.Dialog>
    </ImageCropper.Root>

    <p class="text-sm text-muted-foreground">Click to change picture</p>
  </div>

  <hr />

  <!-- 2. DISPLAY NAME SECTION -->
  <form method="POST" use:enhance class="space-y-4">
    <div class="flex justify-between items-end">
      <div class="space-y-1 flex-1 mr-4">
        <label
          for="display_name"
          class="text-sm font-medium text-muted-foreground">Display Name</label>

        {#if isEditingName}
          <Input
            id="display_name"
            name="display_name"
            bind:value={$form.display_name} />
        {:else}
          <div class="h-10 px-3 py-2 border border-transparent text-sm">
            {$form.display_name || "—"}
          </div>
        {/if}
      </div>

      {#if isEditingName}
        <Button type="submit" disabled={$submitting}>Save</Button>
      {:else}
        <Button
          variant="outline"
          type="button"
          onclick={() => (isEditingName = true)}>Edit</Button>
      {/if}
    </div>
  </form>
</div>
