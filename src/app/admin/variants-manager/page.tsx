"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  CheckCircle2,
  ChevronDown,
  Filter,
  Plus,
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

const mapVariant = (v: Variant): VariantRow => ({
  id: String(v.id ?? 0),
  skuCode: v.skuCode ?? "",
  sizeCode: v.sizeCode ?? "",
  productName: v.productName ?? "",
  price: Number(v.price ?? 0),
  costPrice: Number(v.costPrice ?? 0),
  status: v.status ?? "INACTIVE",
});

const statusLabel = (status: VariantStatus) =>
  status === "ACTIVE" ? "�ang ho?t d?ng" : "T?m d?ng";

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
        setProducts(items);

        if (!selectedProduct && items.length > 0) {
          setSelectedProduct(items[0]);
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

  const handleCreate = async () => {
    if (!createForm.productId || !createForm.sizeId || !createForm.skuCode) {
      toast.error("Vui l�ng nh?p d? th�ng tin b?t bu?c");
      return;
    }

    const price = Number(createForm.price);
    const costPrice = Number(createForm.costPrice);
    if (!Number.isFinite(price) || !Number.isFinite(costPrice)) {
      toast.error("Gi� ho?c gi� v?n kh�ng h?p l?");
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

      toast.success("�� t?o bi?n th?");
      setCreateOpen(false);
      await fetchVariants();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create variant failed";
      toast.error(msg);
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Variants</h1>
            <p className="text-muted-foreground mt-1">
              Ch?n s?n ph?m d? xem danh s�ch bi?n th?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  B? l?c
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-3" align="end">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      S?n ph?m
                    </label>
                    <div className="grid gap-2">
                      <Input
                        placeholder="T�m s?n ph?m..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="bg-background h-9"
                      />
                      <div className="max-h-[180px] overflow-y-auto rounded-md border border-border">
                        {productsLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            �ang t?i s?n ph?m...
                          </div>
                        ) : productsError ? (
                          <div className="p-2 text-sm text-destructive">
                            {productsError}
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Kh�ng t�m th?y s?n ph?m
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
                              <div className="text-xs text-muted-foreground">
                                ID: {p.id}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Tr?ng th�i
                    </label>
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">T?t c?</option>
                      <option value="ACTIVE">�ang ho?t d?ng</option>
                      <option value="INACTIVE">T?m d?ng</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterOpen(false)}
                    >
                      ��ng
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
                      L?c
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={fetchVariants}
              className="bg-primary hover:bg-primary/90"
              disabled={!selectedProduct}
              size="sm"
            >
              L�m m?i
            </Button>

            <Button
              onClick={openCreate}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Th�m bi?n th?
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
                <p className="text-2xl font-bold">{variants.length}</p>
                <p className="text-sm text-muted-foreground">T?ng variants</p>
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
                <p className="text-sm text-muted-foreground">�ang ho?t d?ng</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="T�m theo SKU, size, ho?c t�n s?n ph?m..."
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
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Size</TableHead>
                  <TableHead className="font-semibold">S?n ph?m</TableHead>
                  <TableHead className="font-semibold text-right">
                    Gi�
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Gi� v?n
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Tr?ng th�i
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
                      �ang t?i variants...
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
                ) : !selectedProduct ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Ch?n s?n ph?m d? xem bi?n th?
                    </TableCell>
                  </TableRow>
                ) : filteredVariants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Kh�ng t�m th?y variant n�o
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
            <DialogTitle>Th�m bi?n th?</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">S?n ph?m</label>
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
                  <option value="">Ch?n s?n ph?m</option>
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
                  <option value="">Ch?n size</option>
                  {sizes.map((s) => (
                    <option key={s.sizeId} value={String(s.sizeId)}>
                      {s.code}
                    </option>
                  ))}
                </select>
                {sizesLoading ? (
                  <p className="text-xs text-muted-foreground">
                    �ang t?i sizes...
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
                  placeholder="V� d?: 1234"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Tr?ng th�i</label>
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
                  <option value="ACTIVE">�ang ho?t d?ng</option>
                  <option value="INACTIVE">T?m d?ng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Gi�</label>
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
                <label className="text-sm font-medium">Gi� v?n</label>
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
              H?y
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {createSaving ? "�ang luu..." : "Th�m bi?n th?"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
