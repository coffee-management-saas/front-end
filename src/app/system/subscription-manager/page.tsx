"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

type SubscriptionPlanStatus = "ACTIVE" | "INACTIVE" | "DELETED" | string;

type SubscriptionPlan = {
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  subscriptionPlanDescription: string;
  priceMonthly: number;
  priceYearly: number;
  configLimit: Record<string, string>;
  subscriptionPlanStatus: SubscriptionPlanStatus;
  createdAt: string;
  updatedAt: string | null;
};

type CreatePlanForm = {
  subscriptionPlanName: string;
  subscriptionPlanDescription: string;
  priceMonthly: string;
  priceYearly: string;
  maxProjects: string;
  storageGb: string;
  aiQueriesPerMonth: string;
  subscriptionPlanStatus: string;
};

const configKeyLabel = (key: string) => {
  switch (key) {
    case "max_projects":
      return "Số lượng tạo dự án tối đa";
    case "storage_gb":
      return "Dung lượng lưu trữ tối đa";
    case "ai_queries_per_month":
      return "Số lượt gọi/tương tác AI mỗi tháng";
    default:
      return key;
  }
};

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  const res = await fetch("/api/system/subscription-plan", {
    cache: "no-store",
    credentials: "include",
  });

  const data = await parseJsonSafely<SubscriptionPlan[]>(res);
  if (!res.ok || !data) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || "Load subscription plans failed");
  }

  return data;
};

const fetchPlanById = async (id: number): Promise<SubscriptionPlan> => {
  const res = await fetch(`/api/system/subscription-plan/${id}`, {
    cache: "no-store",
    credentials: "include",
  });

  const data = await parseJsonSafely<SubscriptionPlan | { message?: string }>(
    res,
  );

  if (!res.ok || !data || Array.isArray(data)) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Load failed (${res.status})`);
  }

  return data as SubscriptionPlan;
};

const updatePlanById = async (
  id: number,
  payload: CreatePlanForm,
): Promise<SubscriptionPlan> => {
  const res = await fetch(`/api/system/subscription-plan/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      subscriptionPlanName: payload.subscriptionPlanName.trim(),
      subscriptionPlanDescription: payload.subscriptionPlanDescription.trim(),
      priceMonthly: Number(payload.priceMonthly),
      priceYearly: Number(payload.priceYearly),
      configLimit: {
        max_projects: payload.maxProjects.trim(),
        storage_gb: payload.storageGb.trim(),
        ai_queries_per_month: payload.aiQueriesPerMonth.trim(),
      },
      subscriptionPlanStatus: payload.subscriptionPlanStatus.trim(),
    }),
  });

  const data = await parseJsonSafely<SubscriptionPlan | { message?: string }>(
    res,
  );

  if (!res.ok || !data || Array.isArray(data)) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Update failed (${res.status})`);
  }

  return data as SubscriptionPlan;
};

const deletePlanById = async (id: number): Promise<void> => {
  const res = await fetch(`/api/system/subscription-plan/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await parseJsonSafely<{ message?: string }>(res);

  if (!res.ok) {
    throw new Error(data?.message || `Delete failed (${res.status})`);
  }
};

const createPlan = async (
  payload: CreatePlanForm,
): Promise<SubscriptionPlan> => {
  const res = await fetch("/api/system/subscription-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      subscriptionPlanName: payload.subscriptionPlanName.trim(),
      subscriptionPlanDescription: payload.subscriptionPlanDescription.trim(),
      priceMonthly: Number(payload.priceMonthly),
      priceYearly: Number(payload.priceYearly),
      configLimit: {
        max_projects: payload.maxProjects.trim(),
        storage_gb: payload.storageGb.trim(),
        ai_queries_per_month: payload.aiQueriesPerMonth.trim(),
      },
      subscriptionPlanStatus: payload.subscriptionPlanStatus.trim(),
    }),
  });

  const data = await parseJsonSafely<SubscriptionPlan | { message?: string }>(
    res,
  );

  if (!res.ok || !data || Array.isArray(data)) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Create failed (${res.status})`);
  }

  return data as SubscriptionPlan;
};

const formatDateTime = (input?: string | null) => {
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

const normalizeStatus = (status?: string) =>
  String(status ?? "")
    .toUpperCase()
    .replace(/[^A-Z_]/g, "");

const statusLabel = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
      return "Đang áp dụng";
    case "INACTIVE":
      return "Tạm dừng";
    case "EXPIRED":
      return "Hết hạn";
    case "CANCELLED":
      return "Đã hủy";
    case "DELETED":
      return "Đã xóa";
    default:
      return status || "—";
  }
};

const statusBadgeClass = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    case "INACTIVE":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    case "EXPIRED":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "CANCELLED":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-200";
    case "DELETED":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-200";
    default:
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

export default function SystemSubscriptionManagerPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePlanForm>({
    subscriptionPlanName: "",
    subscriptionPlanDescription: "",
    priceMonthly: "",
    priceYearly: "",
    maxProjects: "",
    storageGb: "",
    aiQueriesPerMonth: "",
    subscriptionPlanStatus: "ACTIVE",
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editPlanId, setEditPlanId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CreatePlanForm>({
    subscriptionPlanName: "",
    subscriptionPlanDescription: "",
    priceMonthly: "",
    priceYearly: "",
    maxProjects: "",
    storageGb: "",
    aiQueriesPerMonth: "",
    subscriptionPlanStatus: "ACTIVE",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(
    null,
  );
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewPlan, setViewPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchPlans();
        if (!mounted) return;
        setPlans(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load failed";
        if (!mounted) return;
        setLoadError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) => {
      return (
        String(p.subscriptionPlanId).includes(q) ||
        p.subscriptionPlanName.toLowerCase().includes(q)
      );
    });
  }, [plans, searchQuery]);

  const activeCount = plans.filter(
    (p) => normalizeStatus(p.subscriptionPlanStatus) === "ACTIVE",
  ).length;

  const openCreate = () => {
    setCreateForm({
      subscriptionPlanName: "",
      subscriptionPlanDescription: "",
      priceMonthly: "",
      priceYearly: "",
      maxProjects: "",
      storageGb: "",
      aiQueriesPerMonth: "",
      subscriptionPlanStatus: "ACTIVE",
    });
    setCreateDialogOpen(true);
  };

  const openView = async (id: number) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewPlan(null);
    try {
      const data = await fetchPlanById(id);
      setViewPlan(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load failed";
      setViewError(msg);
      toast.error(msg);
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditPlanId(plan.subscriptionPlanId);
    setEditForm({
      subscriptionPlanName: plan.subscriptionPlanName ?? "",
      subscriptionPlanDescription: plan.subscriptionPlanDescription ?? "",
      priceMonthly: String(plan.priceMonthly ?? ""),
      priceYearly: String(plan.priceYearly ?? ""),
      maxProjects: String(plan.configLimit?.max_projects ?? ""),
      storageGb: String(plan.configLimit?.storage_gb ?? ""),
      aiQueriesPerMonth: String(plan.configLimit?.ai_queries_per_month ?? ""),
      subscriptionPlanStatus:
        normalizeStatus(plan.subscriptionPlanStatus) || "ACTIVE",
    });
    setEditDialogOpen(true);
  };

  const openDelete = (plan: SubscriptionPlan) => {
    setDeleteTarget(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteSaving) return;
    if (!deleteTarget) return;

    setDeleteSaving(true);
    try {
      await deletePlanById(deleteTarget.subscriptionPlanId);

      setPlans((prev) =>
        prev.filter(
          (p) => p.subscriptionPlanId !== deleteTarget.subscriptionPlanId,
        ),
      );

      if (viewPlan?.subscriptionPlanId === deleteTarget.subscriptionPlanId) {
        setViewDialogOpen(false);
        setViewPlan(null);
      }
      if (editPlanId === deleteTarget.subscriptionPlanId) {
        setEditDialogOpen(false);
        setEditPlanId(null);
      }

      toast.success(`Đã xóa gói "${deleteTarget.subscriptionPlanName}"`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleEditSubmit = async () => {
    if (editSaving) return;
    if (!editPlanId) return;

    if (!editForm.subscriptionPlanName.trim()) {
      toast.error("Vui lòng nhập tên gói");
      return;
    }
    if (!editForm.subscriptionPlanDescription.trim()) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }
    if (
      !editForm.priceMonthly ||
      !Number.isFinite(Number(editForm.priceMonthly))
    ) {
      toast.error("Vui lòng nhập giá/tháng hợp lệ");
      return;
    }
    if (
      !editForm.priceYearly ||
      !Number.isFinite(Number(editForm.priceYearly))
    ) {
      toast.error("Vui lòng nhập giá/năm hợp lệ");
      return;
    }

    const status = normalizeStatus(editForm.subscriptionPlanStatus);
    if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "DELETED") {
      toast.error("Trạng thái không hợp lệ");
      return;
    }

    setEditSaving(true);
    try {
      const updated = await updatePlanById(editPlanId, {
        ...editForm,
        subscriptionPlanStatus: status,
      });

      setPlans((prev) =>
        prev.map((p) => (p.subscriptionPlanId === editPlanId ? updated : p)),
      );

      if (viewPlan?.subscriptionPlanId === editPlanId) {
        setViewPlan(updated);
      }

      toast.success(`Đã cập nhật gói "${updated.subscriptionPlanName}"`);
      setEditDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (createSaving) return;

    if (!createForm.subscriptionPlanName.trim()) {
      toast.error("Vui lòng nhập tên gói");
      return;
    }
    if (!createForm.subscriptionPlanDescription.trim()) {
      toast.error("Vui lòng nhập mô tả");
      return;
    }
    if (
      !createForm.priceMonthly ||
      !Number.isFinite(Number(createForm.priceMonthly))
    ) {
      toast.error("Vui lòng nhập giá/tháng hợp lệ");
      return;
    }
    if (
      !createForm.priceYearly ||
      !Number.isFinite(Number(createForm.priceYearly))
    ) {
      toast.error("Vui lòng nhập giá/năm hợp lệ");
      return;
    }

    const status = normalizeStatus(createForm.subscriptionPlanStatus);
    if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "DELETED") {
      toast.error("Trạng thái không hợp lệ");
      return;
    }

    setCreateSaving(true);
    try {
      const created = await createPlan({
        ...createForm,
        subscriptionPlanStatus: status,
      });
      setPlans((prev) => [created, ...prev]);
      toast.success(`Đã tạo gói "${created.subscriptionPlanName}"`);
      setCreateDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gói thành viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các gói thành viên của hệ thống
          </p>
        </div>

        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Thêm gói thành viên
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{plans.length}</p>
              <p className="text-sm text-muted-foreground">Tổng gói</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Tag className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Đang áp dụng</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc ID..."
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
                <TableHead className="font-semibold">Tên gói</TableHead>
                <TableHead className="font-semibold">Mô tả</TableHead>
                <TableHead className="font-semibold text-right">
                  Giá / tháng
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Giá / năm
                </TableHead>

                <TableHead className="font-semibold text-center">
                  Trạng thái
                </TableHead>
                <TableHead className="font-semibold">Tạo lúc</TableHead>
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
                    Đang tải gói subscription...
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
              ) : filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Không tìm thấy gói nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow
                    key={plan.subscriptionPlanId}
                    className="admin-table-row"
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{plan.subscriptionPlanName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal max-w-[420px]">
                      {plan.subscriptionPlanDescription || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-800">
                      {formatCurrency(plan.priceMonthly)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {formatCurrency(plan.priceYearly)}
                    </TableCell>

                    <TableCell className="text-center">
                      <span
                        className={statusBadgeClass(
                          plan.subscriptionPlanStatus,
                        )}
                      >
                        {statusLabel(plan.subscriptionPlanStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(plan.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void openView(plan.subscriptionPlanId)}
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(plan)}
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDelete(plan)}
                          aria-label="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm gói subscription</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên gói</label>
              <Input
                value={createForm.subscriptionPlanName}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    subscriptionPlanName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={createForm.subscriptionPlanDescription}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    subscriptionPlanDescription: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá / tháng</label>
                <Input
                  type="number"
                  value={createForm.priceMonthly}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      priceMonthly: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá / năm</label>
                <Input
                  type="number"
                  value={createForm.priceYearly}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      priceYearly: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Số lượng “project” tối đa
                </label>
                <Input
                  value={createForm.maxProjects}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      maxProjects: e.target.value,
                    }))
                  }
                  placeholder="2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Dung lượng lưu trữ tối đa
                </label>
                <Input
                  value={createForm.storageGb}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, storageGb: e.target.value }))
                  }
                  placeholder="500"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Số lượt gọi/tương tác AI mỗi tháng
                </label>
                <Input
                  value={createForm.aiQueriesPerMonth}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      aiQueriesPerMonth: e.target.value,
                    }))
                  }
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={createForm.subscriptionPlanStatus}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    subscriptionPlanStatus: e.target.value,
                  }))
                }
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={createSaving}
              >
                <option value="ACTIVE">Đang áp dụng</option>
                <option value="INACTIVE">Tạm dừng</option>
                <option value="DELETED">Đã xóa</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createSaving}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createSaving}>
              {createSaving ? "Đang lưu..." : "Tạo gói"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gói subscription</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên gói</label>
              <Input
                value={editForm.subscriptionPlanName}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    subscriptionPlanName: e.target.value,
                  }))
                }
                disabled={editSaving}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={editForm.subscriptionPlanDescription}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    subscriptionPlanDescription: e.target.value,
                  }))
                }
                disabled={editSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá / tháng</label>
                <Input
                  type="number"
                  value={editForm.priceMonthly}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, priceMonthly: e.target.value }))
                  }
                  disabled={editSaving}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá / năm</label>
                <Input
                  type="number"
                  value={editForm.priceYearly}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, priceYearly: e.target.value }))
                  }
                  disabled={editSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Số lượng “project” tối đa
                </label>
                <Input
                  value={editForm.maxProjects}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, maxProjects: e.target.value }))
                  }
                  placeholder="UNLIMITED"
                  disabled={editSaving}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Dung lượng lưu trữ tối đa
                </label>
                <Input
                  value={editForm.storageGb}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, storageGb: e.target.value }))
                  }
                  placeholder="500"
                  disabled={editSaving}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Số lượt gọi/tương tác AI mỗi tháng
                </label>
                <Input
                  value={editForm.aiQueriesPerMonth}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      aiQueriesPerMonth: e.target.value,
                    }))
                  }
                  placeholder="UNLIMITED"
                  disabled={editSaving}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={editForm.subscriptionPlanStatus}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    subscriptionPlanStatus: e.target.value,
                  }))
                }
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={editSaving}
              >
                <option value="ACTIVE">Đang áp dụng</option>
                <option value="INACTIVE">Tạm dừng</option>
                <option value="DELETED">Đã xóa</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSaving || !editPlanId}
            >
              {editSaving ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="px-5 py-3 border-b bg-gradient-to-r from-amber-50/70 via-background to-background">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">
                Chi tiết gói thành viên
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-5 py-3 max-h-[50vh] overflow-y-auto space-y-3">
            {viewLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-5 w-2/3 rounded-md bg-muted" />
                <div className="h-4 w-1/3 rounded-md bg-muted" />
                <div className="h-24 w-full rounded-xl bg-muted" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="h-16 rounded-xl bg-muted" />
                  <div className="h-16 rounded-xl bg-muted" />
                </div>
              </div>
            ) : viewError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {viewError}
              </div>
            ) : viewPlan ? (
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tên gói
                    </p>
                    <p className="text-lg font-semibold text-stone-900">
                      {viewPlan.subscriptionPlanName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={statusBadgeClass(
                        viewPlan.subscriptionPlanStatus,
                      )}
                    >
                      {statusLabel(viewPlan.subscriptionPlanStatus)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Mô tả
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-stone-800 leading-6">
                    {viewPlan.subscriptionPlanDescription || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border bg-gradient-to-br from-amber-50/70 via-card to-card p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Giá / tháng
                    </p>
                    <p className="mt-1.5 text-lg font-semibold text-amber-800">
                      {formatCurrency(viewPlan.priceMonthly)}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-gradient-to-br from-emerald-50/70 via-card to-card p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Giá / năm
                    </p>
                    <p className="mt-1.5 text-lg font-semibold text-emerald-700">
                      {formatCurrency(viewPlan.priceYearly)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Giới hạn
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
                    {Object.entries(viewPlan.configLimit ?? {}).length ? (
                      Object.entries(viewPlan.configLimit ?? {}).map(
                        ([k, v]) => (
                          <div key={k} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400 flex-none" />
                            <div className="leading-6">
                              <span className="font-medium text-stone-900">
                                {configKeyLabel(k)}
                              </span>
                              <span className="text-stone-600">: {v}</span>
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Thời gian
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
                    <div className="rounded-xl bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground">Tạo lúc</p>
                      <p className="font-medium text-stone-900">
                        {formatDateTime(viewPlan.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground">Cập nhật</p>
                      <p className="font-medium text-stone-900">
                        {formatDateTime(viewPlan.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </div>

          <DialogFooter className="px-5 py-3 border-t bg-muted/20">
            <Button variant="ghost" onClick={() => setViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
        itemName={deleteTarget?.subscriptionPlanName}
        title="Xác nhận xóa gói"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa "${deleteTarget.subscriptionPlanName}"? Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmLabel={deleteSaving ? "Đang xóa..." : "Xóa"}
      />
    </div>
  );
}
