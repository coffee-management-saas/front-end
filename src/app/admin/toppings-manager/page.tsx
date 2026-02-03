"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { ToppingDialog } from "@/components/admin/ToppingDialog";
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
import type { ToppingDto, ToppingsResponse } from "@/types/topping";
import type { ToppingDialogItem } from "@/components/admin/ToppingDialog";

type ToppingStatus = "active" | "inactive";
type ToppingApiResponse = {
  code?: number;
  message?: string;
  data?: ToppingDto | null;
};
type ToppingGetResponse = {
  code?: number;
  message?: string;
  data?: ToppingDto | null;
};

const mapStatus = (status?: string): ToppingStatus =>
  status?.toUpperCase() === "ACTIVE" ? "active" : "inactive";

const mapTopping = (t: ToppingDto): ToppingDialogItem => ({
  id: String(t.id),
  name: t.name ?? "",
  price: Number(t.price ?? 0),
  status: mapStatus(t.status),
});

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")} VND`;

export default function ToppingsManager() {
  const [toppings, setToppings] = useState<ToppingDialogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTopping, setSelectedTopping] =
    useState<ToppingDialogItem | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">(
    "view",
  );

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/products/toppings?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as ToppingsResponse;

        if (!res.ok || data?.code !== 200) {
          throw new Error(data?.message || "Load toppings failed");
        }

        const items = (data?.data ?? []).map(mapTopping);
        setToppings(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load toppings failed";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const filteredToppings = toppings.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q);
  });


  const handleView = async (topping: ToppingDialogItem) => {
    setDialogMode("view");
    setDialogOpen(true);
    setSelectedTopping(topping);

    try {
      const res = await fetch(`/api/products/toppings/${topping.id}`, {
        cache: "no-store",
      });
      const data = (await res
        .json()
        .catch(() => null)) as ToppingGetResponse | null;

      if (!res.ok || !data || !data.data || (data.code ?? 0) >= 400) {
        throw new Error(data?.message || "Get topping failed");
      }

      setSelectedTopping(mapTopping(data.data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Get topping failed";
      toast.error(msg);
    }
  };

  const handleEdit = (topping: ToppingDialogItem) => {
    setSelectedTopping(topping);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTopping(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleDelete = (topping: ToppingDialogItem) => {
    setSelectedTopping(topping);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTopping) return;

    try {
      const res = await fetch(`/api/products/toppings/${selectedTopping.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Delete topping failed");
      }

      setToppings((prev) => prev.filter((c) => c.id !== selectedTopping.id));
      toast.success(`Đã xóa topping "${selectedTopping.name}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete topping failed";
      toast.error(msg);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTopping(null);
    }
  };

  const handleSave = async (toppingData: Partial<ToppingDialogItem>) => {
    if (dialogMode === "create") {
      try {
        const status =
          toppingData.status === "inactive" ? "INACTIVE" : "ACTIVE";
        const res = await fetch("/api/products/toppings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: toppingData.name ?? "",
            price: Number(toppingData.price ?? 0),
            status,
          }),
        });
        const data = (await res
          .json()
          .catch(() => null)) as ToppingApiResponse | null;

        if (!res.ok || !data || !data.data || (data.code ?? 0) >= 400) {
          throw new Error(data?.message || "Create topping failed");
        }

        const newTopping = mapTopping(data.data);
        setToppings((prev) => [...prev, newTopping]);
        toast.success(`Đã thêm topping "${newTopping.name}"`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Create topping failed";
        toast.error(msg);
      }
    } else if (dialogMode === "edit" && selectedTopping) {
      try {
        const status =
          toppingData.status === "inactive" ? "INACTIVE" : "ACTIVE";
        const res = await fetch(
          `/api/products/toppings/${selectedTopping.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: toppingData.name ?? selectedTopping.name,
              price: Number(toppingData.price ?? selectedTopping.price),
              status,
            }),
          },
        );
        const data = (await res
          .json()
          .catch(() => null)) as ToppingApiResponse | null;

        if (!res.ok || !data || !data.data || (data.code ?? 0) >= 400) {
          throw new Error(data?.message || "Update topping failed");
        }

        const updated = mapTopping(data.data);
        setToppings((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        );
        toast.success(`Đã cập nhật topping "${updated.name}"`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Update topping failed";
        toast.error(msg);
      }
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Toppings</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách topping kèm theo sản phẩm
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm topping
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{toppings.length}</p>
                <p className="text-sm text-muted-foreground">Tổng topping</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {toppings.filter((c) => c.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Đang họat động</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
                <PauseCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {toppings.filter((c) => c.status === "inactive").length}
                </p>
                <p className="text-sm text-muted-foreground">Tạm dừng</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm topping..."
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
                  <TableHead className="font-semibold">Tên topping</TableHead>
                  <TableHead className="font-semibold text-center">Giá</TableHead>
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
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải topping...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-destructive"
                    >
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filteredToppings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy topping nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredToppings.map((topping) => (
                    <TableRow key={topping.id} className="admin-table-row">
                      <TableCell className="font-medium">
                        {topping.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatPrice(topping.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`admin-badge ${
                            topping.status === "active"
                              ? "admin-badge-active"
                              : "admin-badge-inactive"
                          }`}
                        >
                          {topping.status === "active"
                            ? "Hoạt động"
                            : "Tạm dừng"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(topping)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(topping)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(topping)}
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

      <ToppingDialog
        key={`${dialogMode}-${selectedTopping?.id ?? "new"}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        topping={selectedTopping}
        onSave={handleSave}
        mode={dialogMode}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedTopping?.name || ""}
        title="Xác nhận xóa topping"
        confirmLabel="Xóa topping"
      />
    </>
  );
}
