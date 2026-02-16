"use client";
import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Promotion } from "@/types/promotion";
import { uploadPromotionImage } from "@/services/promotion.service";

type PromotionStatus = "active" | "inactive" | "expired" | "deleted";

type PromotionRow = {
  id: string;
  name: string;
  code: string;
  type: Promotion["promotionType"];
  discountType: Promotion["discountType"];
  discountValue: number;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
};

type PromotionFormState = {
  promotionName: string;
  promotionCode: string;
  promotionType: Promotion["promotionType"];
  minimumSpent: string;
  quantity: string;
  discountType: Promotion["discountType"];
  discountValue: string;
  maxDiscountAmount: string;
  usageLimitPerUser: string;
  startDate: string;
  endDate: string;
  promotionStatus: Promotion["promotionStatus"];
  imageUrl: string;
  shopId: string;
};

const mapStatus = (status?: string): PromotionStatus => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "INACTIVE":
      return "inactive";
    case "EXPIRED":
      return "expired";
    case "DELETED":
      return "deleted";
    default:
      return "inactive";
  }
};

const formatNumber = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const formatDateOnly = (input?: string) => {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

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

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const fetchPromotions = async (): Promise<Promotion[]> => {
  const res = await fetch("/api/promotion", { cache: "no-store" });
  const data = await parseJsonSafely<Promotion[]>(res);
  if (!res.ok || !data) {
    throw new Error("Load promotions failed");
  }
  return data;
};

const fetchPromotionById = async (id: string): Promise<Promotion> => {
  const res = await fetch(`/api/promotion/${id}`, { cache: "no-store" });
  const data = await parseJsonSafely<Promotion>(res);
  if (!res.ok || !data) {
    throw new Error("Load promotion failed");
  }
  return data;
};

const updatePromotion = async (
  id: string,
  payload: Record<string, unknown>,
): Promise<Promotion> => {
  const res = await fetch(`/api/promotion/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafely<Promotion>(res);
  if (!res.ok || !data) {
    throw new Error("Update promotion failed");
  }
  return data;
};

const deletePromotion = async (id: string): Promise<void> => {
  const res = await fetch(`/api/promotion/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await parseJsonSafely<{ message?: string }>(res);
    throw new Error(data?.message || "Delete promotion failed");
  }
};

const toLocalDateTimeInput = (input?: string) => {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoOrUndefined = (input: string) => {
  if (!input) return undefined;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toISOString();
};

const typeLabel = (type?: string) => {
  if (type === "ORDER") return "Đơn hàng";
  if (type === "PRODUCT") return "Sản phẩm";
  return "Khác";
};

const statusLabel = (status: PromotionStatus) => {
  switch (status) {
    case "active":
      return "Đang áp dụng";
    case "inactive":
      return "Tạm ngưng";
    case "expired":
      return "Hết hạn";
    default:
      return "Đã xóa";
  }
};

const statusBadgeClass = (status: PromotionStatus) => {
  switch (status) {
    case "active":
      return "admin-badge admin-badge-active";
    case "inactive":
      return "admin-badge admin-badge-inactive";
    case "expired":
      return "admin-badge bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "admin-badge bg-slate-100 text-slate-600 border-slate-200";
  }
};

const mapPromotion = (p: Promotion): PromotionRow => {
  const rawStatus = p.status ?? p.promotionStatus;
  return {
    id: String(p.promotionId),
    name: p.promotionName || p.promotionCode || `#${p.promotionId}`,
    code: p.promotionCode ?? "",
    type: p.promotionType,
    discountType: p.discountType ?? "PERCENTAGE",
    discountValue: p.discountValue ?? 0,
    imageUrl: p.imageUrl ?? "",
    startDate: p.startDate,
    endDate: p.endDate,
    status: mapStatus(rawStatus),
  };
};

const formatMoney = (n: number) => `${formatNumber(n)} đ`;

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    value * 100,
  )}%`;

const formatDiscountValue = (
  type: Promotion["discountType"],
  value: number,
) => {
  if (type === "PERCENTAGE") return formatPercent(value);
  return formatMoney(value);
};

const createFormState = (promotion: Promotion): PromotionFormState => ({
  promotionName: promotion.promotionName ?? "",
  promotionCode: promotion.promotionCode ?? "",
  promotionType: promotion.promotionType ?? "ORDER",
  minimumSpent: String(promotion.minimumSpent ?? 0),
  quantity: String(promotion.quantity ?? 0),
  discountType: promotion.discountType ?? "PERCENTAGE",
  discountValue: String(promotion.discountValue ?? 0),
  maxDiscountAmount: String(promotion.maxDiscountAmount ?? 0),
  usageLimitPerUser: String(promotion.usageLimitPerUser ?? 0),
  startDate: toLocalDateTimeInput(promotion.startDate),
  endDate: toLocalDateTimeInput(promotion.endDate),
  promotionStatus: promotion.promotionStatus ?? "INACTIVE",
  imageUrl: promotion.imageUrl ?? "",
  shopId: String(promotion.shopId ?? 1),
});

export default function PromotionsManagerPage() {
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewPromotion, setViewPromotion] = useState<Promotion | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PromotionFormState | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImageUploading, setCreateImageUploading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<PromotionFormState | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionRow | null>(null);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchPromotions();

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu promotions không đúng định dạng");
        }

        const items = data
          .filter((p) => mapStatus(p.status ?? p.promotionStatus) !== "deleted")
          .map(mapPromotion);

        setPromotions(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load promotions failed";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const filteredPromotions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return promotions;
    return promotions.filter((promo) => {
      return (
        promo.name.toLowerCase().includes(q) ||
        promo.code.toLowerCase().includes(q)
      );
    });
  }, [promotions, searchQuery]);

  const handleView = async (promotion: PromotionRow) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewPromotion(null);
    try {
      const data = await fetchPromotionById(promotion.id);
      setViewPromotion(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load promotion failed";
      toast.error(msg);
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEdit = async (promotion: PromotionRow) => {
    setSelectedPromotion(promotion);
    setEditDialogOpen(true);
    setEditLoading(true);
    setEditForm(null);
    setEditImageFile(null);
    try {
      const data = await fetchPromotionById(promotion.id);
      setEditForm(createFormState(data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load promotion failed";
      toast.error(msg);
      setEditDialogOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (promotion: PromotionRow) => {
    setSelectedPromotion(promotion);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPromotion) return;

    try {
      await deletePromotion(selectedPromotion.id);

      setPromotions((prev) =>
        prev.filter((p) => p.id !== selectedPromotion.id),
      );
      toast.success(`Đã xóa khuyến mãi "${selectedPromotion.name}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete promotion failed";
      toast.error(msg);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPromotion(null);
    }
  };
  const handleCreate = () => {
    setCreateForm(
      createFormState({
        promotionId: 0,
        promotionCode: "",
        promotionName: "",
        promotionType: "ORDER",
        minimumSpent: 0,
        quantity: 0,
        discountType: "PERCENTAGE",
        discountValue: 0,
        maxDiscountAmount: 0,
        usageLimitPerUser: 0,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        promotionStatus: "INACTIVE",
        imageUrl: "",
        shopId: 1,
        createdDate: "",
        updatedDate: "",
      } as Promotion),
    );
    setCreateImageFile(null);
    setCreateDialogOpen(true);
  };

  const createPromotion = async (
    payload: Record<string, unknown>,
  ): Promise<Promotion> => {
    const res = await fetch("/api/promotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonSafely<Promotion>(res);
    if (!res.ok || !data) {
      throw new Error("Create promotion failed");
    }
    return data;
  };

  const handleCreateSubmit = async () => {
    if (!createForm) return;
    setCreateSaving(true);
    try {
      const payload = {
        promotionName: createForm.promotionName.trim(),
        promotionCode: createForm.promotionCode.trim(),
        promotionType: createForm.promotionType,
        shopId: Number(createForm.shopId) || 1,
        minimumSpent: Number(createForm.minimumSpent) || 0,
        quantity: Number(createForm.quantity) || 0,
        discountType: createForm.discountType,
        discountValue: Number(createForm.discountValue) || 0,
        maxDiscountAmount: Number(createForm.maxDiscountAmount) || 0,
        usageLimitPerUser: Number(createForm.usageLimitPerUser) || 0,
        startDate: toIsoOrUndefined(createForm.startDate),
        endDate: toIsoOrUndefined(createForm.endDate),
        promotionStatus: createForm.promotionStatus,
        imageUrl: createForm.imageUrl.trim() || undefined,
      };

      const created = await createPromotion(payload);
      let finalCreated = created;

      if (createImageFile) {
        setCreateImageUploading(true);
        try {
          const uploadRes = await uploadPromotionImage(
            created.promotionId,
            createImageFile,
          );
          const imageUrl =
            uploadRes &&
            typeof uploadRes === "object" &&
            "imageUrl" in uploadRes
              ? uploadRes.imageUrl
              : (uploadRes as Promotion | null)?.imageUrl;
          if (imageUrl) {
            finalCreated = { ...created, imageUrl };
          }
        } finally {
          setCreateImageUploading(false);
        }
      }

      const newRow = mapPromotion(finalCreated);
      setPromotions((prev) => [newRow, ...prev]);
      toast.success(`Đã tạo khuyến mãi "${newRow.name}"`);
      setCreateDialogOpen(false);
      setCreateForm(null);
      setCreateImageFile(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create promotion failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
    }
  };
  const handleUpdate = async () => {
    if (!selectedPromotion || !editForm) return;
    setEditSaving(true);
    try {
      let uploadedImageUrl = editForm.imageUrl.trim() || undefined;
      if (editImageFile) {
        setEditImageUploading(true);
        try {
          const uploadRes = await uploadPromotionImage(
            selectedPromotion.id,
            editImageFile,
          );
          const imageUrl =
            uploadRes &&
            typeof uploadRes === "object" &&
            "imageUrl" in uploadRes
              ? uploadRes.imageUrl
              : (uploadRes as Promotion | null)?.imageUrl;
          if (imageUrl) {
            uploadedImageUrl = imageUrl;
            setEditForm((prev) => (prev ? { ...prev, imageUrl } : prev));
          }
          setEditImageFile(null);
        } finally {
          setEditImageUploading(false);
        }
      }

      const payload = {
        promotionName: editForm.promotionName.trim(),
        promotionCode: editForm.promotionCode.trim(),
        promotionType: editForm.promotionType,
        minimumSpent: Number(editForm.minimumSpent) || 0,
        quantity: Number(editForm.quantity) || 0,
        discountType: editForm.discountType,
        discountValue: Number(editForm.discountValue) || 0,
        maxDiscountAmount: Number(editForm.maxDiscountAmount) || 0,
        usageLimitPerUser: Number(editForm.usageLimitPerUser) || 0,
        startDate: toIsoOrUndefined(editForm.startDate),
        endDate: toIsoOrUndefined(editForm.endDate),
        promotionStatus: editForm.promotionStatus,
        imageUrl: uploadedImageUrl,
      };

      const data = await updatePromotion(selectedPromotion.id, payload);

      const updatedRow = mapPromotion(data);
      setPromotions((prev) =>
        prev.map((p) => (p.id === updatedRow.id ? updatedRow : p)),
      );
      toast.success(`Đã cập nhật khuyến mãi "${updatedRow.name}"`);
      setEditDialogOpen(false);
      setSelectedPromotion(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update promotion failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const activeCount = promotions.filter((p) => p.status === "active").length;
  const inactiveCount = promotions.filter(
    (p) => p.status === "inactive",
  ).length;
  const expiredCount = promotions.filter((p) => p.status === "expired").length;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Khuyến mãi</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các chương trình khuyến mãi của quán
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm danh mục
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promotions.length}</p>
                <p className="text-sm text-muted-foreground">Tổng khuyến mãi</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4 ">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Tag className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Đang áp dụng</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4 ">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Tag className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveCount}</p>
                <p className="text-sm text-muted-foreground">Tạm ngưng</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Tag className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-sm text-muted-foreground">Hết hạn</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã..."
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
                  <TableHead className="font-semibold">
                    Tên khuyến mãi
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Ảnh
                  </TableHead>
                  <TableHead className="font-semibold">Mã</TableHead>
                  <TableHead className="font-semibold text-center">
                    Loại Áp dụng
                  </TableHead>

                  <TableHead className="font-semibold text-center">
                    Giá trị giảm
                  </TableHead>
                  <TableHead className="font-semibold">Ngày bắt đầu</TableHead>
                  <TableHead className="font-semibold">Ngày kết thúc</TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải khuyến mãi...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-destructive"
                    >
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filteredPromotions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy khuyến mãi nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id} className="admin-table-row">
                      <TableCell className="font-medium">
                        {promotion.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {promotion.imageUrl ? (
                          <img
                            src={promotion.imageUrl}
                            alt={promotion.name}
                            className="h-10 w-10 rounded-md object-cover mx-auto"
                            loading="lazy"
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {promotion.code}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeLabel(promotion.type)}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatDiscountValue(
                          promotion.discountType,
                          promotion.discountValue,
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateOnly(promotion.startDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateOnly(promotion.endDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={statusBadgeClass(promotion.status)}>
                          {statusLabel(promotion.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(promotion)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(promotion)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(promotion)}
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedPromotion?.name || ""}
        title="Xác nhận xóa khuyến mãi"
        description={
          selectedPromotion?.name
            ? `Bạn có chắc chắn muốn xóa khuyến mãi "${selectedPromotion.name}"? Hành động này không thể hoàn tác.`
            : "Bạn có chắc chắn muốn xóa khuyến mãi này? Hành động này không thể hoàn tác."
        }
        confirmLabel="Xóa khuyến mãi"
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết khuyến mãi</DialogTitle>
          </DialogHeader>

          {viewLoading || !viewPromotion ? (
            <div className="text-sm text-muted-foreground">
              Đang tải dữ liệu khuyến mãi...
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-start gap-4">
                {viewPromotion.imageUrl ? (
                  <img
                    src={viewPromotion.imageUrl}
                    alt={viewPromotion.promotionName}
                    className="h-20 w-20 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    —
                  </div>
                )}
                <div className="grid gap-1">
                  <p className="text-lg font-semibold">
                    {viewPromotion.promotionName || viewPromotion.promotionCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mã: {viewPromotion.promotionCode || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loại áp dụng</p>
                  <p className="font-medium">
                    {typeLabel(viewPromotion.promotionType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kiểu giảm giá</p>
                  <p className="font-medium">
                    {viewPromotion.discountType === "PERCENTAGE"
                      ? "Phần trăm"
                      : "Giá trị cố định"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="font-medium">
                    {statusLabel(
                      mapStatus(
                        viewPromotion.status ?? viewPromotion.promotionStatus,
                      ),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá trị giảm</p>
                  <p className="font-medium">
                    {formatDiscountValue(
                      viewPromotion.discountType,
                      viewPromotion.discountValue,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giảm tối đa</p>
                  <p className="font-medium">
                    {formatMoney(viewPromotion.maxDiscountAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Giá trị đơn tối thiểu
                  </p>
                  <p className="font-medium">
                    {formatMoney(viewPromotion.minimumSpent || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="font-medium">
                    {formatNumber(viewPromotion.quantity || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Giới hạn / khách
                  </p>
                  <p className="font-medium">
                    {formatNumber(viewPromotion.usageLimitPerUser || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                  <p className="font-medium">
                    {formatDateOnly(viewPromotion.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày kết thúc</p>
                  <p className="font-medium">
                    {formatDateOnly(viewPromotion.endDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {formatDateTime(viewPromotion.createdDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cập nhật lúc</p>
                  <p className="font-medium">
                    {formatDateTime(viewPromotion.updatedDate)}
                  </p>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khuyến mãi</DialogTitle>
          </DialogHeader>

          {editLoading || !editForm ? (
            <div className="text-sm text-muted-foreground">
              Đang tải dữ liệu khuyến mãi...
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tên khuyến mãi</label>
                <Input
                  value={editForm.promotionName}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, promotionName: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Mã khuyến mãi</label>
                <Input
                  value={editForm.promotionCode}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, promotionCode: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Loại áp dụng</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editForm.promotionType}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              promotionType: e.target
                                .value as Promotion["promotionType"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="ORDER">Đơn hàng</option>
                    <option value="PRODUCT">Sản phẩm</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editForm.promotionStatus}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              promotionStatus: e.target
                                .value as Promotion["promotionStatus"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="ACTIVE">Đang áp dụng</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                    <option value="EXPIRED">Hết hạn</option>
                    <option value="DELETED">Đã xóa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Giá trị đơn tối thiểu
                  </label>
                  <Input
                    type="number"
                    value={editForm.minimumSpent}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, minimumSpent: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Số lượng</label>
                  <Input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, quantity: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Kiểu giảm giá</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editForm.discountType}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              discountType: e.target
                                .value as Promotion["discountType"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED_AMOUNT">Giá trị cố định</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giá trị giảm</label>
                  <Input
                    type="number"
                    value={editForm.discountValue}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, discountValue: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giảm tối đa</label>
                  <Input
                    type="number"
                    value={editForm.maxDiscountAmount}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, maxDiscountAmount: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Giới hạn / khách
                  </label>
                  <Input
                    type="number"
                    value={editForm.usageLimitPerUser}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, usageLimitPerUser: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Ngày bắt đầu</label>
                  <Input
                    type="datetime-local"
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, startDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Ngày kết thúc</label>
                  <Input
                    type="datetime-local"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, endDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Tải ảnh mới</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditImageFile(e.target.files?.[0] ?? null)
                  }
                />
                {editImageFile ? (
                  <p className="text-xs text-muted-foreground">
                    Đã chọn: {editImageFile.name}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving || editImageUploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={editSaving || editLoading || editImageUploading}
            >
              {editImageUploading
                ? "Đang tải ảnh..."
                : editSaving
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm khuyến mãi</DialogTitle>
          </DialogHeader>

          {!createForm ? (
            <div className="text-sm text-muted-foreground">
              Đang chuẩn bị form...
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tên khuyến mãi</label>
                <Input
                  value={createForm.promotionName}
                  onChange={(e) =>
                    setCreateForm((prev) =>
                      prev ? { ...prev, promotionName: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Mã khuyến mãi</label>
                <Input
                  value={createForm.promotionCode}
                  onChange={(e) =>
                    setCreateForm((prev) =>
                      prev ? { ...prev, promotionCode: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Loại áp dụng</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={createForm.promotionType}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              promotionType: e.target
                                .value as Promotion["promotionType"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="ORDER">Đơn hàng</option>
                    <option value="PRODUCT">Sản phẩm</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={createForm.promotionStatus}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              promotionStatus: e.target
                                .value as Promotion["promotionStatus"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="ACTIVE">Đang áp dụng</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Shop ID</label>
                  <Input
                    type="number"
                    value={createForm.shopId}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, shopId: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Giá trị đơn tối thiểu
                  </label>
                  <Input
                    type="number"
                    value={createForm.minimumSpent}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, minimumSpent: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Số lượng</label>
                  <Input
                    type="number"
                    value={createForm.quantity}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, quantity: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Kiểu giảm giá</label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={createForm.discountType}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              discountType: e.target
                                .value as Promotion["discountType"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED_AMOUNT">Giá trị cố định</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giá trị giảm</label>
                  <Input
                    type="number"
                    value={createForm.discountValue}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? { ...prev, discountValue: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giảm tối đa</label>
                  <Input
                    type="number"
                    value={createForm.maxDiscountAmount}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? { ...prev, maxDiscountAmount: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Giới hạn / khách
                  </label>
                  <Input
                    type="number"
                    value={createForm.usageLimitPerUser}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev
                          ? { ...prev, usageLimitPerUser: e.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Ngày bắt đầu</label>
                  <Input
                    type="datetime-local"
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, startDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Ngày kết thúc</label>
                  <Input
                    type="datetime-local"
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm((prev) =>
                        prev ? { ...prev, endDate: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Tải ảnh mới</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCreateImageFile(e.target.files?.[0] ?? null)
                  }
                />
                {createImageFile ? (
                  <p className="text-xs text-muted-foreground">
                    Đã chọn: {createImageFile.name}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createSaving || createImageUploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createSaving || createImageUploading || !createForm}
            >
              {createImageUploading
                ? "Đang tải ảnh..."
                : createSaving
                  ? "Đang lưu..."
                  : "Tạo khuyến mãi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
