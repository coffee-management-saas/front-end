"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
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
  EmployeeDto,
  EmployeesMeta,
  ShopEmployeeProfile,
} from "@/types/employee";
import {
  createEmployee,
  deleteEmployeeById,
  getEmployeeById,
  getEmployees,
  updateEmployeeById,
  type CreateEmployeeInput,
} from "@/services/employee.service";
import type { UpdateEmployeeInput } from "@/types/employee";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (input?: string) => {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toIsoDob = (input: string) => {
  const v = input.trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toISOString();
};

export default function EmployeesManagerPage() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [meta, setMeta] = useState<EmployeesMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [fullnameByEmployeeId, setFullnameByEmployeeId] = useState<
    Record<number, string>
  >({});
  const [phoneByEmployeeId, setPhoneByEmployeeId] = useState<
    Record<number, string>
  >({});

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<ShopEmployeeProfile | null>(
    null,
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateEmployeeInput | null>(
    null,
  );
  const createSubmitLockRef = useRef(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeDto | null>(null);
  const [editForm, setEditForm] = useState<UpdateEmployeeInput | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeDto | null>(
    null,
  );

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getEmployees({ page, size });
      if (!data || data.code !== 200) {
        throw new Error(data?.message || "Load employees failed");
      }
      setEmployees(data.data ?? []);
      setMeta(data.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load employees failed";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const missing = employees
        .map((e) => e.employeeId)
        .filter(
          (id) => !(id in fullnameByEmployeeId) || !(id in phoneByEmployeeId),
        );
      if (missing.length === 0) return;

      await Promise.all(
        missing.map(async (id) => {
          try {
            const profile = await getEmployeeById(id);
            const fullname =
              String(profile.fullname ?? "").trim() ||
              String(profile.username ?? "").trim();
            const phone = String(profile.phone ?? "").trim();
            if (!fullname) return;
            if (cancelled) return;
            setFullnameByEmployeeId((prev) => ({ ...prev, [id]: fullname }));
            if (phone) {
              setPhoneByEmployeeId((prev) => ({ ...prev, [id]: phone }));
            }
          } catch {
            // ignore: keep table responsive even if some profiles fail to load
          }
        }),
      );
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [employees, fullnameByEmployeeId, phoneByEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const haystack = [
        String(emp.employeeId ?? ""),
        String(emp.userProfileId ?? ""),
        fullnameByEmployeeId[emp.employeeId] ?? "",
        phoneByEmployeeId[emp.employeeId] ?? "",
        String(emp.shopId ?? ""),
        String(emp.employeeType ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employees, fullnameByEmployeeId, phoneByEmployeeId, searchQuery]);

  const partTimeCount = useMemo(
    () =>
      employees.filter(
        (e) => String(e.employeeType).toUpperCase() === "PART_TIME",
      ).length,
    [employees],
  );

  const fullTimeCount = useMemo(
    () =>
      employees.filter(
        (e) => String(e.employeeType).toUpperCase() === "FULL_TIME",
      ).length,
    [employees],
  );

  const temporaryCount = useMemo(
    () =>
      employees.filter(
        (e) => String(e.employeeType).toUpperCase() === "TEMPORARY",
      ).length,
    [employees],
  );

  const canPrev = page > 0 && !isLoading;
  const canNext = !isLoading && (meta ? page + 1 < meta.lastPage : true);

  const handleView = useCallback(async (emp: EmployeeDto) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewEmployee(null);
    try {
      const data = await getEmployeeById(emp.employeeId);
      setViewEmployee(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load employee failed";
      toast.error(msg);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const openCreate = useCallback(() => {
    setCreateForm({
      username: "",
      password: "",
      fullname: "",
      email: "",
      phone: "",
      address: "",
      dob: "",
      employeeType: "PART_TIME",
      hourlyWage: 0,
      weeklyHourLimit: 0,
    });
    setCreateDialogOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!createForm) return;
    if (createSubmitLockRef.current) return;
    createSubmitLockRef.current = true;

    const payload: CreateEmployeeInput = {
      ...createForm,
      username: createForm.username.trim(),
      password: createForm.password.trim(),
      fullname: createForm.fullname.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim(),
      address: createForm.address.trim(),
      dob: toIsoDob(createForm.dob),
      employeeType: String(
        createForm.employeeType ?? "PART_TIME",
      ).toUpperCase(),
      hourlyWage: Number(createForm.hourlyWage),
      weeklyHourLimit: Number(createForm.weeklyHourLimit),
    };

    if (
      !payload.username ||
      !payload.password ||
      !payload.fullname ||
      !payload.email ||
      !payload.phone ||
      !payload.address ||
      !payload.dob ||
      !payload.employeeType ||
      !Number.isFinite(payload.hourlyWage) ||
      !Number.isFinite(payload.weeklyHourLimit)
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      createSubmitLockRef.current = false;
      return;
    }

    setCreateSaving(true);
    try {
      const created = await createEmployee(payload);
      const detail = created?.employee;

      if (
        detail &&
        typeof detail.employeeId === "number" &&
        Number.isFinite(detail.employeeId)
      ) {
        const employeeId = detail.employeeId;
        setEmployees((prev) => {
          const next = [
            {
              employeeId,
              shopId: detail.shopId ?? 0,
              userProfileId:
                created?.userProfileId ?? detail.userProfileId ?? 0,
              employeeType: detail.employeeType,
              hourlyWage: detail.hourlyWage,
              weeklyHourLimit: detail.weeklyHourLimit,
              updatedAt: detail.updatedAt ?? new Date().toISOString(),
            },
            ...prev,
          ];
          return next.slice(0, size);
        });

        if (created?.fullname) {
          setFullnameByEmployeeId((prev) => ({
            ...prev,
            [employeeId]: created.fullname,
          }));
        }
        if (created?.phone) {
          setPhoneByEmployeeId((prev) => ({
            ...prev,
            [employeeId]: created.phone,
          }));
        }

        setMeta((prev) => {
          if (!prev) return prev;
          const totalElements = (prev.totalElements ?? 0) + 1;
          const sizeMeta = prev.size || size;
          const calcLastPage = Math.max(1, Math.ceil(totalElements / sizeMeta));
          return {
            ...prev,
            totalElements,
            lastPage: Math.max(prev.lastPage ?? 1, calcLastPage),
          };
        });
      }

      toast.success("Tạo nhân viên thành công");
      setCreateDialogOpen(false);
      setCreateForm(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create employee failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
      createSubmitLockRef.current = false;
    }
  }, [createForm, size]);

  const openEdit = useCallback((emp: EmployeeDto) => {
    setEditEmployee(emp);
    setEditForm({
      userProfileId: emp.userProfileId,
      employeeType: emp.employeeType,
      hourlyWage: emp.hourlyWage,
      weeklyHourLimit: emp.weeklyHourLimit,
    });
    setEditDialogOpen(true);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editEmployee || !editForm) return;
    setEditSaving(true);
    try {
      const updated = await updateEmployeeById(
        editEmployee.employeeId,
        editForm,
      );

      setEmployees((prev) =>
        prev.map((row) =>
          row.employeeId === updated.employeeId
            ? {
                ...row,
                employeeType: updated.employeeType,
                hourlyWage: updated.hourlyWage,
                weeklyHourLimit: updated.weeklyHourLimit,
                updatedAt: updated.updatedAt,
              }
            : row,
        ),
      );

      toast.success("Cập nhật nhân viên thành công");
      setEditDialogOpen(false);
      setEditEmployee(null);
      setEditForm(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update employee failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  }, [editEmployee, editForm]);

  const handleDelete = useCallback((emp: EmployeeDto) => {
    setDeleteEmployee(emp);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteEmployee) return;
    setDeleteSaving(true);
    try {
      await deleteEmployeeById(deleteEmployee.employeeId);

      setEmployees((prev) =>
        prev.filter((row) => row.employeeId !== deleteEmployee.employeeId),
      );

      setFullnameByEmployeeId((prev) => {
        const next = { ...prev };
        delete next[deleteEmployee.employeeId];
        return next;
      });
      setPhoneByEmployeeId((prev) => {
        const next = { ...prev };
        delete next[deleteEmployee.employeeId];
        return next;
      });

      setMeta((prev) => {
        if (!prev) return prev;
        const totalElements = Math.max(0, (prev.totalElements ?? 0) - 1);
        const sizeMeta = prev.size || size;
        const calcLastPage = Math.max(1, Math.ceil(totalElements / sizeMeta));
        return {
          ...prev,
          totalElements,
          lastPage: Math.min(prev.lastPage ?? 1, calcLastPage),
        };
      });

      toast.success("Xóa nhân viên thành công");
      setDeleteDialogOpen(false);
      setDeleteEmployee(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete employee failed";
      toast.error(msg);
    } finally {
      setDeleteSaving(false);
    }
  }, [deleteEmployee, size]);

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nhân viên</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách nhân viên của quán
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/schedules-manager">Lịch làm việc</Link>
            </Button>
            <Button
              onClick={openCreate}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhân viên
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {meta?.totalElements ?? employees.length}
                </p>
                <p className="text-sm text-muted-foreground">Tổng nhân viên</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partTimeCount}</p>
                <p className="text-sm text-muted-foreground">
                  Số lượng Part-time
                </p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fullTimeCount}</p>
                <p className="text-sm text-muted-foreground">
                  Số lượng Full-time
                </p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{temporaryCount}</p>
                <p className="text-sm text-muted-foreground">
                  Số lượng Temporary
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo ID, loại nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Trang {page + 1}
                {meta?.lastPage ? ` / ${meta.lastPage}` : ""}
              </span>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!canPrev}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
              >
                Sau
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-center">
                    Họ và tên
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Số điện thoại
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Loại
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Lương/giờ
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Giờ/tuần
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
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải nhân viên...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-destructive"
                    >
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy nhân viên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.employeeId} className="admin-table-row">
                      <TableCell className="text-center text-muted-foreground">
                        {fullnameByEmployeeId[emp.employeeId] ?? "—"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {phoneByEmployeeId[emp.employeeId] ?? "â€”"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="admin-badge admin-badge-inactive">
                          {emp.employeeType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(emp.hourlyWage)}
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.weeklyHourLimit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(emp.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(emp)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(emp)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(emp)}
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

      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            setViewEmployee(null);
            setViewLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base">Chi tiết nhân viên</DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <div className="text-sm text-muted-foreground py-2">
              Đang tải chi tiết nhân viên...
            </div>
          ) : !viewEmployee ? (
            <div className="text-sm text-muted-foreground py-2">
              Không có dữ liệu
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="grid gap-2">
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <p className="text-xs text-muted-foreground">Họ và tên</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewEmployee.fullname || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewEmployee.username || "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewEmployee.email || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <p className="text-xs text-muted-foreground">Số điện thoại</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewEmployee.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <p className="text-xs text-muted-foreground">Ngày sinh</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {viewEmployee.dob || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-2">
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {formatDateTime(viewEmployee.createdAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/20 p-2">
                <p className="text-xs text-muted-foreground">Đại chỉ</p>
                <p className="mt-0.5 text-sm font-medium">
                  {viewEmployee.address || "—"}
                </p>
              </div>

              <div className="rounded-md border border-border p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-xs text-muted-foreground">Loại</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {viewEmployee.employee?.employeeType || "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-xs text-muted-foreground">
                      Tiền lương mỗi giờ
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {typeof viewEmployee.employee?.hourlyWage === "number"
                        ? formatCurrency(viewEmployee.employee.hourlyWage)
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-xs text-muted-foreground">
                      Giới hạn giờ mỗi tuần
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {viewEmployee.employee?.weeklyHourLimit ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-xs text-muted-foreground">
                      Cập nhật lúc
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatDateTime(viewEmployee.employee?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreateSaving(false);
            setCreateForm(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base">Thêm nhân viên</DialogTitle>
          </DialogHeader>

          {!createForm ? null : (
            <div className="grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    className="h-9"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, username: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    className="h-9"
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, password: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Họ và tên</label>
                  <Input
                    className="h-9"
                    value={createForm.fullname}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, fullname: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Ngày sinh</label>
                  <Input
                    className="h-9"
                    type="date"
                    value={createForm.dob}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, dob: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    className="h-9"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <Input
                    className="h-9"
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Địa chỉ</label>
                <Input
                  className="h-9"
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm((prev) =>
                      prev ? { ...prev, address: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Loại</label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={String(createForm.employeeType)}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              employeeType: e.target.value,
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="PART_TIME">PART_TIME</option>
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="TEMPORARY">TEMPORARY</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Lương/giờ</label>
                  <Input
                    className="h-9"
                    type="number"
                    value={String(createForm.hourlyWage)}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? { ...prev, hourlyWage: Number(e.target.value) }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Giờ/tuần</label>
                  <Input
                    className="h-9"
                    type="number"
                    value={String(createForm.weeklyHourLimit)}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              weeklyHourLimit: Number(e.target.value),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createSaving || !createForm}
            >
              {createSaving ? "Đang tạo..." : "Tạo nhân viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditSaving(false);
            setEditEmployee(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto p-3">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base">Cập nhật nhân viên</DialogTitle>
          </DialogHeader>

          {!editEmployee || !editForm ? null : (
            <div className="grid gap-3">
              <div className="rounded-md border border-border bg-muted/20 p-2">
                <p className="text-xs text-muted-foreground">Họ và tên</p>
                <p className="mt-0.5 text-sm font-medium">
                  {fullnameByEmployeeId[editEmployee.employeeId] ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  SĐT: {phoneByEmployeeId[editEmployee.employeeId] ?? "—"}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Loại</label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={String(editForm.employeeType)}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              employeeType: e.target.value,
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="PART_TIME">PART_TIME</option>
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="TEMPORARY">TEMPORARY</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Lương/giờ</label>
                  <Input
                    className="h-9"
                    type="number"
                    value={String(editForm.hourlyWage)}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, hourlyWage: Number(e.target.value) }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Giờ/tuần</label>
                  <Input
                    className="h-9"
                    type="number"
                    value={String(editForm.weeklyHourLimit)}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              weeklyHourLimit: Number(e.target.value),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              variant="ghost"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSaving || !editForm}
            >
              {editSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteSaving(false);
            setDeleteEmployee(null);
          }
        }}
        onConfirm={confirmDelete}
        itemName={
          deleteEmployee
            ? fullnameByEmployeeId[deleteEmployee.employeeId] ||
              `#${deleteEmployee.employeeId}`
            : ""
        }
        title="Xác nhận xóa nhân viên"
        description={
          deleteEmployee
            ? `Bạn có chắc chắn muốn xóa nhân viên "${
                fullnameByEmployeeId[deleteEmployee.employeeId] ||
                `#${deleteEmployee.employeeId}`
              }"? Hành động này không thể hoàn tác.`
            : "Bạn có chắc chắn muốn xóa nhân viên? Hành động này không thể hoàn tác."
        }
        confirmLabel={deleteSaving ? "Đang xóa..." : "Xóa"}
      />
    </>
  );
}
