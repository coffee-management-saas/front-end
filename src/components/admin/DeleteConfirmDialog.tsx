"use client";

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
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
  categoryName?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  cancelClassName?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  categoryName,
  title,
  description,
  confirmLabel,
  confirmClassName,
  cancelClassName,
}: DeleteConfirmDialogProps) {
  const resolvedItemName = itemName ?? categoryName;
  const resolvedTitle = title ?? "Xác nhận xóa";
  const resolvedDescription =
    description ??
    `Bạn có chắc chắn muốn xóa${
      resolvedItemName ? ` "${resolvedItemName}"` : ""
    }? Hành động này không thể hoàn tác.`;
  const resolvedConfirmLabel = confirmLabel ?? "Xóa";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={cn(
              "border border-gray-200 bg-white text-black shadow-none hover:bg-gray-50 hover:text-black focus-visible:ring-0 focus-visible:ring-offset-0",
              cancelClassName,
            )}
          >
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              confirmClassName,
            )}
          >
            {resolvedConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
