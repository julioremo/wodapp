<script lang="ts">
import UploadIcon from "@lucide/svelte/icons/upload";
import * as Avatar from "@ui/avatar";
import { cn } from "@ui-lib/utils.js";
import { useImageCropperPreview } from "./image-cropper.svelte.js";
import type { ImageCropperPreviewProps } from "./types";

let { child, class: className }: ImageCropperPreviewProps = $props();

const previewState = useImageCropperPreview();
</script>

{#if child}
  {@render child({ src: previewState.rootState.src })}
{:else}
  <Avatar.Root
    class={cn(
      "ring-accent ring-offset-background size-20 ring-2 ring-offset-2",
      className,
    )}>
    <Avatar.Image src={previewState.rootState.src} />
    <Avatar.Fallback>
      <UploadIcon class="size-4" />
      <span class="sr-only">Upload image</span>
    </Avatar.Fallback>
  </Avatar.Root>
{/if}
