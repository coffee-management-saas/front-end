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
import { toast } from "sonner";

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
  onSave: (topping: Partial<ToppingDialogItem>) => Promise<boolean>;
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
  type FormErrors = Partial<Record<keyof FormData, string>>;
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    const name = formData.name.trim();
    if (!name) next.name = "Vui lòng nhập tên topping";

    const price = Number(formData.price);
    if (!Number.isFinite(price)) next.price = "Giá không hợp lệ";
    else if (price < 0) next.price = "Giá phải >= 0";

    return next;
  };

  const handleSave = async () => {
    if (saving) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setSaving(true);
    try {
      const ok = await onSave({
        ...topping,
        ...formData,
        name: formData.name.trim(),
        price: Number(formData.price),
      });
      if (ok) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isViewMode = mode === "view";
  const title =
    mode === "create"
      ? "Thêm topping mới"
      : mode === "edit"
        ? "Chỉnh sửa topping"
        : "Chi tiết topping";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          if (saving) return;
          setErrors({});
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-[520px] bg-card"
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên topping</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors((prev) => {
                  if (!prev.name) return prev;
                  const next = { ...prev };
                  delete next.name;
                  return next;
                });
              }}
              placeholder="Nhập tên topping..."
              disabled={isViewMode || saving}
              className={`bg-background ${errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Giá topping (₫)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1000"
              value={Number.isFinite(formData.price) ? formData.price : 0}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  price: e.target.value === "" ? 0 : Number(e.target.value),
                });
                setErrors((prev) => {
                  if (!prev.price) return prev;
                  const next = { ...prev };
                  delete next.price;
                  return next;
                });
              }}
              placeholder="Nhập giá topping..."
              disabled={isViewMode || saving}
              className={`bg-background ${errors.price ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
            {errors.price ? (
              <p className="text-xs text-destructive">{errors.price}</p>
            ) : null}
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
              disabled={isViewMode || saving}
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
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : mode === "create"
                    ? "Thêm topping"
                    : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
