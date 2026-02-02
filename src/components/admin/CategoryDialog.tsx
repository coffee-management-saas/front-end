import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Category } from "@/types/catagories";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSave: (category: Partial<Category>) => void;
  mode: "view" | "edit" | "create";
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
  mode,
}: CategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  //   useEffect(() => {
  //     if (category) {
  //       setFormData({
  //         name: category.name,
  //         description: category.description,
  //         status: category.status,
  //       });
  //     } else {
  //       setFormData({
  //         name: '',
  //         description: '',
  //         status: 'active',
  //       });
  //     }
  //   }, [category, open]);

  const handleSave = () => {
    onSave({
      ...category,
      ...formData,
    });
    onOpenChange(false);
  };

  const isViewMode = mode === "view";
  const title =
    mode === "create"
      ? "Thêm danh mục mới"
      : mode === "edit"
        ? "Chỉnh sửa danh mục"
        : "Chi tiết danh mục";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên danh mục</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên danh mục..."
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Nhập mô tả danh mục..."
              rows={4}
              disabled={isViewMode}
              className="bg-background resize-none"
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

          {category && isViewMode && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số sản phẩm:</span>
                <span className="font-medium">{category.productCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ngày tạo:</span>
                <span className="font-medium">
                  {category.createdAt.toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Cập nhật lần cuối:
                </span>
                <span className="font-medium">
                  {category.updatedAt.toLocaleDateString("vi-VN")}
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
                {mode === "create" ? "Thêm danh mục" : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
