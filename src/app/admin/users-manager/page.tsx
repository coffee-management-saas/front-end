"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Gem, Pencil, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
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
import {
  deleteCustomerById,
  getCustomerById,
  getCustomers,
  updateCustomerById,
} from "@/services/customer.service";
import type { CustomerDto, UpdateCustomerInput } from "@/types/customer";

type UiCustomerStatus = "active" | "inactive" | "deleted";

type CustomerRow = {
  id: number;
  username: string;
  email: string;
  fullname: string;
  phone: string;
  rankId?: string | number;
  status: UiCustomerStatus;
};

const mapStatus = (status?: string): UiCustomerStatus => {
  switch (
    String(status ?? "")
      .trim()
      .toUpperCase()
  ) {
    case "ACTIVE":
      return "active";
    case "INACTIVE":
      return "inactive";
    case "DELETED":
      return "deleted";
    default:
      return "inactive";
  }
};

const rankLabel = (rankId?: string | number) => {
  const n = typeof rankId === "number" ? rankId : Number(rankId);
  switch (n) {
    case 1:
      return "Đồng";
    case 2:
      return "Bạc";
    case 3:
      return "Vàng";
    case 4:
      return "Kim cương";
    default:
      return "—";
  }
};

const rankBadgeClass = (rankId?: string | number) => {
  const n = typeof rankId === "number" ? rankId : Number(rankId);
  switch (n) {
    case 1:
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground";
    case 2:
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700";
    case 3:
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800";
    case 4:
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-sky-100 text-sky-800";
    default:
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground";
  }
};

const statusBadgeClass = (s: UiCustomerStatus) => {
  switch (s) {
    case "active":
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-success/10 text-success";
    case "inactive":
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground";
    case "deleted":
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive";
    default:
      return "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground";
  }
};

const statusLabel = (s: UiCustomerStatus) => {
  switch (s) {
    case "active":
      return "Hoạt động";
    case "inactive":
      return "Tạm khóa";
    case "deleted":
      return "Đã xóa";
    default:
      return s;
  }
};

const formatDate = (input?: string) => {
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

const toDateInputValue = (input?: string) => {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
};

const toRow = (c: CustomerDto): CustomerRow => ({
  id: c.customerId,
  username: c.username,
  fullname: c.fullname,
  email: c.email,
  phone: c.phone,
  rankId: c.rankId,
  status: mapStatus(c.status),
});

export default function UsersManagerPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<CustomerDto | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editCustomer, setEditCustomer] = useState<CustomerDto | null>(null);
  const [editForm, setEditForm] = useState<UpdateCustomerInput | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await getCustomers({ page: 0, size: 100 });
        const rows = Array.isArray(res.data) ? res.data.map(toRow) : [];
        if (!alive) return;
        setCustomers(rows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load customers failed";
        if (!alive) return;
        setLoadError(msg);
        toast.error(msg);
      } finally {
        if (!alive) return;
        setIsLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = [
        c.username,
        c.fullname,
        c.phone,
        String(c.id),
        String(c.rankId ?? ""),
        rankLabel(c.rankId),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [customers, searchQuery]);

  const activeCount = useMemo(
    () => customers.filter((c) => c.status === "active").length,
    [customers],
  );

  const diamondCount = useMemo(
    () => customers.filter((c) => Number(c.rankId) === 4).length,
    [customers],
  );

  const handleView = useCallback(async (id: number) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewCustomer(null);
    try {
      const data = await getCustomerById(id);
      setViewCustomer(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load customer failed";
      toast.error(msg);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const handleEdit = useCallback(async (id: number) => {
    setEditDialogOpen(true);
    setEditLoading(true);
    setEditSaving(false);
    setEditCustomerId(id);
    setEditCustomer(null);
    setEditForm(null);

    try {
      const data = await getCustomerById(id);
      setEditCustomer(data);
      setEditForm({
        fullname: String(data.fullname ?? "").trim(),
        phone: String(data.phone ?? "").trim(),
        email: String(data.email ?? "").trim(),
        address: String(data.address ?? "").trim(),
        dob: toDateInputValue(data.dob),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load customer failed";
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const handleEditSave = useCallback(async () => {
    if (editSaving) return;
    if (editCustomerId === null || !editForm) return;

    const payload: UpdateCustomerInput = {
      fullname: editForm.fullname.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      address: editForm.address.trim(),
      dob: editForm.dob.trim(),
    };

    if (
      !payload.fullname ||
      !payload.phone ||
      !payload.email ||
      !payload.address ||
      !payload.dob
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setEditSaving(true);
    try {
      const updated = await updateCustomerById(editCustomerId, payload);
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.customerId ? toRow(updated) : c)),
      );
      setEditCustomer(updated);
      setViewCustomer((prev) =>
        prev && prev.customerId === updated.customerId ? updated : prev,
      );
      toast.success("Cập nhật khách hàng thành công");
      setEditDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update customer failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  }, [editCustomerId, editForm, editSaving]);

  const openDelete = useCallback((c: CustomerRow) => {
    setDeleteTarget(c);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteSaving) return;
    if (!deleteTarget) return;

    setDeleteSaving(true);
    try {
      await deleteCustomerById(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setViewCustomer((prev) =>
        prev && prev.customerId === deleteTarget.id ? null : prev,
      );
      if (viewCustomer?.customerId === deleteTarget.id) {
        setViewDialogOpen(false);
      }
      if (editCustomerId === deleteTarget.id) {
        setEditDialogOpen(false);
        setEditCustomerId(null);
        setEditCustomer(null);
        setEditForm(null);
      }
      toast.success("Xóa khách hàng thành công");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete customer failed";
      toast.error(msg);
    } finally {
      setDeleteSaving(false);
    }
  }, [deleteSaving, deleteTarget, editCustomerId, viewCustomer]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Khách hàng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách khách hàng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <Gem className="w-6 h-6 text-sky-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{diamondCount}</p>
              <p className="text-sm text-muted-foreground">Tổng TV Kim cương</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, username, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <Table containerClassName="overflow-x-hidden">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Username</TableHead>
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold text-center">
                Số điện thoại
              </TableHead>
              <TableHead className="font-semibold text-center">Hạng</TableHead>
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
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  Đang tải khách hàng...
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
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có khách hàng phù hợp
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => (
                <TableRow key={c.id} className="admin-table-row">
                  <TableCell className="font-medium">{c.username}</TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {c.fullname}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {c.email}
                  </TableCell>

                  <TableCell className="text-center">{c.phone}</TableCell>
                  <TableCell className="text-center">
                    <span className={rankBadgeClass(c.rankId)}>
                      {rankLabel(c.rankId)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={statusBadgeClass(c.status)}>
                      {statusLabel(c.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleView(c.id)}
                        aria-label={`Xem khách hàng ${c.username}`}
                      >
                        <Eye />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(c.id)}
                        aria-label={`Sửa khách hàng ${c.username}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDelete(c)}
                        aria-label={`Xóa khách hàng ${c.username}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg p-4">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <div className="text-sm text-muted-foreground">
              Đang tải chi tiết...
            </div>
          ) : viewCustomer ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Username
                </div>
                <div className="mt-1 font-semibold break-words">
                  {viewCustomer.username}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Họ tên
                </div>
                <div className="mt-1 font-semibold break-words">
                  {viewCustomer.fullname}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Email
                </div>
                <div
                  className="mt-1 font-semibold break-words"
                  title={viewCustomer.email}
                >
                  {viewCustomer.email}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Số điện thoại
                </div>
                <div className="mt-1 font-semibold">{viewCustomer.phone}</div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Địa chỉ
                </div>
                <div className="mt-1 font-semibold break-words">
                  {viewCustomer.address || "—"}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Hạng
                </div>
                <div className="mt-1">
                  <span className={rankBadgeClass(viewCustomer.rankId)}>
                    {rankLabel(viewCustomer.rankId)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Trạng thái
                </div>
                <div className="mt-1">
                  {(() => {
                    const s = mapStatus(viewCustomer.status);
                    return (
                      <span className={statusBadgeClass(s)}>
                        {statusLabel(s)}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Ngày sinh
                </div>
                <div className="mt-1 font-semibold">
                  {formatDate(viewCustomer.dob)}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Tạo lúc
                </div>
                <div className="mt-1 font-semibold">
                  {formatDateTime(viewCustomer.createdAt)}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  Cập nhật
                </div>
                <div className="mt-1 font-semibold">
                  {formatDateTime(viewCustomer.updatedAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Không có dữ liệu
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditCustomerId(null);
            setEditCustomer(null);
            setEditForm(null);
            setEditSaving(false);
            setEditLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg p-4">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
          </DialogHeader>

          {editLoading ? (
            <div className="text-sm text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : !editForm ? (
            <div className="text-sm text-muted-foreground">
              Không có dữ liệu
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Họ tên
                </div>
                <Input
                  value={editForm.fullname}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, fullname: e.target.value } : prev,
                    )
                  }
                  placeholder="Nhập họ tên"
                  className="bg-background"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Số điện thoại
                </div>
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, phone: e.target.value } : prev,
                    )
                  }
                  placeholder="Nhập số điện thoại"
                  className="bg-background"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Email
                </div>
                <Input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, email: e.target.value } : prev,
                    )
                  }
                  placeholder="Nhập email"
                  className="bg-background"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Địa chỉ
                </div>
                <Input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, address: e.target.value } : prev,
                    )
                  }
                  placeholder="Nhập địa chỉ"
                  className="bg-background"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Ngày sinh
                </div>
                <Input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, dob: e.target.value } : prev,
                    )
                  }
                  className="bg-background"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Username
                </div>
                <Input
                  value={String(editCustomer?.username ?? "")}
                  disabled
                  className="bg-muted/30"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleEditSave}
              disabled={editSaving || editLoading || !editForm}
            >
              {editSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
            setDeleteSaving(false);
          }
        }}
        onConfirm={handleDeleteConfirm}
        itemName={
          deleteTarget
            ? deleteTarget.fullname || deleteTarget.username
            : undefined
        }
        title="Xác nhận xóa khách hàng"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa "${deleteTarget.fullname || deleteTarget.username}"?`
            : "Bạn có chắc chắn muốn xóa khách hàng này?"
        }
        confirmLabel={deleteSaving ? "Đang xóa..." : "Xóa"}
      />
    </div>
  );
}
