"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  CheckCircle2,
  ChevronDown,
  Filter,
  Plus,
  Pencil,
  Eye,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import type {
  Variant,
  VariantStatus,
  VariantsResponse,
} from "@/types/variants";
import type { ProductsResponse } from "@/types/product";
import type { Size } from "@/types/size";

type VariantRow = {
  id: string;
  skuCode: string;
  sizeCode: string;
  productName: string;
  price: number;
  costPrice: number;
  status: VariantStatus;
  productId?: number;
  sizeId?: number;
};

type VariantDetailResponse = {
  code?: number;
  message?: string;
  data?: Variant | null;
};

type ProductItem = {
  id: number;
  name: string;
  status?: string;
};

type CreateFormState = {
  productId: string;
  sizeId: string;
  skuCode: string;
  price: string;
  costPrice: string;
  status: VariantStatus;
};

type EditFormState = CreateFormState & {
  id: string;
};

type ViewFormState = {
  id: string;
  productName: string;
  sizeCode: string;
  skuCode: string;
  price: string;
  costPrice: string;
  status: VariantStatus;
};

const mapVariant = (v: Variant): VariantRow => ({
  id: String(v.id ?? 0),
  skuCode: v.skuCode ?? "",
  sizeCode: v.sizeCode ?? "",
  productName: v.productName ?? "",
  price: Number(v.price ?? 0),
  costPrice: Number(v.costPrice ?? 0),
  status: v.status ?? "INACTIVE",
  productId: typeof v.productId === "number" ? v.productId : undefined,
  sizeId: typeof v.sizeId === "number" ? v.sizeId : undefined,
});

const statusLabel = (status: VariantStatus) =>
  status === "ACTIVE" ? "Đang hoạt động" : "Tạm dừng";

const statusBadgeClass = (status: VariantStatus) =>
  status === "ACTIVE"
    ? "admin-badge admin-badge-active"
    : "admin-badge admin-badge-inactive";

const formatPrice = (n: number) => `${n.toLocaleString("vi-VN")} VND`;

export default function VariantsManagerPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null,
  );

  const [sizes, setSizes] = useState<Size[]>([]);
  const [sizesLoading, setSizesLoading] = useState(false);

  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [filterOpen, setFilterOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    productId: "",
    sizeId: "",
    skuCode: "",
    price: "",
    costPrice: "",
    status: "ACTIVE",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    id: "",
    productId: "",
    sizeId: "",
    skuCode: "",
    price: "",
    costPrice: "",
    status: "ACTIVE",
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewForm, setViewForm] = useState<ViewFormState>({
    id: "",
    productName: "",
    sizeCode: "",
    skuCode: "",
    price: "",
    costPrice: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    const run = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/products?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = (await res
          .json()
          .catch(() => null)) as ProductsResponse | null;

        if (!res.ok || !data || data.code !== 200) {
          throw new Error(data?.message || "Load products failed");
        }

        const items = (data.data ?? []).map((p) => ({
          id: p.id,
          name: p.name ?? "",
          status: p.status,
        }));
        const activeItems = items.filter(
          (p) => String(p.status ?? "").toUpperCase() === "ACTIVE",
        );
        setProducts(activeItems);

        const selectedStillValid = selectedProduct
          ? activeItems.some((p) => p.id === selectedProduct.id)
          : false;
        if (!selectedStillValid) {
          setSelectedProduct(activeItems.length > 0 ? activeItems[0] : null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load products failed";
        setProductsError(msg);
        toast.error(msg);
      } finally {
        setProductsLoading(false);
      }
    };

    run();
  }, [selectedProduct]);

  useEffect(() => {
    const run = async () => {
      setSizesLoading(true);
      try {
        const res = await fetch("/api/sizes", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Load sizes failed");
        }
        setSizes(data as Size[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load sizes failed";
        toast.error(msg);
      } finally {
        setSizesLoading(false);
      }
    };

    run();
  }, []);

  const fetchVariants = useCallback(async () => {
    if (!selectedProduct) return;

    setIsLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({
        page: "0",
        size: "200",
        productId: String(selectedProduct.id),
      });
      if (statusFilter) qs.set("status", statusFilter);

      const res = await fetch(`/api/variants?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = (await res
        .json()
        .catch(() => null)) as VariantsResponse | null;

      if (!res.ok || !data || data.code !== 200) {
        throw new Error(data?.message || "Load variants failed");
      }

      const items = (data.data ?? []).map(mapVariant);
      setVariants(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load variants failed";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProduct, statusFilter]);

  useEffect(() => {
    if (selectedProduct) {
      fetchVariants();
    }
  }, [fetchVariants, selectedProduct]);

  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) => {
      return (
        v.skuCode.toLowerCase().includes(q) ||
        v.sizeCode.toLowerCase().includes(q) ||
        v.productName.toLowerCase().includes(q)
      );
    });
  }, [variants, searchQuery]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const activeCount = variants.filter((v) => v.status === "ACTIVE").length;

  const resolveSizeId = (variant: VariantRow): string => {
    if (typeof variant.sizeId === "number" && Number.isFinite(variant.sizeId)) {
      return String(variant.sizeId);
    }
    const match = sizes.find((s) => s.code === variant.sizeCode);
    return match ? String(match.id) : "";
  };

  const resolveProductName = (productId: string) => {
    const id = Number(productId);
    if (!Number.isFinite(id)) return "";
    return products.find((p) => p.id === id)?.name ?? "";
  };

  const resolveSizeCode = (sizeId: string) => {
    const id = Number(sizeId);
    if (!Number.isFinite(id)) return "";
    return sizes.find((s) => s.id === id)?.code ?? "";
  };

  const openCreate = () => {
    setCreateForm({
      productId: selectedProduct ? String(selectedProduct.id) : "",
      sizeId: "",
      skuCode: "",
      price: "",
      costPrice: "",
      status: "ACTIVE",
    });
    setCreateOpen(true);
  };

  const openEdit = async (variant: VariantRow) => {
    const productId =
      typeof variant.productId === "number"
        ? String(variant.productId)
        : selectedProduct
          ? String(selectedProduct.id)
          : "";

    setEditForm({
      id: variant.id,
      productId,
      sizeId: resolveSizeId(variant),
      skuCode: variant.skuCode,
      price: String(variant.price),
      costPrice: String(variant.costPrice),
      status: variant.status,
    });
    setEditOpen(true);

    try {
      const res = await fetch(`/api/variants/${variant.id}`, {
        cache: "no-store",
      });
      const data = (await res
        .json()
        .catch(() => null)) as VariantDetailResponse | null;

      if (!res.ok || !data || !data.data || (data.code ?? 0) >= 400) {
        throw new Error(data?.message || "Get variant failed");
      }

      setEditForm((prev) => ({
        ...prev,
        productId:
          typeof data.data?.productId === "number"
            ? String(data.data.productId)
            : prev.productId,
        sizeId:
          typeof data.data?.sizeId === "number"
            ? String(data.data.sizeId)
            : prev.sizeId,
        skuCode: data.data?.skuCode ?? prev.skuCode,
        price: String(data.data?.price ?? prev.price),
        costPrice: String(data.data?.costPrice ?? prev.costPrice),
        status: data.data?.status ?? prev.status,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Get variant failed";
      toast.error(msg);
    }
  };

  const openView = async (variant: VariantRow) => {
    setViewForm({
      id: variant.id,
      productName: variant.productName,
      sizeCode: variant.sizeCode,
      skuCode: variant.skuCode,
      price: String(variant.price),
      costPrice: String(variant.costPrice),
      status: variant.status,
    });
    setViewOpen(true);

    try {
      const res = await fetch(`/api/variants/${variant.id}`, {
        cache: "no-store",
      });
      const data = (await res
        .json()
        .catch(() => null)) as VariantDetailResponse | null;

      if (!res.ok || !data || !data.data || (data.code ?? 0) >= 400) {
        throw new Error(data?.message || "Get variant failed");
      }

      setViewForm((prev) => ({
        ...prev,
        productName: data.data?.productName ?? prev.productName,
        sizeCode: data.data?.sizeCode ?? prev.sizeCode,
        skuCode: data.data?.skuCode ?? prev.skuCode,
        price: String(data.data?.price ?? prev.price),
        costPrice: String(data.data?.costPrice ?? prev.costPrice),
        status: data.data?.status ?? prev.status,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Get variant failed";
      toast.error(msg);
    }
  };

  const handleCreate = async () => {
    if (!createForm.productId || !createForm.sizeId || !createForm.skuCode) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    const price = Number(createForm.price);
    const costPrice = Number(createForm.costPrice);
    if (!Number.isFinite(price) || !Number.isFinite(costPrice)) {
      toast.error("Gia ban hoac gia von khong hop le");
      return;
    }

    setCreateSaving(true);
    try {
      const res = await fetch("/api/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(createForm.productId),
          sizeId: Number(createForm.sizeId),
          price,
          costPrice,
          skuCode: createForm.skuCode.trim(),
          status: createForm.status,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Create variant failed");
      }

      toast.success("Tạo biến thể thành công");
      setCreateOpen(false);
      await fetchVariants();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create variant failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.id) return;
    if (!editForm.productId || !editForm.sizeId || !editForm.skuCode) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    const price = Number(editForm.price);
    const costPrice = Number(editForm.costPrice);
    if (!Number.isFinite(price) || !Number.isFinite(costPrice)) {
      toast.error("Giá bán hoặc giá vốn không hợp lệ");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/variants/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(editForm.productId),
          sizeId: Number(editForm.sizeId),
          price,
          costPrice,
          skuCode: editForm.skuCode.trim(),
          status: editForm.status,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Update variant failed");
      }

      toast.success("Cập nhật biến thể thành công");
      setEditOpen(false);
      await fetchVariants();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update variant failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Variants</h1>
            <p className="text-muted-foreground mt-1">
              Chọn sản phẩm để xem danh sách biến thể
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={openCreate}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm biến thể
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Tong san pham</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{variants.length}</p>
                <p className="text-sm text-muted-foreground">Tổng variants</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="flex flex-row items-center gap-2">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo SKU, size, hoặc tên sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>

              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Bật lọc
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] p-3 max-h-[280px] overflow-y-auto"
                  align="end"
                >
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase text-muted-foreground">
                        Sản phẩm
                      </label>
                      <div className="grid gap-2">
                        <Input
                          placeholder="Tìm sản phẩm..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="bg-background h-9"
                        />
                        <div className="max-h-[180px] overflow-y-auto rounded-md border border-border">
                          {productsLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Đang tải sản phẩm...
                            </div>
                          ) : productsError ? (
                            <div className="p-2 text-sm text-destructive">
                              {productsError}
                            </div>
                          ) : filteredProducts.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Không tìm thấy sản phẩm
                            </div>
                          ) : (
                            filteredProducts.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedProduct(p)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${
                                  selectedProduct?.id === p.id
                                    ? "bg-muted/50"
                                    : ""
                                }`}
                              >
                                <div className="font-medium">{p.name}</div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase text-muted-foreground">
                        Trạng thái
                      </label>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Tạm dừng</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterOpen(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                          setFilterOpen(false);
                          fetchVariants();
                        }}
                        disabled={!selectedProduct}
                      >
                        Lọc
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Size</TableHead>
                  <TableHead className="font-semibold">Sản phẩm</TableHead>
                  <TableHead className="font-semibold text-right">
                    Giá
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Giá vốn
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
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải variants...
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
                ) : !selectedProduct ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Chọn sản phẩm để xem biến thể
                    </TableCell>
                  </TableRow>
                ) : filteredVariants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy variant nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVariants.map((variant) => (
                    <TableRow key={variant.id} className="admin-table-row">
                      <TableCell className="font-medium">
                        {variant.id}
                      </TableCell>
                      <TableCell>{variant.skuCode}</TableCell>
                      <TableCell>{variant.sizeCode}</TableCell>
                      <TableCell>{variant.productName}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(variant.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(variant.costPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={statusBadgeClass(variant.status)}>
                          {statusLabel(variant.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openView(variant)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(variant)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm biến thể</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sản phẩm</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.productId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      productId: e.target.value,
                    }))
                  }
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Size</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.sizeId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      sizeId: e.target.value,
                    }))
                  }
                >
                  <option value="">Chọn size</option>
                  {sizes.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.code}
                    </option>
                  ))}
                </select>
                {sizesLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Đang tải sizes...
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={createForm.skuCode}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      skuCode: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: 1234"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value as VariantStatus,
                    }))
                  }
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm dừng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá</label>
                <Input
                  type="number"
                  value={createForm.price}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá vốn</label>
                <Input
                  type="number"
                  value={createForm.costPrice}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      costPrice: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {createSaving ? "Đang lưu..." : "Thêm biến thể"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa biến thể</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sản phẩm</label>
                <Input
                  value={
                    resolveProductName(editForm.productId) || editForm.productId
                  }
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Size</label>
                <Input
                  value={resolveSizeCode(editForm.sizeId) || editForm.sizeId}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={editForm.skuCode}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      skuCode: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: 1234"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      status: e.target.value as VariantStatus,
                    }))
                  }
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm dừng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá</label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá vốn</label>
                <Input
                  type="number"
                  value={editForm.costPrice}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      costPrice: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={editSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {editSaving ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết biến thể</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">ID</label>
                <Input value={viewForm.id} readOnly className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sản phẩm</label>
                <Input
                  value={viewForm.productName}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Size</label>
                <Input
                  value={viewForm.sizeCode}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">SKU</label>
                <Input value={viewForm.skuCode} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá</label>
                <Input value={viewForm.price} readOnly className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá vốn</label>
                <Input
                  value={viewForm.costPrice}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <Input
                  value={statusLabel(viewForm.status)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
