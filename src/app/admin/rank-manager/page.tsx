"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

type RankStatus = "ACTIVE" | "INACTIVE" | "DELETED" | string;

type MembershipRank = {
  id: number;
  rankName: string;
  pointRate: number;
  requiredPoints: number;
  status: RankStatus;
  createdAt: string;
  updatedAt: string;
};

type MembershipRanksResponse = {
  code: number;
  status: string;
  message: string;
  data: MembershipRank[];
  meta?: {
    currentPage?: number;
    size?: number;
    lastPage?: number;
    totalElements?: number;
  };
};

type CreateRankForm = {
  rankName: string;
  pointRate: string;
  requiredPoints: string;
  status: string;
};

type RankFormErrors = Partial<Record<keyof CreateRankForm, string>>;

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const fetchMembershipRanks = async (
  page: number,
  size: number,
): Promise<MembershipRanksResponse> => {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await fetch(`/api/membership-ranks?${qs.toString()}`, {
    cache: "no-store",
    credentials: "include",
  });

  const payload = await parseJsonSafely<
    MembershipRanksResponse | { message?: string }
  >(res);

  if (!res.ok || !payload || Array.isArray(payload)) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Load ranks failed (${res.status})`);
  }

  const data = payload as MembershipRanksResponse;
  if (data.code !== 200) {
    throw new Error(data.message || "Load ranks failed");
  }

  return data;
};

const fetchMembershipRankById = async (id: number): Promise<MembershipRank> => {
  const res = await fetch(`/api/membership-ranks/${id}`, {
    cache: "no-store",
    credentials: "include",
  });

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
        data?: MembershipRank;
      }
    | { message?: string }
  >(res);

  if (!res.ok || !data || Array.isArray(data)) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Load failed (${res.status})`);
  }

  const envelope = data as Record<string, unknown>;
  const inner = envelope.data as MembershipRank | undefined;
  const code =
    typeof envelope.code === "number" ? envelope.code : res.status || 200;
  const ok = code >= 200 && code < 300;
  if (!ok || !inner) {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Load failed";
    throw new Error(message);
  }

  return inner;
};

const createMembershipRank = async (payload: CreateRankForm) => {
  const res = await fetch("/api/membership-ranks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      rankName: payload.rankName.trim(),
      pointRate: Number(payload.pointRate),
      requiredPoints: Number(payload.requiredPoints),
      status: payload.status.trim(),
    }),
  });

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
        data?: MembershipRank;
      }
    | { message?: string }
  >(res);

  if (!res.ok || !data || Array.isArray(data)) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Create failed (${res.status})`);
  }

  const envelope = data as Record<string, unknown>;
  const inner = envelope.data as MembershipRank | undefined;
  const code =
    typeof envelope.code === "number" ? envelope.code : res.status || 200;
  const ok = code >= 200 && code < 300;
  if (!ok || !inner) {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Create failed";
    throw new Error(message);
  }

  return inner;
};

const updateMembershipRank = async (id: number, payload: CreateRankForm) => {
  const res = await fetch(`/api/membership-ranks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      rankName: payload.rankName.trim(),
      pointRate: Number(payload.pointRate),
      requiredPoints: Number(payload.requiredPoints),
      status: payload.status.trim(),
    }),
  });

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
        data?: MembershipRank;
      }
    | { message?: string }
  >(res);

  if (!res.ok || !data || Array.isArray(data)) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Update failed (${res.status})`);
  }

  const envelope = data as Record<string, unknown>;
  const inner = envelope.data as MembershipRank | undefined;
  const code =
    typeof envelope.code === "number" ? envelope.code : res.status || 200;
  const ok = code >= 200 && code < 300;
  if (!ok || !inner) {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Update failed";
    throw new Error(message);
  }

  return inner;
};

const deleteMembershipRank = async (id: number) => {
  const res = await fetch(`/api/membership-ranks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (res.status === 204) return;

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
      }
    | { message?: string }
  >(res);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Delete failed (${res.status})`);
  }

  const envelope = data as Record<string, unknown> | null;
  const code =
    envelope && typeof envelope.code === "number"
      ? envelope.code
      : res.status || 200;
  const ok = code >= 200 && code < 300;
  if (!ok) {
    const message =
      envelope && typeof envelope.message === "string"
        ? envelope.message
        : "Delete failed";
    throw new Error(message);
  }
};

const normalizeStatus = (status?: string) =>
  String(status ?? "")
    .toUpperCase()
    .replace(/[^A-Z_]/g, "");

const statusLabel = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Tạm dừng";
    case "DELETED":
      return "Đã xóa";
    default:
      return status || "—";
  }
};

const statusBadgeClass = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
      return "text-sm font-medium text-muted-foreground";
    case "INACTIVE":
      return "text-sm font-medium text-muted-foreground";
    case "DELETED":
      return "text-sm font-medium text-muted-foreground";
    default:
      return "text-sm font-medium text-muted-foreground";
  }
};

const formatNumber = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

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

const validateCreateForm = (form: CreateRankForm): RankFormErrors => {
  const errors: RankFormErrors = {};

  const rankName = form.rankName.trim();
  const pointRate = Number(form.pointRate);
  const requiredPoints = Number(form.requiredPoints);
  const status = normalizeStatus(form.status);

  if (!rankName) errors.rankName = "Vui lòng nhập tên hạng";

  if (!form.pointRate.trim()) errors.pointRate = "Vui lòng nhập tỷ lệ điểm";
  else if (!Number.isFinite(pointRate) || pointRate <= 0) {
    errors.pointRate = "Tỷ lệ điểm phải > 0";
  }

  if (!form.requiredPoints.trim())
    errors.requiredPoints = "Vui lòng nhập điểm yêu cầu";
  else if (!Number.isFinite(requiredPoints) || requiredPoints < 0) {
    errors.requiredPoints = "Điểm yêu cầu phải ≥ 0";
  }

  if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "DELETED") {
    errors.status = "Trạng thái không hợp lệ";
  }

  return errors;
};

export default function AdminRankManagerPage() {
  const [ranks, setRanks] = useState<MembershipRank[]>([]);
  const [meta, setMeta] = useState<MembershipRanksResponse["meta"] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "DELETED"
  >("ALL");

  const [page, setPage] = useState(0);
  const [size] = useState(100);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRankForm>({
    rankName: "",
    pointRate: "",
    requiredPoints: "",
    status: "ACTIVE",
  });
  const [createErrors, setCreateErrors] = useState<RankFormErrors>({});

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewRank, setViewRank] = useState<MembershipRank | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CreateRankForm>({
    rankName: "",
    pointRate: "",
    requiredPoints: "",
    status: "ACTIVE",
  });
  const [editErrors, setEditErrors] = useState<RankFormErrors>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MembershipRank | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await fetchMembershipRanks(page, size);
        if (!mounted) return;
        setRanks(res.data ?? []);
        setMeta(res.meta ?? null);
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
  }, [page, size]);

  const filteredRanks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ranks.filter((r) => {
      const statusOk =
        statusFilter === "ALL" || normalizeStatus(r.status) === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        r.rankName.toLowerCase().includes(q) ||
        String(r.requiredPoints).includes(q)
      );
    });
  }, [ranks, searchQuery, statusFilter]);

  const totalElements = meta?.totalElements ?? ranks.length;
  const activeCount = ranks.filter(
    (r) => normalizeStatus(r.status) === "ACTIVE",
  ).length;
  const inactiveCount = ranks.filter(
    (r) => normalizeStatus(r.status) === "INACTIVE",
  ).length;
  const deletedCount = ranks.filter(
    (r) => normalizeStatus(r.status) === "DELETED",
  ).length;

  const canPrev = page > 0;
  const lastPage = meta?.lastPage;
  const canNext =
    typeof lastPage === "number" ? page + 1 < lastPage : ranks.length === size;

  const openCreate = () => {
    setCreateForm({
      rankName: "",
      pointRate: "",
      requiredPoints: "",
      status: "ACTIVE",
    });
    setCreateErrors({});
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (createSaving) return;
    const errors = validateCreateForm(createForm);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setCreateSaving(true);
    try {
      const created = await createMembershipRank(createForm);
      setRanks((prev) => [created, ...prev]);
      setMeta((prev) => {
        if (!prev) return prev;
        const total =
          typeof prev.totalElements === "number" ? prev.totalElements + 1 : 1;
        return { ...prev, totalElements: total };
      });
      toast.success(`Đã tạo hạng "${created.rankName}"`);
      setCreateDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
    }
  };

  const openView = async (id: number) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewRank(null);
    try {
      const data = await fetchMembershipRankById(id);
      setViewRank(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load failed";
      setViewError(msg);
      toast.error(msg);
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (rank: MembershipRank) => {
    setEditId(rank.id);
    setEditForm({
      rankName: rank.rankName ?? "",
      pointRate: String(rank.pointRate ?? ""),
      requiredPoints: String(rank.requiredPoints ?? ""),
      status: normalizeStatus(rank.status) || "ACTIVE",
    });
    setEditErrors({});
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (editSaving || editId == null) return;
    const errors = validateCreateForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setEditSaving(true);
    try {
      const updated = await updateMembershipRank(editId, editForm);
      setRanks((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Đã cập nhật hạng "${updated.rankName}"`);
      setEditDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = (rank: MembershipRank) => {
    setDeleteTarget(rank);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteSaving) return;
    setDeleteSaving(true);
    try {
      await deleteMembershipRank(deleteTarget.id);
      setRanks((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success(`Đã xóa hạng "${deleteTarget.rankName}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteSaving(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Hạng thành viên
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách hạng thành viên trong hệ thống
          </p>
        </div>
        <Button
          type="button"
          className="bg-primary hover:bg-primary/90"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm hạng thành viên
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalElements}</p>
              <p className="text-sm text-muted-foreground">Tổng hạng</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveCount}</p>
              <p className="text-sm text-muted-foreground">Tạm dừng</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{deletedCount}</p>
              <p className="text-sm text-muted-foreground">Đã xóa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hạng, điểm yêu cầu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "ALL" | "ACTIVE" | "INACTIVE" | "DELETED",
                  )
                }
                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">{statusLabel("ACTIVE")}</option>
                <option value="INACTIVE">{statusLabel("INACTIVE")}</option>
                <option value="DELETED">{statusLabel("DELETED")}</option>
              </select>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              className="px-3 py-2 rounded-md border bg-white disabled:opacity-50"
              onClick={() => canPrev && setPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev || isLoading}
            >
              Trước
            </button>
            <span className="px-2">
              Trang{" "}
              {typeof meta?.currentPage === "number"
                ? meta.currentPage
                : page + 1}
              {typeof meta?.lastPage === "number" ? ` / ${meta.lastPage}` : ""}
            </span>
            <button
              type="button"
              className="px-3 py-2 rounded-md border bg-white disabled:opacity-50"
              onClick={() => canNext && setPage((p) => p + 1)}
              disabled={!canNext || isLoading}
            >
              Sau
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Hạng</TableHead>
                <TableHead className="font-semibold text-right">
                  Tỷ lệ điểm
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Điểm yêu cầu
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
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Đang tải hạng...
                  </TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-destructive"
                  >
                    {loadError}
                  </TableCell>
                </TableRow>
              ) : filteredRanks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Không tìm thấy hạng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredRanks.map((rank) => (
                  <TableRow key={rank.id} className="admin-table-row">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{rank.rankName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-800">
                      {rank.pointRate}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {formatNumber(rank.requiredPoints)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={statusBadgeClass(rank.status)}>
                        {statusLabel(rank.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(rank.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void openView(rank.id)}
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(rank)}
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(rank)}
                          aria-label="Xóa"
                          disabled={deleteSaving}
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm hạng thành viên</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên hạng</label>
              <Input
                value={createForm.rankName}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, rankName: e.target.value }))
                }
                placeholder="VD: GOLD"
                aria-invalid={Boolean(createErrors.rankName)}
                disabled={createSaving}
              />
              {createErrors.rankName ? (
                <p className="text-xs text-destructive">
                  {createErrors.rankName}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tỷ lệ điểm</label>
                <Input
                  type="number"
                  step="0.1"
                  value={createForm.pointRate}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, pointRate: e.target.value }))
                  }
                  placeholder="VD: 1.5"
                  aria-invalid={Boolean(createErrors.pointRate)}
                  disabled={createSaving}
                />
                {createErrors.pointRate ? (
                  <p className="text-xs text-destructive">
                    {createErrors.pointRate}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Điểm yêu cầu</label>
                <Input
                  type="number"
                  step="1"
                  value={createForm.requiredPoints}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      requiredPoints: e.target.value,
                    }))
                  }
                  placeholder="VD: 1500"
                  aria-invalid={Boolean(createErrors.requiredPoints)}
                  disabled={createSaving}
                />
                {createErrors.requiredPoints ? (
                  <p className="text-xs text-destructive">
                    {createErrors.requiredPoints}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, status: e.target.value }))
                }
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={createSaving}
              >
                <option value="ACTIVE">{statusLabel("ACTIVE")}</option>
                <option value="INACTIVE">{statusLabel("INACTIVE")}</option>
                <option value="DELETED">{statusLabel("DELETED")}</option>
              </select>
              {createErrors.status ? (
                <p className="text-xs text-destructive">
                  {createErrors.status}
                </p>
              ) : null}
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
              {createSaving ? "Đang lưu..." : "Tạo hạng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (editSaving) return;
          setEditDialogOpen(open);
          if (!open) {
            setEditId(null);
            setEditErrors({});
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hạng thành viên</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên hạng</label>
              <Input
                value={editForm.rankName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, rankName: e.target.value }))
                }
                placeholder="VD: GOLD"
                aria-invalid={Boolean(editErrors.rankName)}
                disabled={editSaving}
              />
              {editErrors.rankName ? (
                <p className="text-xs text-destructive">
                  {editErrors.rankName}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tỷ lệ điểm</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.pointRate}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, pointRate: e.target.value }))
                  }
                  placeholder="VD: 1.5"
                  aria-invalid={Boolean(editErrors.pointRate)}
                  disabled={editSaving}
                />
                {editErrors.pointRate ? (
                  <p className="text-xs text-destructive">
                    {editErrors.pointRate}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Điểm yêu cầu</label>
                <Input
                  type="number"
                  step="1"
                  value={editForm.requiredPoints}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      requiredPoints: e.target.value,
                    }))
                  }
                  placeholder="VD: 1500"
                  aria-invalid={Boolean(editErrors.requiredPoints)}
                  disabled={editSaving}
                />
                {editErrors.requiredPoints ? (
                  <p className="text-xs text-destructive">
                    {editErrors.requiredPoints}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, status: e.target.value }))
                }
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={editSaving}
              >
                <option value="ACTIVE">{statusLabel("ACTIVE")}</option>
                <option value="INACTIVE">{statusLabel("INACTIVE")}</option>
                <option value="DELETED">{statusLabel("DELETED")}</option>
              </select>
              {editErrors.status ? (
                <p className="text-xs text-destructive">{editErrors.status}</p>
              ) : null}
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
            <Button onClick={handleEditSubmit} disabled={editSaving}>
              {editSaving ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            setViewLoading(false);
            setViewError(null);
            setViewRank(null);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onEscapeKeyDown={(e) => {
            if (viewLoading) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (viewLoading) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Chi tiết hạng thành viên</DialogTitle>
            <DialogDescription>Thông tin hạng thành viên.</DialogDescription>
          </DialogHeader>

          {viewError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {viewError}
            </div>
          ) : null}

          {viewLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 ">
              <Label htmlFor="rankName">Tên hạng</Label>
              <Input
                id="rankName"
                className="w-full bg-muted"
                value={viewRank?.rankName ?? ""}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointRate">Tỷ lệ điểm</Label>
              <Input
                id="pointRate"
                className="w-full bg-muted"
                value={viewRank ? String(viewRank.pointRate) : ""}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredPoints">Điểm yêu cầu</Label>
              <Input
                id="requiredPoints"
                className="w-full bg-muted"
                value={viewRank ? formatNumber(viewRank.requiredPoints) : ""}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Input
                id="status"
                className="w-full bg-muted"
                value={viewRank ? statusLabel(viewRank.status) : ""}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdAt">Tạo lúc</Label>
              <Input
                id="createdAt"
                className="w-full bg-muted"
                value={viewRank ? formatDateTime(viewRank.createdAt) : ""}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="updatedAt">Cập nhật</Label>
              <Input
                id="updatedAt"
                className="w-full bg-muted"
                value={viewRank ? formatDateTime(viewRank.updatedAt) : ""}
                readOnly
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              disabled={viewLoading}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (deleteSaving) return;
          setDeleteDialogOpen(open);
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.rankName ?? ""}
        title="Xác nhận xóa hạng"
        confirmLabel={deleteSaving ? "Đang xóa..." : "Xóa hạng"}
      />
    </div>
  );
}
