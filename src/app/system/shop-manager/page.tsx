"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Store, Trash2 } from "lucide-react";
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
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

type ShopStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "BANNED"
  | "DELETED"
  | string;

type Shop = {
  id: number;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  domain: string;
  status: ShopStatus;
  createdAt: string;
  updatedAt: string;
};

type ShopsResponse = {
  code: number;
  status: string;
  message: string;
  data: Shop[];
  meta?: {
    currentPage?: number;
    size?: number;
    lastPage?: number;
    totalElements?: number;
  };
};

type CreateShopForm = {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  domain: string;
  status: string;
};

type ShopFormErrors = Partial<Record<keyof CreateShopForm, string | undefined>>;

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const fetchShops = async (
  page: number,
  size: number,
): Promise<ShopsResponse> => {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await fetch(`/api/shops?${qs.toString()}`, {
    cache: "no-store",
    credentials: "include",
  });

  const payload = await parseJsonSafely<ShopsResponse | { message?: string }>(
    res,
  );

  if (!res.ok || !payload || Array.isArray(payload)) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as Record<string, unknown>).message ?? "")
        : "";
    throw new Error(message || `Load shops failed (${res.status})`);
  }

  const data = payload as ShopsResponse;
  if (data.code !== 200) {
    throw new Error(data.message || "Load shops failed");
  }
  return data;
};

const fetchShopById = async (id: number): Promise<Shop> => {
  const res = await fetch(`/api/shops/${id}`, {
    cache: "no-store",
    credentials: "include",
  });

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
        data?: Shop;
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
  const inner = envelope.data as Shop | undefined;
  const code = typeof envelope.code === "number" ? envelope.code : 200;
  if (code !== 200 || !inner) {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Load failed";
    throw new Error(message);
  }

  return inner;
};

const createShop = async (payload: CreateShopForm): Promise<Shop> => {
  const res = await fetch("/api/shops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      shopName: payload.shopName.trim(),
      address: payload.address.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      domain: payload.domain.trim(),
      status: payload.status.trim(),
    }),
  });

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
        data?: Shop;
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
  const inner = envelope.data as Shop | undefined;
  const code = typeof envelope.code === "number" ? envelope.code : 200;
  if (code !== 200 || !inner) {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Create failed";
    throw new Error(message);
  }

  return inner;
};

const updateShopById = async (id: number, payload: CreateShopForm) => {
  const res = await fetch(`/api/shops/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      shopName: payload.shopName.trim(),
      address: payload.address.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      domain: payload.domain.trim(),
      status: payload.status.trim(),
    }),
  });

  const data = await parseJsonSafely<
    | {
        code?: number;
        status?: string;
        message?: string;
        data?: Shop;
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
  const inner = envelope.data as Shop | undefined;
  const code = typeof envelope.code === "number" ? envelope.code : 200;
  if (code !== 200 || !inner) {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Update failed";
    throw new Error(message);
  }

  return inner;
};

const deleteShopById = async (id: number): Promise<void> => {
  const res = await fetch(`/api/shops/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await parseJsonSafely<{ message?: string }>(res);
  if (!res.ok) {
    throw new Error(data?.message || `Delete failed (${res.status})`);
  }
};

const normalizeStatus = (status?: string) =>
  String(status ?? "")
    .toUpperCase()
    .replace(/[^A-Z_]/g, "");

const statusLabel = (status?: string) => {
  switch (normalizeStatus(status)) {
    case "PENDING":
      return "Chờ duyệt";
    case "BANNED":
      return "Bị khóa";
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
    case "PENDING":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-sky-100 text-sky-800 ring-1 ring-sky-200";
    case "BANNED":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-800 ring-1 ring-orange-200";
    case "ACTIVE":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    case "INACTIVE":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "DELETED":
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-200";
    default:
      return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const domainRegex =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

const validateShopForm = (form: CreateShopForm): ShopFormErrors => {
  const errors: ShopFormErrors = {};

  const shopName = form.shopName.trim();
  const address = form.address.trim();
  const phoneRaw = form.phone.trim();
  const phone = phoneRaw.replace(/[^\d+]/g, "");
  const email = form.email.trim();
  const domain = form.domain.trim();
  const status = normalizeStatus(form.status);

  if (!shopName) errors.shopName = "Vui lòng nhập tên cửa hàng";
  else if (shopName.length < 2) errors.shopName = "Tên cửa hàng quá ngắn";

  if (!address) errors.address = "Vui lòng nhập địa chỉ";
  else if (address.length < 5) errors.address = "Địa chỉ quá ngắn";

  if (!phoneRaw) errors.phone = "Vui lòng nhập số điện thoại";
  else if (!/^(\+?84|0)\d{8,10}$/.test(phone)) {
    errors.phone =
      "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)";
  }

  if (!email) errors.email = "Vui lòng nhập email";
  else if (!emailRegex.test(email)) errors.email = "Email không hợp lệ";

  if (!domain) errors.domain = "Vui lòng nhập domain";
  else if (!domainRegex.test(domain)) {
    errors.domain = "Domain không hợp lệ (VD: beautyone.vn)";
  }

  if (
    status !== "ACTIVE" &&
    status !== "INACTIVE" &&
    status !== "PENDING" &&
    status !== "BANNED" &&
    status !== "DELETED"
  ) {
    errors.status = "Trạng thái không hợp lệ";
  }

  return errors;
};

export default function SystemShopManagerPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [meta, setMeta] = useState<ShopsResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateShopForm>({
    shopName: "",
    address: "",
    phone: "",
    email: "",
    domain: "",
    status: "ACTIVE",
  });
  const [createErrors, setCreateErrors] = useState<ShopFormErrors>({});

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editShopId, setEditShopId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CreateShopForm>({
    shopName: "",
    address: "",
    phone: "",
    email: "",
    domain: "",
    status: "ACTIVE",
  });

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewShop, setViewShop] = useState<Shop | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Shop | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await fetchShops(page, size);
        if (!mounted) return;
        setShops(res.data ?? []);
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

  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) => {
      return (
        String(s.id).includes(q) ||
        s.shopName.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    });
  }, [shops, searchQuery]);

  const activeCount = shops.filter(
    (s) => normalizeStatus(s.status) === "ACTIVE",
  ).length;
  const deletedCount = shops.filter(
    (s) => normalizeStatus(s.status) === "DELETED",
  ).length;
  const totalElements = meta?.totalElements ?? shops.length;

  const canPrev = page > 0;
  const lastPage = meta?.lastPage;
  const canNext =
    typeof lastPage === "number" ? page + 1 < lastPage : shops.length === size;

  const openCreate = () => {
    setCreateForm({
      shopName: "",
      address: "",
      phone: "",
      email: "",
      domain: "",
      status: "ACTIVE",
    });
    setCreateErrors({});
    setCreateDialogOpen(true);
  };

  const openEdit = (shop: Shop) => {
    setEditShopId(shop.id);
    setEditForm({
      shopName: shop.shopName ?? "",
      address: shop.address ?? "",
      phone: shop.phone ?? "",
      email: shop.email ?? "",
      domain: shop.domain ?? "",
      status: normalizeStatus(shop.status) || "ACTIVE",
    });
    setEditDialogOpen(true);
  };

  const openView = async (id: number) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewShop(null);
    try {
      const data = await fetchShopById(id);
      setViewShop(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load failed";
      setViewError(msg);
      toast.error(msg);
    } finally {
      setViewLoading(false);
    }
  };

  const openDelete = (shop: Shop) => {
    setDeleteTarget(shop);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (editSaving) return;
    if (!editShopId) return;

    if (!editForm.shopName.trim()) {
      toast.error("Vui lòng nhập tên cửa hàng");
      return;
    }
    if (!editForm.address.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return;
    }
    if (!editForm.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!editForm.email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (!editForm.domain.trim()) {
      toast.error("Vui lòng nhập domain");
      return;
    }

    const status = normalizeStatus(editForm.status);
    if (
      status !== "ACTIVE" &&
      status !== "INACTIVE" &&
      status !== "PENDING" &&
      status !== "BANNED" &&
      status !== "DELETED"
    ) {
      toast.error("Trạng thái không hợp lệ");
      return;
    }

    setEditSaving(true);
    try {
      const updated = await updateShopById(editShopId, {
        ...editForm,
        status,
      });

      setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setViewShop((prev) => (prev?.id === updated.id ? updated : prev));

      toast.success(`Đã cập nhật cửa hàng "${updated.shopName}"`);
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

    const errors = validateShopForm(createForm);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    const status = normalizeStatus(createForm.status);

    setCreateSaving(true);
    try {
      const created = await createShop({ ...createForm, status });

      setShops((prev) => [created, ...prev]);
      setMeta((prev) => {
        if (!prev) return prev;
        const total =
          typeof prev.totalElements === "number" ? prev.totalElements + 1 : 1;
        return { ...prev, totalElements: total };
      });

      toast.success(`Đã tạo cửa hàng "${created.shopName}"`);
      setCreateDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteSaving) return;
    setDeleteSaving(true);
    try {
      await deleteShopById(deleteTarget.id);
      setShops((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setMeta((prev) => {
        if (!prev) return prev;
        const total =
          typeof prev.totalElements === "number"
            ? Math.max(0, prev.totalElements - 1)
            : prev.totalElements;
        return { ...prev, totalElements: total };
      });
      setViewShop((prev) => (prev?.id === deleteTarget.id ? null : prev));
      toast.success(`Đã xóa cửa hàng "${deleteTarget.shopName}"`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cửa hàng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách cửa hàng trong hệ thống
          </p>
        </div>

        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Thêm cửa hàng
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalElements}</p>
              <p className="text-sm text-muted-foreground">Tổng cửa hàng</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Store className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Store className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{deletedCount}</p>
              <p className="text-sm text-muted-foreground">
                Tổng cửa hàng đã xóa
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, domain, email, SĐT..."
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
                <TableHead className="font-semibold">Cửa hàng</TableHead>
                <TableHead className="font-semibold">Địa chỉ</TableHead>
                <TableHead className="font-semibold">Liên hệ</TableHead>
                <TableHead className="font-semibold">Domain</TableHead>
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
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Đang tải cửa hàng...
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
              ) : filteredShops.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Không tìm thấy cửa hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredShops.map((shop) => (
                  <TableRow key={shop.id} className="admin-table-row">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{shop.shopName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal max-w-[420px]">
                      {shop.address || "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal max-w-[320px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground">
                          {shop.phone || "—"}
                        </span>
                        <span className="text-muted-foreground">
                          {shop.email || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shop.domain || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={statusBadgeClass(shop.status)}>
                        {statusLabel(shop.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(shop.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void openView(shop.id)}
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(shop)}
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDelete(shop)}
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

        <div className="p-4 border-t border-border flex justify-end">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm cửa hàng</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên cửa hàng</label>
              <Input
                value={createForm.shopName}
                onChange={(e) => {
                  const value = e.target.value;
                  setCreateForm((p) => ({ ...p, shopName: value }));
                  setCreateErrors((prev) => ({ ...prev, shopName: undefined }));
                }}
                placeholder="VD: Beauty One Shop"
                aria-invalid={Boolean(createErrors.shopName)}
                disabled={createSaving}
              />
              {createErrors.shopName ? (
                <p className="text-xs text-destructive">
                  {createErrors.shopName}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Địa chỉ</label>
              <Input
                value={createForm.address}
                onChange={(e) => {
                  const value = e.target.value;
                  setCreateForm((p) => ({ ...p, address: value }));
                  setCreateErrors((prev) => ({ ...prev, address: undefined }));
                }}
                placeholder="VD: 123 Nguyễn Trãi, Quận 1, TP.HCM"
                aria-invalid={Boolean(createErrors.address)}
                disabled={createSaving}
              />
              {createErrors.address ? (
                <p className="text-xs text-destructive">
                  {createErrors.address}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCreateForm((p) => ({ ...p, phone: value }));
                    setCreateErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="VD: 0912345678 hoặc +84912345678"
                  aria-invalid={Boolean(createErrors.phone)}
                  disabled={createSaving}
                />
                {createErrors.phone ? (
                  <p className="text-xs text-destructive">
                    {createErrors.phone}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCreateForm((p) => ({ ...p, email: value }));
                    setCreateErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="VD: hello@beautyone.vn"
                  aria-invalid={Boolean(createErrors.email)}
                  disabled={createSaving}
                />
                {createErrors.email ? (
                  <p className="text-xs text-destructive">
                    {createErrors.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Domain</label>
                <Input
                  value={createForm.domain}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCreateForm((p) => ({ ...p, domain: value }));
                    setCreateErrors((prev) => ({ ...prev, domain: undefined }));
                  }}
                  placeholder="VD: beautyone.vn"
                  aria-invalid={Boolean(createErrors.domain)}
                  disabled={createSaving}
                />
                {createErrors.domain ? (
                  <p className="text-xs text-destructive">
                    {createErrors.domain}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  value={createForm.status}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCreateForm((p) => ({ ...p, status: value }));
                    setCreateErrors((prev) => ({ ...prev, status: undefined }));
                  }}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  disabled={createSaving}
                >
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="BANNED">Bị khóa</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm dừng</option>
                  <option value="DELETED">Đã xóa</option>
                </select>
                {createErrors.status ? (
                  <p className="text-xs text-destructive">
                    {createErrors.status}
                  </p>
                ) : null}
              </div>
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
              {createSaving ? "Đang lưu..." : "Tạo cửa hàng"}
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
            setEditShopId(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa cửa hàng</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên cửa hàng</label>
              <Input
                value={editForm.shopName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, shopName: e.target.value }))
                }
                disabled={editSaving}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Địa chỉ</label>
              <Input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, address: e.target.value }))
                }
                disabled={editSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  disabled={editSaving}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  disabled={editSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Domain</label>
                <Input
                  value={editForm.domain}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, domain: e.target.value }))
                  }
                  disabled={editSaving}
                />
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
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="BANNED">Bị khóa</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm dừng</option>
                  <option value="DELETED">Đã xóa</option>
                </select>
              </div>
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
              disabled={editSaving || !editShopId}
            >
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
            setViewShop(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="px-5 py-3 border-b bg-gradient-to-r from-amber-50/70 via-background to-background">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">Chi tiết cửa hàng</DialogTitle>
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
            ) : viewShop ? (
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cửa hàng
                    </p>
                    <p className="text-lg font-semibold text-stone-900">
                      {viewShop.shopName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={statusBadgeClass(viewShop.status)}>
                      {statusLabel(viewShop.status)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Địa chỉ
                  </p>
                  <p className="mt-1.5 text-sm text-stone-800 leading-6">
                    {viewShop.address || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border bg-gradient-to-br from-amber-50/70 via-card to-card p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Số điện thoại
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-amber-800">
                      {viewShop.phone || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-gradient-to-br from-emerald-50/70 via-card to-card p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-emerald-700 break-all">
                      {viewShop.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Domain
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-stone-900 break-all">
                    {viewShop.domain || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Thời gian
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
                    <div className="rounded-xl bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground">Tạo lúc</p>
                      <p className="font-medium text-stone-900">
                        {formatDateTime(viewShop.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground">Cập nhật</p>
                      <p className="font-medium text-stone-900">
                        {formatDateTime(viewShop.updatedAt)}
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
          if (!open) {
            setDeleteTarget(null);
            setDeleteSaving(false);
          }
        }}
        onConfirm={() => void handleDeleteConfirm()}
        itemName={deleteTarget?.shopName}
        title="Xác nhận xóa cửa hàng"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa "${deleteTarget.shopName}"? Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmLabel={deleteSaving ? "Đang xóa..." : "Xóa"}
      />
    </div>
  );
}
