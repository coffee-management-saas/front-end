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
  username: string;
  password?: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  employeeType: string;
  hourlyWage: number;
  weeklyHourLimit: number;
  shopId: number | null;
};

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeDialogData | null;
  onSave: (payload: EmployeeDialogData) => void;
  mode: "view" | "edit" | "create";
}

type FormState = {
  username: string;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  employeeType: string;
  hourlyWage: string;
  weeklyHourLimit: string;
  shopId: string;
};

const toFormState = (employee?: EmployeeDialogData | null): FormState => ({
  username: employee?.username ?? "",
  password: "",
  fullname: employee?.fullname ?? "",
  email: employee?.email ?? "",
  phone: employee?.phone ?? "",
  address: employee?.address ?? "",
  dob: employee?.dob ?? "",
  employeeType: employee?.employeeType ?? "FULL_TIME",
  hourlyWage: employee?.hourlyWage != null ? String(employee.hourlyWage) : "0",
  weeklyHourLimit:
    employee?.weeklyHourLimit != null ? String(employee.weeklyHourLimit) : "0",
  shopId: employee?.shopId != null ? String(employee.shopId) : "",
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
    if (mode === "create") return "Them nhan vien";
    if (mode === "edit") return "Chinh sua nhan vien";
    return "Chi tiet nhan vien";
  }, [mode]);

  const handleSave = () => {
    onSave({
      id: employee?.id,
      username: formData.username.trim(),
      password: formData.password.trim() || undefined,
      fullname: formData.fullname.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      dob: formData.dob.trim(),
      employeeType: formData.employeeType.trim() || "FULL_TIME",
      hourlyWage: Number(formData.hourlyWage || 0),
      weeklyHourLimit: Number(formData.weeklyHourLimit || 0),
      shopId: toNumberOrNull(formData.shopId),
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
      <DialogContent
        className="sm:max-w-[640px] bg-card"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={mode === "edit" ? "De trong neu khong doi" : ""}
                disabled={isViewMode}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">Ho ten</Label>
            <Input
              id="fullname"
              value={formData.fullname}
              onChange={(e) =>
                setFormData({ ...formData, fullname: e.target.value })
              }
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">So dien thoai</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dia chi</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              disabled={isViewMode}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Ngay sinh</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                disabled={isViewMode}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeType">Loai nhan vien</Label>
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
              <Label htmlFor="hourlyWage">Luong/gio (VND)</Label>
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
              <Label htmlFor="weeklyHourLimit">Gio/tuan</Label>
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
        </div>

        <DialogFooter>
          {isViewMode ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Dong
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Huy
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                {mode === "create" ? "Them nhan vien" : "Luu thay doi"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
