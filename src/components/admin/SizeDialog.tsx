import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SizeStatus } from "@/types/size";

export type SizeDialogItem = {
  id?: string;
  code: string;
  status: SizeStatus;
};

interface SizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: SizeDialogItem | null;
  onSave: (size: Partial<SizeDialogItem>) => void;
  mode: "view" | "edit" | "create";
}

export function SizeDialog({
  open,
  onOpenChange,
  size,
  onSave,
  mode,
}: SizeDialogProps) {
  type FormData = {
    code: string;
    status: SizeStatus;
  };

  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === "create" || !size) {
      return { code: "", status: "ACTIVE" };
    }
    return {
      code: size.code ?? "",
      status: size.status ?? "ACTIVE",
    };
  });

  const handleSave = () => {
    onSave({
      ...size,
      ...formData,
    });
    onOpenChange(false);
  };

  const isViewMode = mode === "view";
  const title =
    mode === "create"
      ? "Thêm size mới"
      : mode === "edit"
        ? "Chỉnh sửa size"
        : "Chi tiết size";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Mã size</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="Nhập mã size..."
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as SizeStatus,
                })
              }
              disabled={isViewMode}
            >
              <option value="ACTIVE">Họat động</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          {isViewMode ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Dùng
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                {mode === "create" ? "Thêm size" : "Luu thay đổi"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
