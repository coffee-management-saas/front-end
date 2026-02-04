"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { EmployeeDialog } from "@/components/admin/EmployeeDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type {
  CreateEmployeeResponse,
  Employee,
  EmployeeResponse,
} from "@/types/employee";

type EmployeeRow = {
  id: string;
  employeeType: string;
  hourlyWage: number;
  weeklyHourLimit: number;
  shopId: number | null;
  userProfileId: number | null;
  updatedAt: string;
};

const mapEmployee = (e: Employee): EmployeeRow => ({
  id: String(e.employeeId),
  employeeType: e.employeeType,
  hourlyWage: Number(e.hourlyWage ?? 0),
  weeklyHourLimit: Number(e.weeklyHourLimit ?? 0),
  shopId: e.shopId ?? null,
  userProfileId: e.userProfileId ?? null,
  updatedAt: e.updatedAt,
});

const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")} VND`;

export default function EmployeesManager() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">(
    "view",
  );

  const loadEmployees = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ page: "0", size: "100" });
      const res = await fetch(`/api/employees?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as EmployeeResponse;

      if (!res.ok || data?.code < 200 || data?.code >= 300) {
        throw new Error(data?.message || "Load employees failed");
      }

      const items = (data?.data ?? []).map(mapEmployee);
      setEmployees(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load employees failed";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (employee: EmployeeRow) => {
    setSelectedEmployee(employee);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = (employee: EmployeeRow) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (payload: {
    id?: string;
    employeeType: string;
    hourlyWage: number;
    weeklyHourLimit: number;
    shopId: number | null;
    userProfileId: number | null;
  }) => {
    try {
      if (dialogMode === "create") {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res
          .json()
          .catch(() => null)) as CreateEmployeeResponse | null;

        if (!res.ok || !data || data.code < 200 || data.code >= 300) {
          throw new Error(data?.message || "Create employee failed");
        }
        if (!data.data) {
          throw new Error("Create employee failed (missing data)");
        }

        const created = mapEmployee(data.data);
        setEmployees((prev) => [created, ...prev]);
        toast.success("Đã thêm nhân viên");
      } else if (dialogMode === "edit" && selectedEmployee) {
        const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res
          .json()
          .catch(() => null)) as CreateEmployeeResponse | null;

        if (!res.ok || !data || data.code < 200 || data.code >= 300) {
          throw new Error(data?.message || "Update employee failed");
        }
        if (!data.data) {
          throw new Error("Update employee failed (missing data)");
        }

        const updated = mapEmployee(data.data);
        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
        );
        toast.success("Đã cập nhật nhân viên");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save employee failed";
      toast.error(msg);
    }
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "DELETE",
      });
      const data = (await res
        .json()
        .catch(() => null)) as { code?: number; message?: string } | null;

      if (
        !res.ok ||
        !data ||
        (data.code && (data.code < 200 || data.code >= 300))
      ) {
        throw new Error(data?.message || "Delete employee failed");
      }

      setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id));
      toast.success("Đã xóa nhân viên");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete employee failed";
      toast.error(msg);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };
  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.id.toLowerCase().includes(q) ||
      item.employeeType.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nhân viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách nhân viên
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">
                Số lượng nhân viên
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {employees.filter((e) => e.employeeType === "FULL_TIME").length}
              </p>
              <p className="text-sm text-muted-foreground">Full-time</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {employees.filter((e) => e.employeeType !== "FULL_TIME").length}
              </p>
              <p className="text-sm text-muted-foreground">
                Part-time / Temporary
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Mã NV</TableHead>
                <TableHead className="font-semibold text-center">
                  Lọai
                </TableHead>
                <TableHead className="font-semibold text-center">
                  Lương/giờ
                </TableHead>
                <TableHead className="font-semibold text-center">
                  Giờ/tuần
                </TableHead>

                <TableHead className="font-semibold text-center">
                  Profile ID
                </TableHead>
                <TableHead className="font-semibold">Cập nhật</TableHead>
                <TableHead className="font-semibold text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Đang tải nhân viên...
                  </TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-destructive"
                  >
                    {loadError}
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Không tìm thấy nhân viên nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="admin-table-row">
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell className="text-center">
                      {employee.employeeType}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatMoney(employee.hourlyWage)}
                    </TableCell>
                    <TableCell className="text-center">
                      {employee.weeklyHourLimit}
                    </TableCell>

                    <TableCell className="text-center">
                      {employee.userProfileId ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.updatedAt
                        ? new Date(employee.updatedAt).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(employee)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(employee)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>

      <EmployeeDialog
        key={`${dialogMode}-${selectedEmployee?.id ?? "new"}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        onSave={handleSave}
        mode={dialogMode}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedEmployee?.id ? `Nhân viên #${selectedEmployee.id}` : ""}
        title="Xác nhận xóa nhân viên"
        description="Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
      />
    </>
  );
}
