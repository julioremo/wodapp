<script lang="ts">
import { Camera, Loader2 } from "@lucide/svelte";
import * as Avatar from "@ui/avatar";
import { Button } from "@ui/button";

let { supabase, userId, avatarUrl = "" } = $props();

let uploading = $state(false);
let localUrl = $state(avatarUrl);
let fileInput: HTMLInputElement;

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];

  if (file.size > 5 * 1024 * 1024) {
    // Replace with your toast library
    alert("Image is too large. Please select a file under 5MB.");
    return;
  }

  uploading = true;

  try {
    // 1. Generate a unique filename to prevent browser caching issues
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`;

    // 2. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 3. Retrieve the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // 4. Update the profiles table silently
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 5. Update the UI instantly
    localUrl = publicUrl;
  } catch (error) {
    console.error("Upload failed", error);
    alert("Failed to upload avatar.");
  } finally {
    uploading = false;
    // Reset the input so the same file can be selected again if needed
    target.value = "";
  }
}
</script>

<div class="flex flex-col items-center space-y-4">
  <Avatar.Root class="size-24 border-2">
    <Avatar.Image src={localUrl} />
    <Avatar.Fallback>{userId.substring(0, 2).toUpperCase()}</Avatar.Fallback>
  </Avatar.Root>

  <div>
    <!-- Button proxies the click to the hidden file input -->
    <Button
      variant="outline"
      size="sm"
      onclick={() => fileInput.click()}
      disabled={uploading}>
      {#if uploading}
        <Loader2 class="size-4 mr-2 animate-spin" />
        Uploading...
      {:else}
        <Camera class="size-4 mr-2" />
        Change Picture
      {/if}
    </Button>

    <input
      type="file"
      bind:this={fileInput}
      onchange={handleUpload}
      accept="image/jpeg, image/png, image/webp"
      class="hidden" />
  </div>
</div>
