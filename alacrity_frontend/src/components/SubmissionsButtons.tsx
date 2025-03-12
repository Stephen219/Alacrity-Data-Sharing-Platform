"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
    <div className="flex flex-col items-center gap-4 space-y-8">
      {/* Optional Toggle Switch */}
      {showToggle && onToggle && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{isPrivate ? "Private" : "Public"}</span>
          <Switch checked={isPrivate} onCheckedChange={() => onToggle?.()} />
        </div>
      )}

      {/* Action Buttons */}
      <Button
        onClick={onDelete}
        className="bg-alacrityred transition-transform transform hover:scale-110 hover:bg-red-400 duration-300 ease-in-out"
      >
        Delete
      </Button>
      <Button onClick={onSecondaryAction} variant="outline">
        {secondaryActionLabel}
      </Button>
    </div>
  );
};

export default SubmissionButtons;
