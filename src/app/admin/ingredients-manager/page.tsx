"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Package2,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";
import { ApiError } from "@/lib/utils";
import type {
  IngredientBaseUnit,
  IngredientDto,
  IngredientInput,
  IngredientInventoryStatus,
  IngredientStorageType,
} from "@/types/ingredient";

type IngredientForm = {
  name: string;
  skuCode: string;
  baseUnit: IngredientBaseUnit;
  minStockAlert: number;
  storageType: IngredientStorageType;
  inventoryStatus: IngredientInventoryStatus;
};

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
};

const baseUnitOptions: IngredientBaseUnit[] = [
  "GRAM",
  "KILOGRAM",
  "LITER",
  "MILLILITER",
  "PIECE",
  "PAIR",
];

const storageTypeOptions: IngredientStorageType[] = [
  "NORMAL",
  "COOL",
  "FROZEN",
  "DRY",
  "REFRIGERATED",
];

const statusOptions: IngredientInventoryStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "DELETED",
];

const formatStock = (
  qty: number | null | undefined,
  unit: IngredientBaseUnit,
) =>
  `${Number(qty ?? 0).toLocaleString("vi-VN")} ${baseUnitLabel(unit)}`.trim();
const statusLabel = (status: IngredientInventoryStatus) =>
  status === "ACTIVE"
    ? "Họat động"
    : status === "INACTIVE"
      ? "Tạm dừng"
      : "Đã xóa";

const storageLabel = (type: IngredientStorageType) =>
  type === "NORMAL"
    ? "THƯỜNG"
    : type === "COOL"
      ? "LÀM MÁT"
      : type === "FROZEN"
        ? "ĐÔNG LẠNH"
        : type === "DRY"
          ? "KHÔ"
          : "LÀM LẠNH";
const baseUnitLabel = (unit: IngredientBaseUnit) =>
  unit === "GRAM"
    ? "GAM"
    : unit === "KILOGRAM"
      ? "KG"
      : unit === "LITER"
        ? "LÍT"
        : unit === "MILLILITER"
          ? "ML"
          : unit === "PIECE"
            ? "CÁI"
            : "ĐÔI";
const statusBadgeClass = (status: IngredientInventoryStatus) =>
  status === "ACTIVE"
    ? "admin-badge admin-badge-active"
    : "admin-badge admin-badge-inactive";

const toForm = (item?: IngredientDto | null): IngredientForm => ({
  name: item?.name ?? "",
  skuCode: item?.skuCode ?? "",
  baseUnit: item?.baseUnit ?? "GRAM",
  minStockAlert: item?.minStockAlert ?? 0,
  storageType: item?.storageType ?? "NORMAL",
  inventoryStatus: item?.inventoryStatus ?? "ACTIVE",
});

export default function IngredientsManagerPage() {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientDto | null>(null);
  const [form, setForm] = useState<IngredientForm>(() => toForm());

  const getIngredientsClient = async (params: {
    page: number;
    size: number;
  }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
    });

    const res = await fetch(`/api/ingredients?${qs.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = await parseJsonSafely<{ code?: number; message?: string }>(
      res,
    );

    if (!res.ok) {
      throw new ApiError("BE error", res.status, data);
    }

    if (!data || Number(data.code) !== 200) {
      throw new ApiError(data?.message || "Get ingredients failed", 400, data);
    }

    return data as unknown;
  };

  const createIngredientClient = async (payload: IngredientInput) => {
    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseJsonSafely<{ message?: string }>(res);

    if (!res.ok || !data) {
      throw new ApiError(
        data?.message || "Create ingredient failed",
        res.status,
        data,
      );
    }

    if ("data" in data && (data as { data?: IngredientDto }).data) {
      return (data as { data: IngredientDto }).data;
    }

    return data as unknown as IngredientDto;
  };

  const updateIngredientByIdClient = async (
    id: number | string,
    payload: Partial<IngredientInput>,
  ) => {
    const res = await fetch(`/api/ingredients/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseJsonSafely<{ message?: string }>(res);

    if (!res.ok || !data) {
      throw new ApiError(
        data?.message || "Update ingredient failed",
        res.status,
        data,
      );
    }

    if ("data" in data && (data as { data?: IngredientDto }).data) {
      return (data as { data: IngredientDto }).data;
    }

    return data as unknown as IngredientDto;
  };

  const normalizeIngredients = (payload: unknown): IngredientDto[] => {
    if (!payload || typeof payload !== "object") return [];
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data))
      return data.filter(
        (item): item is IngredientDto =>
          !!item && typeof item === "object" && "name" in item,
      );
    if (data && typeof data === "object") {
      const nested = data as {
        data?: unknown;
        content?: unknown;
        items?: unknown;
      };
      if (Array.isArray(nested.data))
        return nested.data.filter(
          (item): item is IngredientDto =>
            !!item && typeof item === "object" && "name" in item,
        );
      if (Array.isArray(nested.content))
        return nested.content.filter(
          (item): item is IngredientDto =>
            !!item && typeof item === "object" && "name" in item,
        );
      if (Array.isArray(nested.items))
        return nested.items.filter(
          (item): item is IngredientDto =>
            !!item && typeof item === "object" && "name" in item,
        );
    }
    return [];
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getIngredientsClient({ page: 0, size: 200 });
        setIngredients(normalizeIngredients(data).filter(Boolean));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load ingredients failed";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const safeIngredients = useMemo(
    () => ingredients.filter(Boolean) as IngredientDto[],
    [ingredients],
  );

  const filteredIngredients = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return safeIngredients.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const sku = item.skuCode?.toLowerCase() ?? "";
      return name.includes(q) || sku.includes(q);
    });
  }, [safeIngredients, searchQuery]);

  const summary = useMemo(() => {
    const total = safeIngredients.length;
    const active = safeIngredients.filter(
      (i) => i.inventoryStatus === "ACTIVE",
    ).length;
    const lowStock = safeIngredients.filter(
      (i) => (i.totalStockQuantity ?? 0) <= (i.minStockAlert ?? 0),
    ).length;
    return { total, active, lowStock };
  }, [safeIngredients]);

  const openCreate = () => {
    setDialogMode("create");
    setSelectedIngredient(null);
    setForm(toForm());
    setDialogOpen(true);
  };

  const openEdit = (item: IngredientDto) => {
    setDialogMode("edit");
    setSelectedIngredient(item);
    setForm(toForm(item));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: IngredientInput = {
      name: form.name.trim(),
      skuCode: form.skuCode.trim(),
      baseUnit: form.baseUnit,
      minStockAlert: Number(form.minStockAlert) || 0,
      storageType: form.storageType,
      inventoryStatus: form.inventoryStatus,
    };

    if (!payload.name) {
      toast.error("Vui lòng nhập tên nguyên liệu");
      return;
    }

    if (!payload.skuCode) {
      toast.error("Vui lòng nhập mã SKU");
      return;
    }

    try {
      if (dialogMode === "create") {
        const created = await createIngredientClient(payload);
        setIngredients((prev) => [created, ...prev].filter(Boolean));
        toast.success(`Đã thêm nguyên liệu "${created.name}"`);
      } else if (selectedIngredient) {
        const updated = await updateIngredientByIdClient(
          selectedIngredient.id,
          payload,
        );
        setIngredients((prev) =>
          prev.map((i) => (i?.id === updated.id ? updated : i)).filter(Boolean),
        );
        toast.success(`Đã cập nhật nguyên liệu "${updated.name}"`);
      }

      setDialogOpen(false);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : dialogMode === "create"
            ? "Create ingredient failed"
            : "Update ingredient failed";
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nguyên liệu</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách nguyên liệu và tồn kho.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm nguyên liệu
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-sm text-muted-foreground">
                  Tổng nguyên liệu
                </p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.active}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.lowStock}</p>
                <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nguyên liệu..."
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
                    Tên nguyên liệu
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    SKU
                  </TableHead>

                  <TableHead className="font-semibold text-center">
                    Tồn kho
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Kho lưu trữ
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-center">
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
                      Đang tải nguyên liệu...
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
                ) : filteredIngredients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy nguyên liệu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIngredients.map((item) => (
                    <TableRow key={item.id} className="admin-table-row">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        {item.skuCode}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatStock(item.totalStockQuantity, item.baseUnit)}
                      </TableCell>
                      <TableCell className="text-center">
                        {storageLabel(item.storageType)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={statusBadgeClass(item.inventoryStatus)}
                        >
                          {statusLabel(item.inventoryStatus)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
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
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setForm(toForm(selectedIngredient));
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? "Thêm nguyên liệu"
                : "Chỉnh sửa nguyên liệu"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin cơ bản và ngưỡng cảnh báo tồn kho.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Tên nguyên liệu</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ví dụ: Đường trắng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">Mã SKU</Label>
              <Input
                id="sku"
                value={form.skuCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, skuCode: e.target.value }))
                }
                placeholder="ING-SUGAR-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUnit">Đơn vị cơ bản</Label>
              <select
                id="baseUnit"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.baseUnit}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    baseUnit: e.target.value as IngredientBaseUnit,
                  }))
                }
              >
                {baseUnitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {baseUnitLabel(unit)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageType">Kho lưu trữ</Label>
              <select
                id="storageType"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.storageType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    storageType: e.target.value as IngredientStorageType,
                  }))
                }
              >
                {storageTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {storageLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.inventoryStatus}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    inventoryStatus: e.target
                      .value as IngredientInventoryStatus,
                  }))
                }
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              {dialogMode === "create" ? "Lưu nguyên liệu" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
