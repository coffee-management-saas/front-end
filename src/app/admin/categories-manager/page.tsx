"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, FolderTree } from "lucide-react";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
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
import { toast } from "sonner";
import type {
  ProductCategory,
  ProductCategoriesResponse,
  Category,
} from "@/types/catagories";
import type { ProductsResponse } from "@/types/product";

type CategoryStatus = "active" | "inactive";
type CreateCategoryResponse = {
  code: number;
  message: string;
  data: ProductCategory | null;
};
type UpdateCategoryResponse = CreateCategoryResponse;

const mapStatus = (status?: string): CategoryStatus =>
  status?.toUpperCase() === "ACTIVE" ? "active" : "inactive";

const mapCategory = (c: ProductCategory): Category => ({
  id: String(c.id),
  name: c.name ?? "",
  productCount: 0,
  status: mapStatus(c.status),
  createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
});
export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">(
    "view",
  );

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "100" });
        const res = await fetch(`/api/categories?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as ProductCategoriesResponse;

        if (!res.ok || data?.code !== 200) {
          throw new Error(data?.message || "Load categories failed");
        }

        const rawItems = data?.data ?? [];
        const deleted = rawItems.filter(
          (c) => c.status?.toUpperCase() === "DELETED",
        ).length;
        setDeletedCount(deleted);

        const items = rawItems
          .filter((c) => c.status?.toUpperCase() !== "DELETED")
          .map(mapCategory);

        const counts = await Promise.all(
          items.map(async (c) => {
            try {
              const qs = new URLSearchParams({
                page: "0",
                size: "1",
                categoryId: c.id,
              });
              const res = await fetch(`/api/products?${qs.toString()}`, {
                cache: "no-store",
              });
              const pdata = (await res.json()) as ProductsResponse;

              if (!res.ok || pdata?.code !== 200) return 0;
              return pdata?.meta?.totalElements ?? pdata?.data?.length ?? 0;
            } catch {
              return 0;
            }
          }),
        );

        const withCounts = items.map((c, i) => ({
          ...c,
          productCount: counts[i] ?? 0,
        }));

        setCategories(withCounts);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load categories failed";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return cat.name.toLowerCase().includes(q);
  });

  const handleView = (category: Category) => {
    setSelectedCategory(category);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Delete category failed");
      }

      setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id));
      setDeletedCount((prev) => prev + 1);
      toast.success(`Đã xóa danh mục "${selectedCategory.name}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete category failed";
      toast.error(msg);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleSave = async (categoryData: Partial<Category>) => {
    if (dialogMode === "create") {
      try {
        const status =
          categoryData.status === "inactive" ? "INACTIVE" : "ACTIVE";
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryData.name ?? "",
            status,
          }),
        });
        const data = (await res
          .json()
          .catch(() => null)) as CreateCategoryResponse | null;

        if (!res.ok || !data || data.code < 200 || data.code >= 300) {
          throw new Error(data?.message || "Create category failed");
        }

        if (!data.data) {
          throw new Error("Create category failed (missing data)");
        }

        const newCategory = mapCategory(data.data);
        setCategories((prev) => [...prev, newCategory]);
        toast.success(`Đã thêm danh mục "${newCategory.name}"`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Create category failed";
        toast.error(msg);
      }
    } else if (dialogMode === "edit" && selectedCategory) {
      try {
        const status =
          categoryData.status === "inactive" ? "INACTIVE" : "ACTIVE";
        const res = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryData.name ?? selectedCategory.name,
            status,
          }),
        });
        const data = (await res
          .json()
          .catch(() => null)) as UpdateCategoryResponse | null;

        if (!res.ok || !data || data.code < 200 || data.code >= 300) {
          throw new Error(data?.message || "Update category failed");
        }

        if (!data.data) {
          throw new Error("Update category failed (missing data)");
        }

        const updated = mapCategory(data.data);
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        );
        toast.success(`Đã cập nhật danh mục "${updated.name}"`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Update category failed";
        toast.error(msg);
      }
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Danh mục</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các danh mục sản phẩm của quán
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Tổng danh mục</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4 ">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.filter((c) => c.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4 ">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, c) => sum + c.productCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deletedCount}</p>
                <p className="text-sm text-muted-foreground">Danh mục đã xóa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh mục..."
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
                  <TableHead className="font-semibold">Tên danh mục</TableHead>

                  <TableHead className="font-semibold text-center">
                    Sản phẩm
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold">Ngày tạo</TableHead>
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
                      Đang tải danh mục...
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
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id} className="admin-table-row">
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>

                      <TableCell className="text-center">
                        {category.productCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`admin-badge ${
                            category.status === "active"
                              ? "admin-badge-active"
                              : "admin-badge-inactive"
                          }`}
                        >
                          {category.status === "active"
                            ? "Hoạt động"
                            : "Tạm dừng"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {category.createdAt.toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(category)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
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

      <CategoryDialog
        key={`${dialogMode}-${selectedCategory?.id ?? "new"}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSave={handleSave}
        mode={dialogMode}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        categoryName={selectedCategory?.name || ""}
      />
    </>
  );
}
