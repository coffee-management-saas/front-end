"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Eye, Pencil, Plus, Search, Package } from "lucide-react";
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
import type { Product, ProductStatus } from "@/types/product";
import type {
  ProductCategory,
  ProductCategoriesResponse,
} from "@/types/catagories";
import {
  createProduct,
  getProductById,
  getProducts,
  updateProductById,
} from "@/services/product.service";

type ProductRow = {
  id: string;
  name: string;
  categoryId: number;
  categoryName: string;
  description: string | null;
  image: string | null;
  status: ProductStatus;
};

type ProductFormState = {
  name: string;
  categoryId: string;
  description: string;
  image: string;
  status: ProductStatus;
};

const mapProduct = (p: Product): ProductRow => ({
  id: String(p.id),
  name: p.name ?? "",
  categoryId: p.categoryId,
  categoryName: p.categoryName ?? "",
  description: p.description ?? null,
  image: p.image ?? null,
  status: p.status ?? "INACTIVE",
});

const createFormState = (product: Product): ProductFormState => ({
  name: product.name ?? "",
  categoryId: String(product.categoryId ?? ""),
  description: product.description ?? "",
  image: product.image ?? "",
  status: product.status ?? "INACTIVE",
});

const statusLabel = (status: ProductStatus) =>
  status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng";

const statusBadgeClass = (status: ProductStatus) =>
  status === "ACTIVE"
    ? "admin-badge admin-badge-active"
    : "admin-badge admin-badge-inactive";

export default function ProductsManagerPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null,
  );

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<ProductFormState | null>(null);
  const [editMode, setEditMode] = useState<"create" | "edit">("edit");

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/categories?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = (await res
          .json()
          .catch(() => null)) as ProductCategoriesResponse | null;

        if (!res.ok || !data || data.code !== 200) {
          throw new Error(data?.message || "Load categories failed");
        }

        const active = (data.data ?? []).filter(
          (c) => c.status?.toUpperCase() !== "DELETED",
        );
        setCategories(active);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load categories failed";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const filterCategoryId = categoryFilter
        ? Number(categoryFilter)
        : undefined;

      const data = await getProducts({
        page: 0,
        size: 200,
        categoryId:
          typeof filterCategoryId === "number" &&
          Number.isFinite(filterCategoryId)
            ? filterCategoryId
            : undefined,
      });

      if (!data || data.code !== 200) {
        throw new Error(data?.message || "Load products failed");
      }

      const items = (data.data ?? []).map(mapProduct);
      setProducts(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load products failed";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const handleView = async (product: ProductRow) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewProduct(null);
    try {
      const data = await getProductById(product.id);
      setViewProduct(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load product failed";
      toast.error(msg);
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEdit = async (product: ProductRow) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
    setEditLoading(true);
    setEditForm(null);
    setEditMode("edit");
    try {
      const data = await getProductById(product.id);
      setEditForm(createFormState(data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load product failed";
      toast.error(msg);
      setEditDialogOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setEditMode("create");
    setEditForm({
      name: "",
      categoryId: "",
      description: "",
      image: "",
      status: "ACTIVE",
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editForm) return;

    const rawCategoryId = editForm.categoryId.trim();
    const categoryId = Number(rawCategoryId);
    if (!rawCategoryId || !Number.isFinite(categoryId) || categoryId <= 0) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      categoryId,
      description: editForm.description.trim() || null,
      image: editForm.image.trim() || null,
      status: editForm.status,
    };

    setEditSaving(true);
    try {
      if (editMode === "create") {
        const data = await createProduct(payload);
        const newRow = mapProduct(data);
        const filterId = categoryFilter ? Number(categoryFilter) : undefined;
        const matchesFilter =
          !filterId || Number.isNaN(filterId) || newRow.categoryId === filterId;

        if (matchesFilter) {
          setProducts((prev) => [newRow, ...prev]);
        }

        toast.success(`Đã thêm sản phẩm "${data.name}"`);
      } else {
        const data = await updateProductById(
          selectedProduct?.id ?? "",
          payload,
        );
        const updatedRow = mapProduct(data);
        setProducts((prev) =>
          prev.map((p) => (p.id === updatedRow.id ? updatedRow : p)),
        );
        toast.success(`Đã cập nhật sản phẩm "${data.name}"`);
      }

      setEditDialogOpen(false);
      setSelectedProduct(null);
      setEditForm(null);
      setEditMode("edit");

      void fetchProducts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save product failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const inactiveCount = products.filter((p) => p.status === "INACTIVE").length;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sản phẩm</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các sản phẩm của quán
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4 ">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4 ">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveCount}</p>
                <p className="text-sm text-muted-foreground">Tạm ngưng</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Danh mục</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Sản phẩm</TableHead>
                  <TableHead className="font-semibold text-center">
                    Ảnh
                  </TableHead>
                  <TableHead className="font-semibold">Danh mục</TableHead>
                  <TableHead className="font-semibold">Miêu tả</TableHead>
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
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải sản phẩm...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-destructive"
                    >
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="admin-table-row">
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover mx-auto"
                            loading="lazy"
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categoryName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={statusBadgeClass(product.status)}>
                          {statusLabel(product.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(product)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết sản phẩm</DialogTitle>
          </DialogHeader>

          {viewLoading || !viewProduct ? (
            <div className="text-sm text-muted-foreground">
              Đang tải dữ liệu sản phẩm...
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-start gap-4">
                {viewProduct.image ? (
                  <img
                    src={viewProduct.image}
                    alt={viewProduct.name}
                    className="h-20 w-20 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    —
                  </div>
                )}
                <div className="grid gap-1">
                  <p className="text-lg font-semibold">{viewProduct.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Danh mục: {viewProduct.categoryName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <span className={statusBadgeClass(viewProduct.status)}>
                    {statusLabel(viewProduct.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mô tả</p>
                  <p className="font-medium">
                    {viewProduct.description || "—"}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode === "create" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}
            </DialogTitle>
          </DialogHeader>

          {editLoading || !editForm ? (
            <div className="text-sm text-muted-foreground">
              Đang tải dữ liệu sản phẩm...
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tên sản phẩm</label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Danh mục</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editForm.categoryId}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, categoryId: e.target.value } : prev,
                    )
                  }
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, status: e.target.value as ProductStatus }
                        : prev,
                    )
                  }
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Ảnh (URL)</label>
                <Input
                  value={editForm.image}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, image: e.target.value } : prev,
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Mô tả</label>
                <textarea
                  className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving}
            >
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={editSaving || editLoading}>
              {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
