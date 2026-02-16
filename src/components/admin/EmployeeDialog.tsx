import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EmployeeDialogData = {
  id?: string;
  employeeType: string;
  hourlyWage: number;
  weeklyHourLimit: number;
  shopId: number | null;
  userProfileId: number | null;
};

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeDialogData | null;
  onSave: (payload: EmployeeDialogData) => void;
  mode: "view" | "edit" | "create";
}

type FormState = {
  employeeType: string;
  hourlyWage: string;
  weeklyHourLimit: string;
  shopId: string;
  userProfileId: string;
};

const toFormState = (employee?: EmployeeDialogData | null): FormState => ({
  employeeType: employee?.employeeType ?? "FULL_TIME",
  hourlyWage: employee?.hourlyWage != null ? String(employee.hourlyWage) : "0",
  weeklyHourLimit:
    employee?.weeklyHourLimit != null ? String(employee.weeklyHourLimit) : "0",
  shopId: employee?.shopId != null ? String(employee.shopId) : "",
  userProfileId:
    employee?.userProfileId != null ? String(employee.userProfileId) : "",
});

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSave,
  mode,
}: EmployeeDialogProps) {
  const [formData, setFormData] = useState<FormState>(() =>
    toFormState(employee),
  );

  const isViewMode = mode === "view";
  const title = useMemo(() => {
    if (mode === "create") return "Thêm nhân viên";
    if (mode === "edit") return "Chỉnh sửa nhân viên";
    return "Chi tiết nhân viên";
  }, [mode]);

  const handleSave = () => {
    onSave({
      id: employee?.id,
      employeeType: formData.employeeType.trim() || "FULL_TIME",
      hourlyWage: Number(formData.hourlyWage || 0),
      weeklyHourLimit: Number(formData.weeklyHourLimit || 0),
      shopId: toNumberOrNull(formData.shopId),
      userProfileId: toNumberOrNull(formData.userProfileId),
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setFormData(toFormState(employee));
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[520px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="employeeType">Loại nhân viên</Label>
            <Input
              id="employeeType"
              value={formData.employeeType}
              onChange={(e) =>
                setFormData({ ...formData, employeeType: e.target.value })
              }
              placeholder="FULL_TIME / PART_TIME / TEMPORARY"
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyWage">Lương/giờ (VND)</Label>
              <Input
                id="hourlyWage"
                type="number"
                min={0}
                value={formData.hourlyWage}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyWage: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyHourLimit">Giờ/tuần</Label>
              <Input
                id="weeklyHourLimit"
                type="number"
                min={0}
                value={formData.weeklyHourLimit}
                onChange={(e) =>
                  setFormData({ ...formData, weeklyHourLimit: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop ID</Label>
              <Input
                id="shopId"
                type="number"
                min={0}
                value={formData.shopId}
                onChange={(e) =>
                  setFormData({ ...formData, shopId: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userProfileId">Profile ID</Label>
              <Input
                id="userProfileId"
                type="number"
                min={0}
                value={formData.userProfileId}
                onChange={(e) =>
                  setFormData({ ...formData, userProfileId: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>
          </div>
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
                {mode === "create" ? "Thêm nhân viên" : "Lưu thay đổi"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
