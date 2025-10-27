import { useState, useEffect } from "react";

export interface TextSelection {
  text: string;
  x: number;
  y: number;
}

/**
 * Hook to detect text selection and get position
 * @returns Selected text and position, or null if no selection
 */
export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selectedText = window.getSelection()?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = window.getSelection()?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setSelection({
            text: selectedText,
            x: rect.left + rect.width / 2,
            y: rect.top - 10, // Position above selection
          });
        }
      } else {
        setSelection(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, []);

  return selection;
}
