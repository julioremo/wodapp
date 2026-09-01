<script lang="ts">
import { Button } from "@ui/button";
import * as ImageCropper from "@ui/image-cropper";
import { Input } from "@ui/input";
import { toast } from "@ui/sonner";
import { avatarSchema, displayNameSchema } from "@wodapp/core";
import imageCompression from "browser-image-compression";
import { superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import AppHeader from "$lib/components/layout/AppHeader.svelte";
import HeaderBackCancel from "$lib/components/layout/HeaderBackCancel.svelte";
import InlineEditableField from "../InlineEditableField.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
let isEditingName = $state(false);
let isUploading = $state(false);
let currentAvatarUrl = $state(data.avatarForm.data.avatar_url ?? undefined);
let croppedFile: File | null = null;

const nameForm = superForm(data.nameForm, {
  resetForm: false,
  validators: zod4Client(displayNameSchema),
  onUpdated({ form }) {
    if (form.message) {
      if (form.valid) {
        toast.success(form.message);
        setTimeout(() => {
          isEditingName = false;
        }, 0);
      } else {
        toast.error(form.message);
      }
    }
  },
});
const {
  form: nameData,
  enhance: enhanceName,
  submitting: submittingName,
} = nameForm;

const avatarForm = superForm(data.avatarForm, {
  resetForm: false,
  validators: zod4Client(avatarSchema),
  onSubmit({ formData }) {
    // Inject the dynamically cropped file into the form data before it sends
    if (croppedFile) formData.set("avatar", croppedFile);
  },
  onUpdated({ form }) {
    isUploading = false;
    if (form.message) {
      if (form.valid) toast.success(form.message);
      else toast.error(form.message);
    }
  },
});

const { enhance: enhanceAvatar, submit: submitAvatar } = avatarForm;

async function handleCropped(url: string) {
  isUploading = true;
  try {
    // Convert the cropper's blob URL to a real File
    const response = await fetch(url);
    const rawBlob = await response.blob();
    const rawFile = new File([rawBlob], "avatar.jpg", { type: rawBlob.type });

    const options = {
      maxSizeMB: 0.7,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: "image/webp",
    };

    croppedFile = await imageCompression(rawFile, options);
    // Optimistically update image on screen
    currentAvatarUrl = URL.createObjectURL(croppedFile);
    submitAvatar();
  } catch (error) {
    console.error(error);
    toast.error("Failed to process image.");
    isUploading = false;
  }
}
</script>

<AppHeader title="Public Profile">
  {#snippet left()}
    <HeaderBackCancel isEditing={false} onCancel={() => {}} />
  {/snippet}
</AppHeader>

<form
  method="POST"
  action="?/updateAvatar"
  enctype="multipart/form-data"
  use:enhanceAvatar>
</form>

<div class="max-w-xl mx-auto p-12 space-y-12">
  <div class="flex flex-col items-center space-y-4">
    <ImageCropper.Root
      src={currentAvatarUrl}
      onUnsupportedFile={(file) =>
        toast.error(`Unsupported file type: ${file.type}`)}
      onCropped={handleCropped}>
      <ImageCropper.UploadTrigger>
        <ImageCropper.Preview
          class="size-48 rounded-full border-2 cursor-pointer hover:opacity-80 transition" />
      </ImageCropper.UploadTrigger>

      <ImageCropper.Dialog>
        <ImageCropper.Cropper />
        <ImageCropper.Controls>
          <ImageCropper.Cancel />
          <ImageCropper.Crop />
        </ImageCropper.Controls>
      </ImageCropper.Dialog>
    </ImageCropper.Root>

    <p class="text-sm text-muted-foreground">Click to change profile picture</p>
  </div>

  <form method="POST" action="?/updateName" use:enhanceName>
    <InlineEditableField
      formObj={nameForm}
      name="display_name"
      label="Display Name"
      bind:isEditing={isEditingName}
      bind:value={$nameData.display_name} />
  </form>
</div>
