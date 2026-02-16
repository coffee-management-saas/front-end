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
import { Switch } from "@/components/ui/switch";

export type ToppingDialogItem = {
  id: string;
  name: string;
  price: number;
  status: "active" | "inactive";
};

interface ToppingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topping?: ToppingDialogItem | null;
  onSave: (topping: Partial<ToppingDialogItem>) => void;
  mode: "view" | "edit" | "create";
}

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")} VND`;

export function ToppingDialog({
  open,
  onOpenChange,
  topping,
  onSave,
  mode,
}: ToppingDialogProps) {
  type FormData = {
    name: string;
    price: number;
    status: "active" | "inactive";
  };
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === "create" || !topping) {
      return { name: "", price: 0, status: "active" };
    }
    return {
      name: topping.name ?? "",
      price: Number(topping.price ?? 0),
      status: topping.status ?? "active",
    };
  });

  const handleSave = () => {
    onSave({
      ...topping,
      ...formData,
    });
    onOpenChange(false);
  };

  const isViewMode = mode === "view";
  const title =
    mode === "create"
      ? "Thêm topping mới"
      : mode === "edit"
        ? "Chỉnh sửa topping"
        : "Chi tiết topping";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên topping</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên topping..."
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Giá topping (₫)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1000"
              value={Number.isFinite(formData.price) ? formData.price : 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: Number(e.target.value) || 0,
                })
              }
              placeholder="Nhập giá topping..."
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Trạng thái</Label>
              <p className="text-sm text-muted-foreground">
                {formData.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
              </p>
            </div>
            <Switch
              checked={formData.status === "active"}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  status: checked ? "active" : "inactive",
                })
              }
              disabled={isViewMode}
            />
          </div>

          {topping && isViewMode && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giá hiện tại:</span>
                <span className="font-medium">
                  {formatPrice(topping.price)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {isViewMode ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
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
                {mode === "create" ? "Thêm topping" : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
