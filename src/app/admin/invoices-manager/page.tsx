"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Search, Package2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { IngredientDto } from "@/types/ingredient";

type InvoiceItem = {
  ingredientId: number;
  ingredientName: string;
  inputUnit: string;
  inputQuantity: number;
  unitPrice: number;
  convertedQuantity: number;
  baseUnit: string;
  batchCode: string;
  expiredAt: string;
};

type InvoiceCreateItem = {
  ingredientId: number;
  inputUnit: string;
  inputQuantity: number;
  unitPrice: number;
  batchCode: string;
  expiredAt: string;
};

type InvoiceDto = {
  id: number | string;
  code?: string | null;
  supplierName?: string | null;
  totalAmount?: number | null;
  invoiceImageUrl?: string | null;
  importedAt?: string | null;
  createdByName?: string | null;
  items?: InvoiceItem[] | null;
};

type InvoiceForm = {
  code: string;
  supplierName: string;
  totalAmount: number;
  importedAt: string;
  createdByName: string;
  invoiceImageUrl: string;
  items: InvoiceItem[];
};

type InvoiceCreateForm = {
  code: string;
  supplierName: string;
  invoiceImageUrl: string;
  note: string;
  items: InvoiceCreateItem[];
};

type InvoiceApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

type UnitConversionForm = {
  ingredientId: number;
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  isStandard: boolean;
};

type UnitConversionApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

type IngredientsApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
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

const formatMoney = (amount?: number | null) =>
  `${Number(amount ?? 0).toLocaleString("vi-VN")} VND`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const normalizeInvoices = (payload: unknown): InvoiceDto[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as InvoiceDto[];
  if (data && typeof data === "object") {
    const nested = data as {
      data?: unknown;
      content?: unknown;
      items?: unknown;
    };
    if (Array.isArray(nested.data)) return nested.data as InvoiceDto[];
    if (Array.isArray(nested.content)) return nested.content as InvoiceDto[];
    if (Array.isArray(nested.items)) return nested.items as InvoiceDto[];
  }
  return [];
};

const normalizeIngredients = (payload: unknown): IngredientDto[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as IngredientDto[];
  if (data && typeof data === "object") {
    const nested = data as {
      data?: unknown;
      content?: unknown;
      items?: unknown;
    };
    if (Array.isArray(nested.data)) return nested.data as IngredientDto[];
    if (Array.isArray(nested.content)) return nested.content as IngredientDto[];
    if (Array.isArray(nested.items)) return nested.items as IngredientDto[];
  }
  return [];
};

const toForm = (item?: InvoiceDto | null): InvoiceForm => ({
  code: item?.code ?? "",
  supplierName: item?.supplierName ?? "",
  totalAmount: Number(item?.totalAmount ?? 0),
  importedAt: item?.importedAt ?? "",
  createdByName: item?.createdByName ?? "",
  invoiceImageUrl: item?.invoiceImageUrl ?? "",
  items: Array.isArray(item?.items) ? (item?.items ?? []) : [],
});

const toCreateForm = (): InvoiceCreateForm => ({
  code: "",
  supplierName: "",
  invoiceImageUrl: "",
  note: "",
  items: [
    {
      ingredientId: 0,
      inputUnit: "",
      inputQuantity: 0,
      unitPrice: 0,
      batchCode: "",
      expiredAt: "",
    },
  ],
});

const toUnitConversionForm = (): UnitConversionForm => ({
  ingredientId: 0,
  fromUnit: "",
  toUnit: "",
  conversionFactor: 0,
  isStandard: true,
});

const fromUnitOptions = ["BOX", "PACK", "DOZEN", "BOTTLE", "BAG"] as const;
const toUnitOptions = [
  "GRAM",
  "KILOGRAM",
  "LITER",
  "MILLILITER",
  "PIECE",
  "PAIR",
] as const;

export default function InvoicesManagerPage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "create">("view");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(
    null,
  );
  const [form, setForm] = useState<InvoiceForm>(() => toForm());
  const [createForm, setCreateForm] = useState<InvoiceCreateForm>(() =>
    toCreateForm(),
  );
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitForm, setUnitForm] = useState<UnitConversionForm>(() =>
    toUnitConversionForm(),
  );
  const [unitSubmitting, setUnitSubmitting] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/invoices?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await parseJsonSafely<InvoiceApiResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load invoices failed");
        }

        setInvoices(normalizeInvoices(data).filter(Boolean));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load invoices failed";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      setIngredientsLoading(true);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/ingredients?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await parseJsonSafely<IngredientsApiResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load ingredients failed");
        }

        setIngredients(normalizeIngredients(data).filter(Boolean));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load ingredients failed";
        toast.error(msg);
      } finally {
        setIngredientsLoading(false);
      }
    };

    run();
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return invoices.filter((item) => {
      const code = item.code?.toLowerCase() ?? "";
      const supplier = item.supplierName?.toLowerCase() ?? "";
      return code.includes(q) || supplier.includes(q);
    });
  }, [invoices, searchQuery]);

  const summary = useMemo(() => {
    const total = invoices.length;
    const totalAmount = invoices.reduce(
      (acc, item) => acc + Number(item.totalAmount ?? 0),
      0,
    );
    const totalItems = invoices.reduce(
      (acc, item) => acc + (item.items?.length ?? 0),
      0,
    );
    return { total, totalAmount, totalItems };
  }, [invoices]);

  const handleView = async (invoice: InvoiceDto) => {
    setDialogMode("view");
    setDialogOpen(true);
    setSelectedInvoice(invoice);
    setForm(toForm(invoice));

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        cache: "no-store",
      });
      const data = await parseJsonSafely<InvoiceApiResponse>(res);

      if (!res.ok || !data || (data.code ?? 200) >= 400 || !data.data) {
        throw new Error(data?.message || "Get invoice failed");
      }

      const detail = data.data as InvoiceDto;
      setSelectedInvoice(detail);
      setForm(toForm(detail));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Get invoice failed";
      toast.error(msg);
    }
  };

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedInvoice(null);
    setForm(toForm());
    setCreateForm(toCreateForm());
    setDialogOpen(true);
  };

  const handleOpenUnitConversion = () => {
    setUnitForm(toUnitConversionForm());
    setUnitDialogOpen(true);
  };

  const updateCreateItem = (
    index: number,
    patch: Partial<InvoiceCreateItem>,
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const addCreateItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ingredientId: 0,
          inputUnit: "",
          inputQuantity: 0,
          unitPrice: 0,
          batchCode: "",
          expiredAt: "",
        },
      ],
    }));
  };

  const removeCreateItem = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const payload = {
      code: createForm.code.trim(),
      supplierName: createForm.supplierName.trim(),
      invoiceImageUrl: createForm.invoiceImageUrl.trim() || null,
      note: createForm.note.trim() || null,
      items: createForm.items
        .filter((item) => Number(item.ingredientId) > 0)
        .map((item) => ({
          ingredientId: Number(item.ingredientId),
          inputUnit: item.inputUnit.trim(),
          inputQuantity: Number(item.inputQuantity),
          unitPrice: Number(item.unitPrice),
          batchCode: item.batchCode.trim(),
          expiredAt: item.expiredAt,
        })),
    };

    if (!payload.supplierName) {
      toast.error("Vui lòng nhập tên nhà cung cấp");
      return;
    }

    if (payload.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mặt hàng");
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely<InvoiceApiResponse>(res);

      if (!res.ok || !data || (data.code ?? 200) >= 400) {
        throw new Error(data?.message || "Create invoice failed");
      }

      const created = data.data as InvoiceDto | undefined;
      if (created) {
        setInvoices((prev) => [created, ...prev].filter(Boolean));
      }
      toast.success("Đã tạo hóa đơn");
      setDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create invoice failed";
      toast.error(msg);
    }
  };

  const handleSaveUnitConversion = async () => {
    const payload = {
      ingredientId: Number(unitForm.ingredientId),
      fromUnit: unitForm.fromUnit.trim(),
      toUnit: unitForm.toUnit.trim(),
      conversionFactor: Number(unitForm.conversionFactor),
      isStandard: Boolean(unitForm.isStandard),
    };

    if (!payload.ingredientId) {
      toast.error("Vui lòng chọn nguyên liệu");
      return;
    }

    if (!payload.fromUnit || !payload.toUnit) {
      toast.error("Vui lòng nhập đơn vị quy đổi");
      return;
    }

    if (!payload.conversionFactor || payload.conversionFactor <= 0) {
      toast.error("Vui lòng nhập hệ số quy đổi");
      return;
    }

    setUnitSubmitting(true);
    try {
      const res = await fetch("/api/unit-conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely<UnitConversionApiResponse>(res);

      if (!res.ok || !data || (data.code ?? 200) >= 400) {
        throw new Error(data?.message || "Create unit conversion failed");
      }

      toast.success("Đã tạo quy đổi đơn vị");
      setUnitDialogOpen(false);
      setUnitForm(toUnitConversionForm());
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Create unit conversion failed";
      toast.error(msg);
    } finally {
      setUnitSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hóa đơn</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách hóa đơn nhập kho.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleOpenUnitConversion}>
              <Plus className="w-4 h-4 mr-2" />
              Quy đổi đơn vị
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo hóa đơn
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-sm text-muted-foreground">Tổng hóa đơn</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Package2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {summary.totalItems.toLocaleString("vi-VN")}
                </p>
                <p className="text-sm text-muted-foreground">Tổng mặt hàng</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatMoney(summary.totalAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tổng giá trị nhập
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
                placeholder="Tìm kiếm hóa đơn..."
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
                  <TableHead className="font-semibold">Mã hóa đơn</TableHead>
                  <TableHead className="font-semibold text-center">
                    Nhà cung cấp
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Tổng tiền
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Ngày nhập
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Số mặt hàng
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
                      Đang tải hóa đơn...
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
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy hóa đơn nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="admin-table-row">
                      <TableCell className="font-medium">
                        {invoice.code ?? `HD-${invoice.id}`}
                      </TableCell>
                      <TableCell className="text-center">
                        {invoice.supplierName ?? "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatMoney(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(invoice.importedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {invoice.items?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(invoice)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
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
          if (!open) {
            if (dialogMode === "create") {
              setCreateForm(toCreateForm());
            } else {
              setForm(toForm(selectedInvoice));
            }
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Tạo hóa đơn" : "Chi tiết hóa đơn"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Nhập thông tin hóa đơn nhập kho."
                : "Xem thông tin hóa đơn nhập kho."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Mã hóa đơn</Label>
              <Input
                id="code"
                value={dialogMode === "create" ? createForm.code : form.code}
                onChange={(e) =>
                  dialogMode === "create"
                    ? setCreateForm((f) => ({ ...f, code: e.target.value }))
                    : setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="HD-2026-001"
                disabled={dialogMode !== "create"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Nhà cung cấp</Label>
              <Input
                id="supplierName"
                value={
                  dialogMode === "create"
                    ? createForm.supplierName
                    : form.supplierName
                }
                onChange={(e) =>
                  dialogMode === "create"
                    ? setCreateForm((f) => ({
                        ...f,
                        supplierName: e.target.value,
                      }))
                    : setForm((f) => ({ ...f, supplierName: e.target.value }))
                }
                placeholder="Tên nhà cung cấp"
                disabled={dialogMode !== "create"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Tổng tiền</Label>
              <Input
                id="totalAmount"
                type="number"
                value={form.totalAmount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    totalAmount: Number(e.target.value),
                  }))
                }
                placeholder="0"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importedAt">Ngày nhập</Label>
              <Input
                id="importedAt"
                value={formatDate(form.importedAt)}
                disabled
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="createdByName">Người tạo</Label>
              <Input
                id="createdByName"
                value={form.createdByName || "-"}
                disabled
              />
            </div>

            {dialogMode === "create" ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invoiceImageUrl">Ảnh hóa đơn (URL)</Label>
                <Input
                  id="invoiceImageUrl"
                  value={createForm.invoiceImageUrl}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      invoiceImageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/invoice.jpg"
                />
              </div>
            ) : form.invoiceImageUrl ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Ảnh hóa đơn</Label>
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.invoiceImageUrl}
                    alt={`Invoice ${form.code}`}
                    className="w-full max-h-80 object-contain bg-background"
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2 md:col-span-2">
              <Label>Danh sách mặt hàng</Label>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        Thông tin mặt hàng
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dialogMode === "create" ? (
                      createForm.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={1}
                            className="text-center py-6 text-muted-foreground"
                          >
                            Chưa có mặt hàng
                          </TableCell>
                        </TableRow>
                      ) : (
                        createForm.items.map((item, index) => (
                          <TableRow key={`create-${index}`}>
                            <TableCell className="p-4">
                              <div className="grid gap-2 text-sm">
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                  <div className="text-muted-foreground">
                                    Nguyên liệu
                                  </div>
                                  <div className="space-y-1">
                                    <select
                                      className="h-9 text-sm max-w-[220px] w-full rounded-md border border-input bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                      value={item.ingredientId || ""}
                                      onChange={(e) =>
                                        updateCreateItem(index, {
                                          ingredientId: Number(e.target.value),
                                        })
                                      }
                                    >
                                      <option value="" disabled>
                                        Chọn nguyên liệu
                                      </option>
                                      {ingredientsLoading ? (
                                        <option value="" disabled>
                                          Đang tải danh sách nguyên liệu...
                                        </option>
                                      ) : (
                                        ingredients.map((ing) => (
                                          <option key={ing.id} value={ing.id}>
                                            {ing.name}
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                  <div className="text-muted-foreground">
                                    Số lượng
                                  </div>
                                  <Input
                                    type="number"
                                    value={
                                      item.inputQuantity === 0
                                        ? ""
                                        : item.inputQuantity
                                    }
                                    onChange={(e) =>
                                      updateCreateItem(index, {
                                        inputQuantity:
                                          e.target.value === ""
                                            ? 0
                                            : Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                  <div className="text-muted-foreground">
                                    Đơn vị
                                  </div>
                                  <Input
                                    value={item.inputUnit}
                                    onChange={(e) =>
                                      updateCreateItem(index, {
                                        inputUnit: e.target.value,
                                      })
                                    }
                                    placeholder="BOX"
                                  />
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                  <div className="text-muted-foreground">
                                    Đơn giá
                                  </div>
                                  <Input
                                    type="number"
                                    step="any"
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={
                                      item.unitPrice === 0 ? "" : item.unitPrice
                                    }
                                    onChange={(e) =>
                                      updateCreateItem(index, {
                                        unitPrice:
                                          e.target.value === ""
                                            ? 0
                                            : Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                  <div className="text-muted-foreground">
                                    Lô
                                  </div>
                                  <Input
                                    value={item.batchCode}
                                    onChange={(e) =>
                                      updateCreateItem(index, {
                                        batchCode: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                  <div className="text-muted-foreground">
                                    HSD
                                  </div>
                                  <Input
                                    type="date"
                                    value={item.expiredAt}
                                    onChange={(e) =>
                                      updateCreateItem(index, {
                                        expiredAt: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeCreateItem(index)}
                                    disabled={createForm.items.length === 1}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    ) : (form.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={1}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Không có mặt hàng
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items ?? []).map((item, index) => (
                        <TableRow
                          key={`${item.ingredientId}-${item.batchCode}-${index}`}
                        >
                          <TableCell className="p-4">
                            <div className="grid gap-2 text-sm">
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">
                                  Nguyên liệu
                                </div>
                                <div className="font-semibold text-foreground">
                                  {item.ingredientName}
                                </div>
                              </div>
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">
                                  Số lượng
                                </div>
                                <div>
                                  {item.inputQuantity.toLocaleString("vi-VN")}{" "}
                                  {item.inputUnit}
                                </div>
                              </div>
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">
                                  Đơn giá
                                </div>
                                <div>{formatMoney(item.unitPrice)}</div>
                              </div>
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">
                                  Thành tiền
                                </div>
                                <div className="font-semibold">
                                  {formatMoney(
                                    item.unitPrice * item.inputQuantity,
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">
                                  Quy đổi
                                </div>
                                <div>
                                  {item.convertedQuantity.toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  {item.baseUnit}
                                </div>
                              </div>
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">Lô</div>
                                <div>{item.batchCode}</div>
                              </div>
                              <div className="grid grid-cols-[160px_1fr] gap-2">
                                <div className="text-muted-foreground">HSD</div>
                                <div>{item.expiredAt}</div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {dialogMode === "view" && (form.items ?? []).length > 0 ? (
                    <tfoot>
                      <TableRow className="bg-muted/30">
                        <TableCell className="p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                            <span>Tổng cộng</span>
                            <span>
                              {formatMoney(
                                (form.items ?? []).reduce(
                                  (acc, item) =>
                                    acc + item.unitPrice * item.inputQuantity,
                                  0,
                                ),
                              )}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Tổng số lượng:{" "}
                            {(form.items ?? [])
                              .reduce(
                                (acc, item) => acc + Number(item.inputQuantity),
                                0,
                              )
                              .toLocaleString("vi-VN")}
                          </div>
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  ) : null}
                </Table>
              </div>
            </div>

            {dialogMode === "create" ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Input
                  id="note"
                  value={createForm.note}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Nhập hàng định kỳ..."
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Đóng
            </Button>
            {dialogMode === "create" ? (
              <>
                <Button type="button" variant="outline" onClick={addCreateItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mặt hàng
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleSave}
                >
                  Tạo hóa đơn
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unitDialogOpen}
        onOpenChange={(open) => {
          setUnitDialogOpen(open);
          if (!open) setUnitForm(toUnitConversionForm());
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quy đổi đơn vị</DialogTitle>
            <DialogDescription>
              Thiết lập quy đổi đơn vị cho nguyên liệu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="unit-ingredient">Nguyên liệu</Label>
              <select
                id="unit-ingredient"
                className="h-9 text-sm w-full rounded-md border border-input bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={unitForm.ingredientId || ""}
                onChange={(e) =>
                  setUnitForm((prev) => ({
                    ...prev,
                    ingredientId: Number(e.target.value),
                  }))
                }
              >
                <option value="" disabled>
                  Chọn nguyên liệu
                </option>
                {ingredientsLoading ? (
                  <option value="" disabled>
                    Đang tải danh sách nguyên liệu...
                  </option>
                ) : (
                  ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromUnit">Từ đơn vị</Label>
              <select
                id="fromUnit"
                className="h-9 text-sm w-full rounded-md border border-input bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={unitForm.fromUnit}
                onChange={(e) =>
                  setUnitForm((prev) => ({
                    ...prev,
                    fromUnit: e.target.value,
                  }))
                }
              >
                <option value="" disabled>
                  Chọn đơn vị
                </option>
                {fromUnitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toUnit">Sang đơn vị</Label>
              <select
                id="toUnit"
                className="h-9 text-sm w-full rounded-md border border-input bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={unitForm.toUnit}
                onChange={(e) =>
                  setUnitForm((prev) => ({
                    ...prev,
                    toUnit: e.target.value,
                  }))
                }
              >
                <option value="" disabled>
                  Chọn đơn vị
                </option>
                {toUnitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionFactor">Hệ số quy đổi</Label>
              <Input
                id="conversionFactor"
                type="number"
                step="any"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={
                  unitForm.conversionFactor === 0
                    ? ""
                    : unitForm.conversionFactor
                }
                onChange={(e) =>
                  setUnitForm((prev) => ({
                    ...prev,
                    conversionFactor:
                      e.target.value === "" ? 0 : Number(e.target.value),
                  }))
                }
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label className="block">Chuẩn</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={unitForm.isStandard}
                  onCheckedChange={(checked) =>
                    setUnitForm((prev) => ({ ...prev, isStandard: checked }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {unitForm.isStandard ? "Đang bật" : "Đang tắt"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
              Đóng
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSaveUnitConversion}
              disabled={unitSubmitting}
            >
              Lưu quy đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
