"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Plus,
  X,
  Pencil,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type {
  StockCheckSession,
  StockCheckStartResponse,
  StockCheckUpdateResponse,
  StockCheckApproveResponse,
  StockChecksResponse,
} from "@/types/stock";
import type { IngredientDto } from "@/types/ingredient";

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
};

const statusLabel = (status?: string | null) =>
  status === "ACTIVE"
    ? "Hoạt động"
    : status === "INACTIVE"
      ? "Tạm dừng"
      : "Đã xóa";

const statusBadgeClass = (status?: string | null) =>
  status === "ACTIVE"
    ? "admin-badge admin-badge-active"
    : "admin-badge admin-badge-inactive";

export default function StockManagerPage() {
  const [sessions, setSessions] = useState<StockCheckSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<StockCheckSession | null>(null);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [updateDetails, setUpdateDetails] = useState<
    { ingredientId: number; actualQuantity: number; reason: string }[]
  >([]);

  const [startOpen, setStartOpen] = useState(false);
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [startForm, setStartForm] = useState({
    code: "",
    note: "",
    ingredientIds: [] as number[],
  });
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | "">(
    "",
  );

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "100" });
        const res = await fetch(`/api/stock?${qs.toString()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await parseJsonSafely<StockChecksResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load stock checks failed");
        }

        setSessions(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load stock checks failed";
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
          credentials: "same-origin",
        });
        const data = await parseJsonSafely<{
          code?: number;
          message?: string;
          data?: unknown;
        }>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load ingredients failed");
        }

        const list = Array.isArray((data as { data?: unknown }).data)
          ? ((data as { data?: IngredientDto[] }).data ?? [])
          : [];
        setIngredients(list);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load ingredients failed";
        toast.error(msg);
      } finally {
        setIngredientsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!updateOpen || !selectedSession) return;
    setUpdateDetails(
      (selectedSession.details ?? []).map((detail) => ({
        ingredientId: detail.ingredientId,
        actualQuantity: Number(detail.actualQuantity ?? 0),
        reason: detail.reason ?? "",
      })),
    );
  }, [updateOpen, selectedSession]);

  useEffect(() => {
    if (!approveOpen) {
      setApproveNote("");
    }
  }, [approveOpen]);

  const filteredSessions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return sessions;
    return sessions.filter((item) => {
      const detailNames = (item.details ?? [])
        .map((d) => d.ingredientName)
        .join(" ");
      return [item.code, item.createdByName, detailNames]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [sessions, searchQuery]);

  const approvedCount = useMemo(
    () => sessions.filter((item) => item.isApproved).length,
    [sessions],
  );

  const activeCount = useMemo(
    () => sessions.filter((item) => item.inventoryStatus === "ACTIVE").length,
    [sessions],
  );

  const selectedIngredients = useMemo(
    () =>
      startForm.ingredientIds
        .map((id) => ingredients.find((i) => i.id === id))
        .filter(Boolean) as IngredientDto[],
    [startForm.ingredientIds, ingredients],
  );

  const handleAddIngredient = () => {
    if (selectedIngredientId === "") return;
    const id = Number(selectedIngredientId);
    if (!Number.isFinite(id) || id <= 0) return;
    setStartForm((prev) => {
      if (prev.ingredientIds.includes(id)) return prev;
      return { ...prev, ingredientIds: [...prev.ingredientIds, id] };
    });
    setSelectedIngredientId("");
  };

  const handleRemoveIngredient = (id: number) => {
    setStartForm((prev) => ({
      ...prev,
      ingredientIds: prev.ingredientIds.filter((item) => item !== id),
    }));
  };

  const handleStart = async () => {
    const code = startForm.code.trim();
    const ids = startForm.ingredientIds;

    if (!code) {
      toast.error("Vui lòng nhập mã phiên kiểm kho");
      return;
    }

    if (ids.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nguyên liệu");

      return;
    }

    setStartSubmitting(true);
    try {
      const res = await fetch("/api/stock/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          note: startForm.note.trim(),
          ingredientIds: ids,
        }),
      });
      const data = await parseJsonSafely<StockCheckStartResponse>(res);

      if (
        !res.ok ||
        !data ||
        (data.code ?? 0) < 200 ||
        (data.code ?? 0) >= 300
      ) {
        throw new Error(data?.message || "Start stock check failed");
      }

      setSessions((prev) => [data.data, ...prev].filter(Boolean));
      setStartOpen(false);
      setStartForm({ code: "", note: "", ingredientIds: [] });
      setSelectedIngredientId("");
      toast.success("Đã bắt đầu phiên kiểm kho");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Start stock check failed";
      toast.error(msg);
    } finally {
      setStartSubmitting(false);
    }
  };

  const handleUpdateCounts = async () => {
    if (!selectedSession) return;
    const payload = {
      sessionId: Number(selectedSession.id),
      details: updateDetails.map((d) => ({
        ingredientId: d.ingredientId,
        actualQuantity: Number(d.actualQuantity ?? 0),
        reason: d.reason.trim() || null,
      })),
    };

    if (!payload.sessionId || payload.sessionId <= 0) {
      toast.error("SessionId không hợp lệ");
      return;
    }

    if (payload.details.length === 0) {
      toast.error("Chưa có chi tiết cập nhật");
      return;
    }

    setUpdateSubmitting(true);
    try {
      const res = await fetch("/api/stock/update-count", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely<StockCheckUpdateResponse>(res);

      if (
        !res.ok ||
        !data ||
        (data.code ?? 0) < 200 ||
        (data.code ?? 0) >= 300
      ) {
        throw new Error(data?.message || "Update stock counts failed");
      }

      setSessions((prev) =>
        prev
          .map((s) => (s.id === data.data.id ? data.data : s))
          .filter(Boolean),
      );
      setSelectedSession(data.data);
      setUpdateOpen(false);
      toast.success("Đã cập nhật số lượng");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update stock counts failed";
      toast.error(msg);
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSession) return;

    setApproveSubmitting(true);
    try {
      const res = await fetch("/api/stock/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: Number(selectedSession.id),
          isApproved: true,
          note: approveNote.trim(),
        }),
      });
      const data = await parseJsonSafely<StockCheckApproveResponse>(res);

      if (
        !res.ok ||
        !data ||
        (data.code ?? 0) < 200 ||
        (data.code ?? 0) >= 300
      ) {
        throw new Error(data?.message || "Approve stock check failed");
      }

      setSessions((prev) =>
        prev
          .map((s) => (s.id === data.data.id ? data.data : s))
          .filter(Boolean),
      );
      setSelectedSession(data.data);
      setApproveOpen(false);
      toast.success("Đã duyệt phiên kiểm kho");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Approve stock check failed";
      toast.error(msg);
    } finally {
      setApproveSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Kiểm tra tồn kho
            </h1>
            <p className="text-muted-foreground mt-1">
              Danh sách phiên kiểm tra tồn kho và chi tiết lệch.
            </p>
          </div>
          <Button
            onClick={() => setStartOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            Bắt đầu kiểm kho
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng phiên</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-5 bg-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã, người tạo, nguyên liệu..."
                className="pl-10 bg-background"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Mã</TableHead>
                  <TableHead className="font-semibold text-center">
                    Hoàn thành
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Người tạo
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Đã duyệt
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Chi tiết
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
                      Đang tải dữ liệu...
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
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không có phiên kiểm tra nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((item) => (
                    <TableRow key={item.id} className="admin-table-row">
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell className="text-center">
                        {formatDateTime(item.completedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={statusBadgeClass(item.inventoryStatus)}
                        >
                          {statusLabel(item.inventoryStatus)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.createdByName ?? "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            item.isApproved
                              ? "admin-badge admin-badge-active"
                              : "admin-badge admin-badge-inactive"
                          }
                        >
                          {item.isApproved ? "Đã duyệt" : "Chưa duyệt"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedSession(item);
                              setViewOpen(true);
                            }}
                            aria-label="Xem chi tiet"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setSelectedSession(item);
                              setUpdateOpen(true);
                            }}
                            aria-label="Cập nhật số lượng"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              item.isApproved
                                ? "text-emerald-600 cursor-not-allowed"
                                : "text-muted-foreground hover:text-emerald-600"
                            }`}
                            onClick={() => {
                              if (item.isApproved) return;
                              setSelectedSession(item);
                              setApproveOpen(true);
                            }}
                            aria-label="Duyệt phiên"
                            title={item.isApproved ? "Đã duyệt" : "Duyệt phiên"}
                            disabled={item.isApproved}
                          >
                            <Check className="h-4 w-4" />
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
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setSelectedSession(null);
        }}
      >
        <DialogContent className="max-w-3xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Chi tiết phiên kiểm tra</DialogTitle>
            <DialogDescription>
              Thông tin phiên và danh sách lệch tồn kho.
            </DialogDescription>
          </DialogHeader>

          {selectedSession ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className="text-muted-foreground">
                  Mã
                  <div className="text-foreground font-medium">
                    {selectedSession.code}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Hoàn thành
                  <div className="text-foreground font-medium">
                    {formatDateTime(selectedSession.completedAt)}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Trạng thái
                  <div className="text-foreground font-medium">
                    {statusLabel(selectedSession.inventoryStatus)}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Người tạo
                  <div className="text-foreground font-medium">
                    {selectedSession.createdByName ?? "-"}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Đã duyệt
                  <div className="text-foreground font-medium">
                    {selectedSession.isApproved ? "Yes" : "No"}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Bắt đầu
                  <div className="text-foreground font-medium">
                    {formatDateTime(selectedSession.startedAt)}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nguyên liệu</TableHead>
                      <TableHead className="text-center">Tồn kho</TableHead>
                      <TableHead className="text-center">Thực tế</TableHead>
                      <TableHead className="text-center">Lệch</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedSession.details ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Không có chi tiết
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedSession.details.map((detail, idx) => (
                        <TableRow key={`${selectedSession.id}-${idx}`}>
                          <TableCell>{detail.ingredientName}</TableCell>
                          <TableCell className="text-center">
                            {detail.snapshotQuantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {detail.actualQuantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {detail.diffQuantity}
                          </TableCell>
                          <TableCell>{detail.reason ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Không có dữ liệu.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={updateOpen}
        onOpenChange={(open) => {
          setUpdateOpen(open);
          if (!open) {
            setUpdateDetails([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cập nhật số lượng</DialogTitle>
            <DialogDescription>
              Nhập số lượng thực tế và lý do.
            </DialogDescription>
          </DialogHeader>

          {selectedSession ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Phiên:{" "}
                <span className="text-foreground">{selectedSession.code}</span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nguyên liệu</TableHead>
                      <TableHead className="text-center">Tồn kho</TableHead>
                      <TableHead className="text-center">Thực tế</TableHead>
                      <TableHead className="text-center">Lệch</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedSession.details ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Không có chi tiết
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedSession.details.map((detail, idx) => {
                        const draft = updateDetails.find(
                          (d) => d.ingredientId === detail.ingredientId,
                        );
                        const actual = Number(draft?.actualQuantity ?? 0);
                        const diff =
                          actual - Number(detail.snapshotQuantity ?? 0);
                        return (
                          <TableRow key={`${selectedSession.id}-${idx}`}>
                            <TableCell>{detail.ingredientName}</TableCell>
                            <TableCell className="text-center">
                              {detail.snapshotQuantity}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={actual}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  setUpdateDetails((prev) =>
                                    prev.map((d) =>
                                      d.ingredientId === detail.ingredientId
                                        ? {
                                            ...d,
                                            actualQuantity: Number.isFinite(
                                              value,
                                            )
                                              ? value
                                              : 0,
                                          }
                                        : d,
                                    ),
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {diff}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={draft?.reason ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setUpdateDetails((prev) =>
                                    prev.map((d) =>
                                      d.ingredientId === detail.ingredientId
                                        ? { ...d, reason: value }
                                        : d,
                                    ),
                                  );
                                }}
                                placeholder="Ly do"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Không có dữ liệu.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>
              Đóng
            </Button>
            <Button
              onClick={handleUpdateCounts}
              disabled={updateSubmitting || !selectedSession}
              className="bg-primary hover:bg-primary/90"
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={approveOpen}
        onOpenChange={(open) => {
          setApproveOpen(open);
          if (!open) {
            setApproveNote("");
          }
        }}
      >
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Duyệt phiên kiểm kho</DialogTitle>
            <DialogDescription>
              Xác nhận duyệt và nhập ghi chú nếu cần.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-note">Ghi chú</Label>
            <Input
              id="approve-note"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Ghi chú..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveSubmitting || !selectedSession}
              className="bg-primary hover:bg-primary/90"
            >
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={startOpen}
        onOpenChange={(open) => {
          setStartOpen(open);
          if (!open) {
            setStartForm({ code: "", note: "", ingredientIds: [] });
            setSelectedIngredientId("");
          }
        }}
      >
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Bắt đầu phiên kiểm kho</DialogTitle>
            <DialogDescription>
              Nhập mã phiên, ghi chú và chọn nguyên liệu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-code">Mã phiên</Label>
              <Input
                id="start-code"
                value={startForm.code}
                onChange={(e) =>
                  setStartForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="CC2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-note">Ghi chú</Label>
              <Input
                id="start-note"
                value={startForm.note}
                onChange={(e) =>
                  setStartForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Ghi chú..."
              />
            </div>

            <div className="space-y-2">
              <Label>Nguyên liệu</Label>
              <div className="flex gap-2">
                <select
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedIngredientId}
                  onChange={(e) =>
                    setSelectedIngredientId(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                >
                  <option value="" disabled>
                    {ingredientsLoading
                      ? "Đang tải nguyên liệu..."
                      : "Chọn nguyên liệu"}
                  </option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddIngredient}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedIngredients.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Chưa có nguyên liệu nào
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedIngredients.map((ing) => (
                    <span
                      key={ing.id}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs"
                    >
                      {ing.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ing.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleStart}
              disabled={startSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              Tạo phiên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
