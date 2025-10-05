"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { FileText, Clock, Trash2 } from "lucide-react";
import type { Prescription } from "@/db/schema";

interface PrescriptionListProps {
  prescriptions: Prescription[];
}

export function PrescriptionList({ prescriptions }: PrescriptionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleDeleteClick = (e: React.MouseEvent, prescription: Prescription) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPrescription(prescription);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPrescription) return;

    setDeletingId(selectedPrescription.id);
    setShowDeleteDialog(false);

    try {
      const response = await fetch(`/api/prescriptions?id=${selectedPrescription.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prescription");
      }

      toast({
        title: "Prescription Deleted",
        description: "The prescription has been successfully deleted.",
      });

      // Refresh the page to update the list
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete prescription",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setSelectedPrescription(null);
    }
  };

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {prescriptions.map((prescription) => (
          <div key={prescription.id} className="relative group">
            <Link
              href={`/prescription/${prescription.id}`}
              className="block transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Card className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <h3 className="font-semibold text-xs sm:text-sm truncate">
                      {prescription.fileName}
                    </h3>
                  </div>
                  <StatusBadge status={prescription.status} />
                </div>

                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">
                      {formatDistanceToNow(new Date(prescription.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="text-[10px] sm:text-xs">
                    {(prescription.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                    {prescription.fileType.toUpperCase()}
                  </div>

                  {prescription.extractedText && (
                    <p className="line-clamp-2 text-[10px] sm:text-xs">
                      {prescription.extractedText.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </Card>
            </Link>
            
            {/* Delete Button - Shows on hover on desktop, always visible on mobile */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 h-7 w-7 sm:h-8 sm:w-8 shadow-md"
              onClick={(e) => handleDeleteClick(e, prescription)}
              disabled={deletingId === prescription.id}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedPrescription?.fileName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusBadge({ status }: { status: Prescription["status"] }) {
  const variants: Record<
    Prescription["status"],
    { label: string; className: string }
  > = {
    uploading: { label: "Uploading", className: "bg-blue-100 text-blue-800" },
    processing: {
      label: "Processing",
      className: "bg-yellow-100 text-yellow-800",
    },
    ai_enhancing: {
      label: "AI Enhancing",
      className: "bg-purple-100 text-purple-800",
    },
    classifying: {
      label: "Classifying",
      className: "bg-indigo-100 text-indigo-800",
    },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    failed: { label: "Failed", className: "bg-red-100 text-red-800" },
  };

  const variant = variants[status];

  return (
    <Badge variant="secondary" className={`${variant.className} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0`}>
      {variant.label}
    </Badge>
  );
}
