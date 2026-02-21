"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EmployeeDialog,
  type EmployeeDialogData,
} from "@/components/admin/EmployeeDialog";
import { createShopEmployee } from "@/services/employee.service";
import { useAppContext } from "@/app/AppProvider";

const requiredFields = (payload: EmployeeDialogData) => {
  if (!payload.username.trim()) return "Thiếu username";
  if (!payload.fullname.trim()) return "Thiếu họ tên";
  if (!payload.email.trim()) return "Thiếu email";
  if (!payload.phone.trim()) return "Thiếu số điện thoại";
  if (!payload.dob.trim()) return "Thiếu ngày sinh";
  return null;
};

export default function EmployeesManagerPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode] = useState<"view" | "edit" | "create">("create");
  const [isSaving, setIsSaving] = useState(false);
  const { accessToken } = useAppContext();

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleSave = async (payload: EmployeeDialogData) => {
    const missing = requiredFields(payload);
    if (missing) {
      toast.error(missing);
      return;
    }
    if (!accessToken) {
      toast.error("Bạn chưa đăng nhập hoặc token hết hạn");
      return;
    }

    try {
      setIsSaving(true);
      await createShopEmployee(
        {
          username: payload.username,
          password: payload.password,
          fullname: payload.fullname,
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          dob: payload.dob,
          employeeType: payload.employeeType,
          hourlyWage: payload.hourlyWage,
          weeklyHourLimit: payload.weeklyHourLimit,
          employee: {
            employeeType: payload.employeeType,
            hourlyWage: payload.hourlyWage,
            weeklyHourLimit: payload.weeklyHourLimit,
          },
        },
        { accessToken },
      );
      toast.success("Đã thêm nhân viên");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tạo nhân viên thất bại";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nhân viên</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý nhân viên của quán
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90"
            disabled={isSaving}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">Tạo nhanh nhân viên</p>
              <p className="text-sm text-muted-foreground">
                Nhấn “Thêm nhân viên” để nhập thông tin
              </p>
            </div>
          </div>
        </div>
      </div>

      <EmployeeDialog
        key="create-employee"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        mode={dialogMode}
      />
    </>
  );
}
