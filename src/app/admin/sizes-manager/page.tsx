"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Ruler, CheckCircle2, PauseCircle, Plus } from "lucide-react";
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
import type { Size, SizeStatus } from "@/types/size";
import { SizeDialog, type SizeDialogItem } from "@/components/admin/SizeDialog";

type SizeRow = {
  id: string;
  code: string;
  status: SizeStatus;
};

const mapSize = (s: Size): SizeRow => ({
  id: String(s.sizeId ?? 0),
  code: s.code ?? "",
  status: s.status ?? "ACTIVE",
});

const statusLabel = (status: SizeStatus) =>
  status === "ACTIVE" ? "Họat động" : "Tạm dừng";

const statusBadgeClass = (status: SizeStatus) =>
  status === "ACTIVE"
    ? "admin-badge admin-badge-active"
    : "admin-badge admin-badge-inactive";

export default function SizesManagerPage() {
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create">("create");

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/sizes", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as unknown;

        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Load sizes failed");
        }

        setSizes(data.map(mapSize));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load sizes failed";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const filteredSizes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sizes;
    return sizes.filter((s) => s.code.toLowerCase().includes(q));
  }, [sizes, searchQuery]);

  const activeCount = sizes.filter((s) => s.status === "ACTIVE").length;
  const inactiveCount = sizes.filter((s) => s.status === "INACTIVE").length;

  const handleCreate = () => {
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleSave = async (payload: Partial<SizeDialogItem>) => {
    const code = String(payload.code ?? "")
      .trim()
      .toUpperCase();
    const status = (payload.status ?? "ACTIVE") as SizeStatus;

    if (!code) {
      toast.error("Vui lòng nhập mã size");
      return;
    }
    if (sizes.some((s) => s.code.toUpperCase() === code)) {
      toast.error(`Mã size "${code}" đã tồn tại`);
      return;
    }

    try {
      const res = await fetch("/api/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, status }),
      });
      const data = (await res.json().catch(() => null)) as unknown;

      const message =
        data && typeof data === "object" && "message" in data
          ? String((data as { message?: unknown }).message ?? "")
          : "";

      if (!res.ok || !data) {
        throw new Error(message || "Create size failed");
      }

      const created = mapSize(data as Size);
      setSizes((prev) => [created, ...prev]);
      toast.success(`Đã thêm size "${created.code}"`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create size failed";
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sizes</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách size sản phẩm
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm size
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ruler className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sizes.length}</p>
                <p className="text-sm text-muted-foreground">Tổng sizes</p>
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
                <p className="text-2xl font-bold">{inactiveCount}</p>
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
                placeholder="Tìm kiếm size..."
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
                  <TableHead className="font-semibold">Mã size</TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải sizes...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-destructive"
                    >
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filteredSizes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy size nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSizes.map((size) => (
                    <TableRow key={size.id} className="admin-table-row">
                      <TableCell className="font-medium">{size.id}</TableCell>
                      <TableCell>{size.code}</TableCell>
                      <TableCell className="text-center">
                        <span className={statusBadgeClass(size.status)}>
                          {statusLabel(size.status)}
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

      <SizeDialog
        key={`${dialogMode}-new`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        mode={dialogMode}
      />
    </>
  );
}
