"use client";

import { Button } from "@/components/ui/button";

interface SubmissionButtonsProps {
  onDelete: () => void;
  onSecondaryAction: () => void;
  secondaryActionLabel: string;
}

const SubmissionButtons = ({ onDelete, onSecondaryAction, secondaryActionLabel }: SubmissionButtonsProps) => {
  return (
    <div className="flex flex-col gap-32">
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
