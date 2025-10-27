"use client";

import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SendToNotesButtonProps {
  x: number;
  y: number;
  onClick: () => void;
}

/**
 * Floating button that appears when text is selected
 */
export function SendToNotesButton({ x, y, onClick }: SendToNotesButtonProps) {
  return (
    <div
      className="fixed z-50 animate-in fade-in zoom-in duration-200"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Button
        size="sm"
        onClick={onClick}
        className="shadow-lg bg-primary hover:bg-primary/90"
      >
        <StickyNote className="h-4 w-4 mr-2" />
        Send to Notes
      </Button>
    </div>
  );
}
