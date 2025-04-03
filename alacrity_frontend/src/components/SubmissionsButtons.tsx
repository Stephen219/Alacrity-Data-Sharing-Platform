"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface SubmissionButtonsProps {
  onDelete: () => void;
  onSecondaryAction: () => void;
  secondaryActionLabel: string;
  showToggle?: boolean; 
  isPrivate?: boolean; 
  onToggle?: () => void; 
}

const SubmissionButtons = ({
  onDelete,
  onSecondaryAction,
  secondaryActionLabel,
  showToggle = false, 
  isPrivate = false,
  onToggle,
}: SubmissionButtonsProps) => {
  return (
    <div className="flex flex-col items-end gap-4">
      {/* Optional Toggle Switch */}
      {showToggle && onToggle && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{isPrivate ? "Private" : "Public"}</span>
          <Switch checked={isPrivate} onCheckedChange={() => onToggle?.()} />
        </div>
      )}

      {/* Delete Button wrapped in AlertDialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="bg-alacrityred transition-transform transform hover:scale-110 hover:bg-red-400 duration-300 ease-in-out">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This submission will be moved to Recently Deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button onClick={onSecondaryAction} variant="outline">
        {secondaryActionLabel}
      </Button>
    </div>
  );
};

export default SubmissionButtons;
