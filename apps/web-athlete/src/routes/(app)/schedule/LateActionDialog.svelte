<script lang="ts">
import { Button } from "@ui/button";
import * as Dialog from "@ui/dialog";

interface Props {
  open: boolean;
  action: "book" | "cancel" | null;
  onConfirm: () => void;
  onCancel?: () => void;
}

let { open = $bindable(false), action, onConfirm, onCancel }: Props = $props();

function handleClose() {
  open = false;
  onCancel?.();
}

function handleConfirm() {
  open = false;
  onConfirm();
}
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {action === "cancel" ? "Late Cancellation" : "Late Booking"}
      </Dialog.Title>
      <Dialog.Description>
        {action === "cancel"
          ? "You are cancelling past the free cancellation window. This may result in a penalty on your account."
          : "You are booking past the free cancellation window. If you secure this spot and cancel later, you may incur a penalty."}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="secondary" onclick={handleClose}>Go Back</Button>
      <Button variant="default" onclick={handleConfirm}>I Understand</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
