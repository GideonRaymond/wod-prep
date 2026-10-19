import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Dialog } from "@/components/shared/Dialog";
import { MovementDetails } from "@/components/shared/MovementDetails";
import type { Movement } from "@/schemas/wod";
import { mergeMovement } from "@/utils/mergeDuplicateMovements";

export type MergeMovementDialogProps = {
  /** The movement already in the workout; null keeps the dialog closed. */
  existing: Movement | null;
  added: Movement | null;
  onMerge: () => void;
  onCancel: () => void;
};

export function MergeMovementDialog({
  existing,
  added,
  onMerge,
  onCancel,
}: MergeMovementDialogProps) {
  const open = Boolean(existing && added);
  const merged = existing && added ? mergeMovement(existing, added) : null;

  return (
    <Dialog
      open={open}
      title={`${existing?.name ?? "Movement"} is already in this workout`}
      onClose={onCancel}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onMerge} data-autofocus>
            Merge
          </Button>
        </>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Merge them into one movement? The reps are added together:
      </p>
      {merged && (
        <Card className="mt-3" role="group" aria-label="Merged movement">
          <h3 className="font-medium">{merged.name}</h3>
          <MovementDetails movement={merged} />
        </Card>
      )}
    </Dialog>
  );
}
