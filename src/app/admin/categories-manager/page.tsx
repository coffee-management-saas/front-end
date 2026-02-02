"use client";
import { useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, FolderTree } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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

// ✅ Inline type + mock data (không cần import nữa)
type CategoryStatus = "active" | "inactive";

type Category = {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
};

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Cà phê Việt Nam",
    description:
      "Các loại cà phê truyền thống Việt Nam như cà phê sữa đá, cà phê đen, bạc xỉu",
    productCount: 12,
    status: "active",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "2",
    name: "Espresso",
    description:
      "Các loại đồ uống từ espresso như Americano, Latte, Cappuccino, Mocha",
    productCount: 8,
    status: "active",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-18"),
  },
  {
    id: "3",
    name: "Trà",
    description: "Các loại trà thảo mộc, trà xanh, trà oolong, trà hoa",
    productCount: 15,
    status: "active",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "4",
    name: "Đá xay",
    description: "Các loại đồ uống đá xay như Frappuccino, Smoothie, sinh tố",
    productCount: 6,
    status: "active",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-25"),
  },
  {
    id: "5",
    name: "Bánh ngọt",
    description: "Bánh mì, croissant, bánh cookies và các loại bánh ngọt khác",
    productCount: 20,
    status: "active",
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-28"),
  },
  {
    id: "6",
    name: "Đồ uống mùa hè",
    description: "Các loại đồ uống giải nhiệt cho mùa hè",
    productCount: 0,
    status: "inactive",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">(
    "view",
  );

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q)
    );
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

  const confirmDelete = () => {
    if (selectedCategory) {
      setCategories(categories.filter((c) => c.id !== selectedCategory.id));
      toast.success(`Đã xóa danh mục "${selectedCategory.name}"`);
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleSave = (categoryData: Partial<Category>) => {
    if (dialogMode === "create") {
      const newCategory: Category = {
        id: String(Date.now()),
        name: categoryData.name || "",
        description: categoryData.description || "",
        productCount: 0,
        status: categoryData.status || "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCategories([...categories, newCategory]);
      toast.success(`Đã thêm danh mục "${newCategory.name}"`);
    } else if (dialogMode === "edit" && selectedCategory) {
      setCategories(
        categories.map((c) =>
          c.id === selectedCategory.id
            ? { ...c, ...categoryData, updatedAt: new Date() }
            : c,
        ),
      );
      toast.success(`Đã cập nhật danh mục "${categoryData.name}"`);
    }
  };

  return (
    <AdminLayout>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="admin-card p-5">
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

          <div className="admin-card p-5">
            <div className="flex items-center gap-4">
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

          <div className="admin-card p-5">
            <div className="flex items-center gap-4">
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
                  <TableHead className="font-semibold">Mô tả</TableHead>
                  <TableHead className="font-semibold text-center">
                    Sản phẩm
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCategories.length === 0 ? (
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
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {category.description}
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
    </AdminLayout>
  );
}
