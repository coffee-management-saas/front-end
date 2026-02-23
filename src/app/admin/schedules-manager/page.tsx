"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  CreateScheduleInput,
  CreateScheduleResponse,
  ScheduleDto,
  ScheduleMeta,
  SchedulesByEmployeeResponse,
  SchedulesResponse,
  UpdateScheduleInput,
  UpdateScheduleResponse,
} from "@/types/schedules";
import type { EmployeeDto } from "@/types/employee";
import { getEmployeeById, getEmployees } from "@/services/employee.service";
import type {
  CreateUnavailabilityInput,
  CreateUnavailabilityResponse,
  EmployeeUnavailabilityDto,
  UnavailabilityListResponse,
  UnavailabilityMeta,
  UpdateUnavailabilityInput,
  UpdateUnavailabilityResponse,
} from "@/types/unavailability";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayOfWeekEnumFromDateKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const idx = d.getDay(); // 0..6 (Sun..Sat)
  switch (idx) {
    case 0:
      return "SUNDAY";
    case 1:
      return "MONDAY";
    case 2:
      return "TUESDAY";
    case 3:
      return "WEDNESDAY";
    case 4:
      return "THURSDAY";
    case 5:
      return "FRIDAY";
    case 6:
      return "SATURDAY";
    default:
      return "";
  }
}

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

const toIsoDateZ = (input: string) => {
  const v = input.trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toISOString();
};

const toIsoDateTimeZ = (input: string) => {
  const v = input.trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00.000Z`;
  if (/Z$/i.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toISOString();
};

const toDateTimeLocalValue = (input?: string) => {
  if (!input) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) return input.slice(0, 16);
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

const toDateValue = (input?: string) => {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return toLocalDateKey(d);
};

const dayOfWeekLabel = (v?: string) => {
  switch (String(v ?? "").toUpperCase()) {
    case "MONDAY":
      return "Thứ Hai";
    case "TUESDAY":
      return "Thứ Ba";
    case "WEDNESDAY":
      return "Thứ Tư";
    case "THURSDAY":
      return "Thứ Năm";
    case "FRIDAY":
      return "Thứ Sáu";
    case "SATURDAY":
      return "Thứ Bảy";
    case "SUNDAY":
      return "Chủ nhật";
    default:
      return v || "—";
  }
};

export default function SchedulesManagerPage() {
  const [activeTab, setActiveTab] = useState<"SCHEDULES" | "UNAVAILABILITY">(
    "SCHEDULES",
  );

  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [meta, setMeta] = useState<ScheduleMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateScheduleInput>({
    employeeId: 0,
    startTime: "",
    endTime: "",
    task: "",
    isRecurring: true,
  });
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeDto[]>([]);
  const [employeeNameById, setEmployeeNameById] = useState<
    Record<number, string>
  >({});
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewEmployeeId, setViewEmployeeId] = useState<number | null>(null);
  const [viewEmployeeName, setViewEmployeeName] = useState<string>("");
  const [viewSchedules, setViewSchedules] = useState<ScheduleDto[]>([]);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleDto | null>(null);
  const [editForm, setEditForm] = useState<UpdateScheduleInput>({
    employeeId: 0,
    startTime: "",
    endTime: "",
    task: "",
    isRecurring: true,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteSchedule, setDeleteSchedule] = useState<ScheduleDto | null>(
    null,
  );

  const [unavailability, setUnavailability] = useState<
    EmployeeUnavailabilityDto[]
  >([]);
  const [unavailabilityMeta, setUnavailabilityMeta] =
    useState<UnavailabilityMeta | null>(null);
  const [unavailabilityLoading, setUnavailabilityLoading] = useState(false);
  const [unavailabilityError, setUnavailabilityError] = useState<string | null>(
    null,
  );
  const [unavailabilitySearch, setUnavailabilitySearch] = useState("");
  const [unavailabilityDateFilter, setUnavailabilityDateFilter] =
    useState<string>("");

  const [unavailCreateOpen, setUnavailCreateOpen] = useState(false);
  const [unavailCreating, setUnavailCreating] = useState(false);
  const [unavailCreateForm, setUnavailCreateForm] =
    useState<CreateUnavailabilityInput>({
      employeeId: 0,
      reason: "",
      startTime: "",
      endTime: "",
      specificDate: "",
      isRecurring: false,
      status: "ACTIVE",
    });

  const [unavailViewOpen, setUnavailViewOpen] = useState(false);
  const [unavailViewLoading, setUnavailViewLoading] = useState(false);
  const [unavailViewError, setUnavailViewError] = useState<string | null>(null);
  const [unavailViewItem, setUnavailViewItem] =
    useState<EmployeeUnavailabilityDto | null>(null);

  const [unavailEditOpen, setUnavailEditOpen] = useState(false);
  const [unavailEditSaving, setUnavailEditSaving] = useState(false);
  const [unavailEditItem, setUnavailEditItem] =
    useState<EmployeeUnavailabilityDto | null>(null);
  const [unavailEditForm, setUnavailEditForm] =
    useState<UpdateUnavailabilityInput>({
      employeeId: 0,
      reason: "",
      startTime: "",
      endTime: "",
      specificDate: "",
      isRecurring: false,
      status: "ACTIVE",
    });

  const [unavailDeleteOpen, setUnavailDeleteOpen] = useState(false);
  const [unavailDeleteSaving, setUnavailDeleteSaving] = useState(false);
  const [unavailDeleteItem, setUnavailDeleteItem] =
    useState<EmployeeUnavailabilityDto | null>(null);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ page: "0", size: "100" });
      const res = await fetch(`/api/schedules?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await parseJsonSafely<SchedulesResponse>(res);
      if (!res.ok || !data || data.code !== 200) {
        throw new Error(data?.message || "Load schedules failed");
      }
      setSchedules(data.data ?? []);
      setMeta(data.meta ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load schedules failed";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnavailability = useCallback(async () => {
    setUnavailabilityLoading(true);
    setUnavailabilityError(null);
    try {
      const qs = new URLSearchParams({ page: "0", size: "100" });
      const res = await fetch(`/api/unavailability?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await parseJsonSafely<UnavailabilityListResponse>(res);
      if (!res.ok || !data || data.code !== 200) {
        throw new Error(data?.message || "Load unavailability failed");
      }
      setUnavailability(data.data ?? []);
      setUnavailabilityMeta((data.meta as UnavailabilityMeta) ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load unavailability failed";
      setUnavailabilityError(msg);
      toast.error(msg);
    } finally {
      setUnavailabilityLoading(false);
    }
  }, []);

  const loadEmployeesForSelect = useCallback(async () => {
    if (employeesLoading) return;

    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const resp = await getEmployees({ page: 0, size: 1000 });
      const list = resp.data ?? [];
      setEmployeeOptions(list);

      const missingIds = list
        .map((e) => e.employeeId)
        .filter((id) => !(id in employeeNameById));

      const concurrency = 8;
      let cursor = 0;
      const results: Array<[number, string]> = [];

      const workers = Array.from({ length: concurrency }, async () => {
        while (cursor < missingIds.length) {
          const i = cursor++;
          const id = missingIds[i];
          try {
            const detail = await getEmployeeById(id);
            const name = String(detail?.fullname ?? "").trim();
            if (name) results.push([id, name]);
          } catch {
            // ignore per-employee failures; user can still select by ID
          }
        }
      });

      await Promise.all(workers);

      if (results.length) {
        setEmployeeNameById((prev) => {
          const next = { ...prev };
          for (const [id, name] of results) next[id] = name;
          return next;
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Load employees failed";
      setEmployeesError(msg);
      toast.error(msg);
    } finally {
      setEmployeesLoading(false);
    }
  }, [employeeNameById, employeesLoading]);

  const createSchedule = useCallback(async () => {
    if (isCreating) return;

    const payload: CreateScheduleInput = {
      employeeId: Number(createForm.employeeId),
      startTime: toIsoDateTimeZ(createForm.startTime),
      endTime: toIsoDateTimeZ(createForm.endTime),
      task: String(createForm.task ?? "").trim(),
      isRecurring: Boolean(createForm.isRecurring),
    };

    if (
      !Number.isFinite(payload.employeeId) ||
      payload.employeeId <= 0 ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.task
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin lịch làm việc");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely<CreateScheduleResponse>(res);
      const ok = res.ok && data && (data.code === 201 || data.code === 200);
      if (!ok) {
        throw new Error(data?.message || "Create schedule failed");
      }

      const created = data.data as ScheduleDto;
      setSchedules((prev) => [created, ...prev]);
      setMeta((prev) =>
        prev ? { ...prev, totalElements: (prev.totalElements ?? 0) + 1 } : prev,
      );

      toast.success("Tạo lịch làm việc thành công");
      setCreateOpen(false);
      setCreateForm({
        employeeId: 0,
        startTime: "",
        endTime: "",
        task: "",
        isRecurring: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create schedule failed";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  }, [createForm, isCreating]);

  const fetchSchedulesByEmployee = useCallback(
    async (employeeId: number, employeeName: string) => {
      setIsViewOpen(true);
      setViewEmployeeId(employeeId);
      setViewEmployeeName(employeeName);
      setViewSchedules([]);
      setViewError(null);

      setIsViewLoading(true);
      try {
        const res = await fetch(`/api/schedules/${employeeId}`, {
          cache: "no-store",
        });
        const data = await parseJsonSafely<SchedulesByEmployeeResponse>(res);
        if (!res.ok || !data || data.code !== 200) {
          throw new Error(data?.message || "Load schedules failed");
        }
        setViewSchedules(data.data ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load schedules failed";
        setViewError(msg);
        toast.error(msg);
      } finally {
        setIsViewLoading(false);
      }
    },
    [],
  );

  const openEdit = useCallback(
    (s: ScheduleDto) => {
      setEditSchedule(s);
      setEditForm({
        employeeId: s.employeeId,
        startTime: toDateTimeLocalValue(s.startTime),
        endTime: toDateTimeLocalValue(s.endTime),
        task: s.task ?? "",
        isRecurring: Boolean(s.isRecurring),
      });
      setEditOpen(true);

      if (!employeeOptions.length && !employeesLoading) {
        loadEmployeesForSelect();
      }
    },
    [employeeOptions.length, employeesLoading, loadEmployeesForSelect],
  );

  const submitEdit = useCallback(async () => {
    if (!editSchedule || editSaving) return;

    const payload: UpdateScheduleInput = {
      employeeId: Number(editForm.employeeId),
      startTime: toIsoDateTimeZ(editForm.startTime),
      endTime: toIsoDateTimeZ(editForm.endTime),
      task: String(editForm.task ?? "").trim(),
      isRecurring: Boolean(editForm.isRecurring),
    };

    if (
      !Number.isFinite(payload.employeeId) ||
      payload.employeeId <= 0 ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.task
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(
        `/api/schedules/item/${editSchedule.scheduleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await parseJsonSafely<UpdateScheduleResponse>(res);
      const ok = res.ok && data && data.code >= 200 && data.code < 300;
      if (!ok) {
        throw new Error(data?.message || "Update schedule failed");
      }

      const updated = data.data;
      setSchedules((prev) =>
        prev.map((x) => (x.scheduleId === updated.scheduleId ? updated : x)),
      );

      setViewSchedules((prev) => {
        if (!viewEmployeeId) return prev;
        const wasInView = editSchedule.employeeId === viewEmployeeId;
        const isInView = updated.employeeId === viewEmployeeId;

        if (wasInView && !isInView) {
          return prev.filter((x) => x.scheduleId !== updated.scheduleId);
        }
        if (!wasInView && isInView) {
          return [updated, ...prev];
        }
        if (wasInView && isInView) {
          return prev.map((x) =>
            x.scheduleId === updated.scheduleId ? updated : x,
          );
        }
        return prev;
      });

      toast.success("Cập nhật lịch làm việc thành công");
      setEditOpen(false);
      setEditSchedule(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update schedule failed";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  }, [editForm, editSaving, editSchedule, viewEmployeeId]);

  const createUnavailability = useCallback(async () => {
    if (unavailCreating) return;

    const payload: CreateUnavailabilityInput = {
      employeeId: Number(unavailCreateForm.employeeId),
      reason: String(unavailCreateForm.reason ?? "").trim(),
      startTime: toIsoDateTimeZ(unavailCreateForm.startTime),
      endTime: toIsoDateTimeZ(unavailCreateForm.endTime),
      specificDate: toIsoDateZ(unavailCreateForm.specificDate),
      isRecurring: Boolean(unavailCreateForm.isRecurring),
      status: unavailCreateForm.status
        ? String(unavailCreateForm.status)
        : undefined,
    };

    if (
      !Number.isFinite(payload.employeeId) ||
      payload.employeeId <= 0 ||
      !payload.reason ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.specificDate
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin nghỉ phép");
      return;
    }

    setUnavailCreating(true);
    try {
      const res = await fetch("/api/unavailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely<CreateUnavailabilityResponse>(res);
      const ok = res.ok && data && (data.code === 201 || data.code === 200);
      if (!ok) {
        throw new Error(data?.message || "Create unavailability failed");
      }

      const created = data.data as EmployeeUnavailabilityDto;
      setUnavailability((prev) => [created, ...prev]);
      setUnavailabilityMeta((prev) =>
        prev ? { ...prev, totalElements: (prev.totalElements ?? 0) + 1 } : prev,
      );

      toast.success("Tạo lịch nghỉ phép thành công");
      setUnavailCreateOpen(false);
      setUnavailCreateForm({
        employeeId: 0,
        reason: "",
        startTime: "",
        endTime: "",
        specificDate: "",
        isRecurring: false,
        status: "ACTIVE",
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Create unavailability failed";
      toast.error(msg);
    } finally {
      setUnavailCreating(false);
    }
  }, [unavailCreateForm, unavailCreating]);

  const openUnavailView = useCallback(async (u: EmployeeUnavailabilityDto) => {
    setUnavailViewItem(u);
    setUnavailViewError(null);
    setUnavailViewOpen(true);

    setUnavailViewLoading(true);
    try {
      const res = await fetch(
        `/api/unavailability/${u.employeeUnavailabilityId}`,
        {
          cache: "no-store",
        },
      );
      const data = await parseJsonSafely<{
        code?: number;
        message?: string;
        data?: EmployeeUnavailabilityDto;
      }>(res);

      if (res.ok && data?.data) {
        setUnavailViewItem(data.data);
      }
    } catch {
      // keep showing local row data
    } finally {
      setUnavailViewLoading(false);
    }
  }, []);

  const openUnavailEdit = useCallback(
    (u: EmployeeUnavailabilityDto) => {
      setUnavailEditItem(u);
      setUnavailEditForm({
        employeeId: u.employeeId,
        reason: u.reason ?? "",
        startTime: toDateTimeLocalValue(u.startTime),
        endTime: toDateTimeLocalValue(u.endTime),
        specificDate: toDateValue(u.specificDate),
        isRecurring: Boolean(u.isRecurring),
        status: u.status ?? "ACTIVE",
      });
      setUnavailEditOpen(true);

      if (!employeeOptions.length && !employeesLoading) {
        loadEmployeesForSelect();
      }
    },
    [employeeOptions.length, employeesLoading, loadEmployeesForSelect],
  );

  const submitUnavailEdit = useCallback(async () => {
    if (!unavailEditItem || unavailEditSaving) return;

    const payload: UpdateUnavailabilityInput = {
      employeeId: Number(unavailEditForm.employeeId),
      reason: String(unavailEditForm.reason ?? "").trim(),
      startTime: toIsoDateTimeZ(unavailEditForm.startTime),
      endTime: toIsoDateTimeZ(unavailEditForm.endTime),
      specificDate: toIsoDateZ(unavailEditForm.specificDate),
      isRecurring: Boolean(unavailEditForm.isRecurring),
      status: unavailEditForm.status
        ? String(unavailEditForm.status)
        : undefined,
    };

    if (
      !Number.isFinite(payload.employeeId) ||
      payload.employeeId <= 0 ||
      !payload.reason ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.specificDate
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setUnavailEditSaving(true);
    try {
      const res = await fetch(
        `/api/unavailability/${unavailEditItem.employeeUnavailabilityId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await parseJsonSafely<UpdateUnavailabilityResponse>(res);
      const ok = res.ok && data && data.code >= 200 && data.code < 300;
      if (!ok) {
        throw new Error(data?.message || "Update unavailability failed");
      }

      const updated = data.data as EmployeeUnavailabilityDto;
      setUnavailability((prev) =>
        prev.map((x) =>
          x.employeeUnavailabilityId === updated.employeeUnavailabilityId
            ? updated
            : x,
        ),
      );

      toast.success("Cập nhật nghỉ phép thành công");
      setUnavailEditOpen(false);
      setUnavailEditItem(null);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Update unavailability failed";
      toast.error(msg);
    } finally {
      setUnavailEditSaving(false);
    }
  }, [unavailEditForm, unavailEditItem, unavailEditSaving]);

  const openUnavailDelete = useCallback((u: EmployeeUnavailabilityDto) => {
    setUnavailDeleteItem(u);
    setUnavailDeleteOpen(true);
  }, []);

  const confirmUnavailDelete = useCallback(async () => {
    if (!unavailDeleteItem || unavailDeleteSaving) return;

    setUnavailDeleteSaving(true);
    try {
      const res = await fetch(
        `/api/unavailability/${unavailDeleteItem.employeeUnavailabilityId}`,
        { method: "DELETE" },
      );
      const data = await parseJsonSafely<{ code?: number; message?: string }>(
        res,
      );
      const ok =
        res.ok &&
        (!data ||
          data.code === undefined ||
          (data.code >= 200 && data.code < 300));
      if (!ok) {
        throw new Error(data?.message || "Delete unavailability failed");
      }

      setUnavailability((prev) =>
        prev.filter(
          (x) =>
            x.employeeUnavailabilityId !==
            unavailDeleteItem.employeeUnavailabilityId,
        ),
      );
      setUnavailabilityMeta((prev) =>
        prev
          ? {
              ...prev,
              totalElements: Math.max(0, (prev.totalElements ?? 0) - 1),
            }
          : prev,
      );

      toast.success("Xóa lịch nghỉ phép thành công");
      setUnavailDeleteOpen(false);
      setUnavailDeleteItem(null);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Delete unavailability failed";
      toast.error(msg);
    } finally {
      setUnavailDeleteSaving(false);
    }
  }, [unavailDeleteItem, unavailDeleteSaving]);

  const openDelete = useCallback((s: ScheduleDto) => {
    setDeleteSchedule(s);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteSchedule || deleteSaving) return;

    setDeleteSaving(true);
    try {
      const res = await fetch(
        `/api/schedules/item/${deleteSchedule.scheduleId}`,
        { method: "DELETE" },
      );
      const data = await parseJsonSafely<{ code?: number; message?: string }>(
        res,
      );

      const ok =
        res.ok &&
        (!data ||
          data.code === undefined ||
          (data.code >= 200 && data.code < 300));
      if (!ok) {
        throw new Error(data?.message || "Delete schedule failed");
      }

      setSchedules((prev) =>
        prev.filter((x) => x.scheduleId !== deleteSchedule.scheduleId),
      );
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              totalElements: Math.max(0, (prev.totalElements ?? 0) - 1),
            }
          : prev,
      );

      toast.success("Xóa lịch làm việc thành công");
      setDeleteOpen(false);
      setDeleteSchedule(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete schedule failed";
      toast.error(msg);
    } finally {
      setDeleteSaving(false);
    }
  }, [deleteSchedule, deleteSaving]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!createOpen) return;
    if (employeeOptions.length) return;
    loadEmployeesForSelect();
  }, [createOpen, employeeOptions.length, loadEmployeesForSelect]);

  useEffect(() => {
    if (activeTab !== "UNAVAILABILITY") return;
    if (unavailability.length) return;
    fetchUnavailability();
  }, [activeTab, fetchUnavailability, unavailability.length]);

  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const dateKey = dateFilter.trim();
    const dateDow = dateKey ? dayOfWeekEnumFromDateKey(dateKey) : "";

    if (!q && !dateKey) return schedules;

    return schedules.filter((s) => {
      if (dateKey) {
        if (s.isRecurring) {
          const dow = String(s.dayOfWeek ?? "").toUpperCase();
          if (!dateDow || dow !== dateDow) return false;
        } else {
          const d = new Date(String(s.startTime ?? ""));
          if (Number.isNaN(d.getTime())) return false;
          if (toLocalDateKey(d) !== dateKey) return false;
        }
      }

      const haystack = [
        String(s.scheduleId ?? ""),
        String(s.employeeId ?? ""),
        String(s.employeeName ?? ""),
        String(s.employeeType ?? ""),
        String(s.task ?? ""),
        String(s.dayOfWeek ?? ""),
        String(s.startTime ?? ""),
        String(s.endTime ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [schedules, searchQuery, dateFilter]);

  const recurringCount = useMemo(
    () => schedules.filter((s) => Boolean(s.isRecurring)).length,
    [schedules],
  );

  const filteredUnavailability = useMemo(() => {
    const q = unavailabilitySearch.trim().toLowerCase();
    const dateKey = unavailabilityDateFilter.trim();
    if (!q && !dateKey) return unavailability;

    return unavailability.filter((u) => {
      if (dateKey) {
        const d = new Date(String(u.specificDate ?? u.startTime ?? ""));
        if (Number.isNaN(d.getTime())) return false;
        if (toLocalDateKey(d) !== dateKey) return false;
      }

      if (!q) return true;
      const haystack = [
        String(u.employeeUnavailabilityId ?? ""),
        String(u.employeeId ?? ""),
        String(u.employeeName ?? ""),
        String(u.reason ?? ""),
        String(u.status ?? ""),
        String(u.startTime ?? ""),
        String(u.endTime ?? ""),
        String(u.specificDate ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [unavailability, unavailabilityDateFilter, unavailabilitySearch]);

  const unavailabilityActiveCount = useMemo(
    () =>
      unavailability.filter((u) =>
        String(u.status ?? "")
          .toUpperCase()
          .includes("ACTIVE"),
      ).length,
    [unavailability],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {activeTab === "SCHEDULES" ? "Lịch làm việc" : "Lịch nghỉ phép"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === "SCHEDULES"
              ? "Quản lý lịch làm việc của nhân viên"
              : "Quản lý lịch nghỉ phép của nhân viên"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant={activeTab === "SCHEDULES" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("SCHEDULES")}
            >
              Lịch làm việc
            </Button>
            <Button
              variant={activeTab === "UNAVAILABILITY" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("UNAVAILABILITY")}
            >
              Lịch nghỉ phép
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              activeTab === "SCHEDULES"
                ? setCreateOpen(true)
                : setUnavailCreateOpen(true)
            }
            className="admin-button-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === "SCHEDULES"
              ? "Thêm lịch làm việc"
              : "Thêm nghỉ phép"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              activeTab === "SCHEDULES"
                ? fetchSchedules()
                : fetchUnavailability()
            }
            disabled={
              activeTab === "SCHEDULES" ? isLoading : unavailabilityLoading
            }
          >
            Tải lại
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeTab === "SCHEDULES"
                  ? (meta?.totalElements ?? schedules.length)
                  : (unavailabilityMeta?.totalElements ??
                    unavailability.length)}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeTab === "SCHEDULES" ? "Tổng lịch" : "Tổng nghỉ phép"}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeTab === "SCHEDULES"
                  ? recurringCount
                  : unavailabilityActiveCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeTab === "SCHEDULES" ? "Lặp lại" : "Đang hoạt động"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "SCHEDULES" ? (
        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo nhân viên, công việc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor="schedule-date-filter" className="text-xs">
                    Lọc theo ngày
                  </Label>
                  <Input
                    id="schedule-date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilter(toLocalDateKey(new Date()))}
                >
                  Hôm nay
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter("")}
                  disabled={!dateFilter}
                >
                  Xóa lọc
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nhân viên</TableHead>
                  <TableHead className="font-semibold text-center">
                    Loại
                  </TableHead>
                  <TableHead className="font-semibold">Công việc</TableHead>
                  <TableHead className="font-semibold text-center">
                    THỨ
                  </TableHead>
                  <TableHead className="font-semibold">Bắt đầu</TableHead>
                  <TableHead className="font-semibold">Kết thúc</TableHead>
                  <TableHead className="font-semibold text-center">
                    Lặp lại
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
                      Đang tải lịch làm việc...
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
                ) : filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không có lịch làm việc
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((s) => (
                    <TableRow key={s.scheduleId} className="admin-table-row">
                      <TableCell className="font-medium">
                        {s.employeeName}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="admin-badge admin-badge-inactive">
                          {s.employeeType}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.task}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {dayOfWeekLabel(s.dayOfWeek)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(s.startTime)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(s.endTime)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {s.isRecurring ? "Có" : "Không"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              fetchSchedulesByEmployee(
                                s.employeeId,
                                s.employeeName,
                              )
                            }
                            aria-label="Xem lịch làm việc theo nhân viên"
                            title="Xem lịch theo nhân viên"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                            aria-label="Chỉnh sửa lịch làm việc"
                            title="Chỉnh sửa lịch làm việc"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(s)}
                            aria-label="Xóa lịch làm việc"
                            title="Xóa lịch làm việc"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
      ) : (
        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo nhân viên, lý do..."
                  value={unavailabilitySearch}
                  onChange={(e) => setUnavailabilitySearch(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor="unavail-date-filter" className="text-xs">
                    Lọc theo ngày
                  </Label>
                  <Input
                    id="unavail-date-filter"
                    type="date"
                    value={unavailabilityDateFilter}
                    onChange={(e) =>
                      setUnavailabilityDateFilter(e.target.value)
                    }
                    className="bg-background"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setUnavailabilityDateFilter(toLocalDateKey(new Date()))
                  }
                >
                  Hôm nay
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnavailabilityDateFilter("")}
                  disabled={!unavailabilityDateFilter}
                >
                  Xóa lọc
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nhân viên</TableHead>
                  <TableHead className="font-semibold">Lý do</TableHead>
                  <TableHead className="font-semibold text-center">
                    Ngày
                  </TableHead>
                  <TableHead className="font-semibold">Bắt đầu</TableHead>
                  <TableHead className="font-semibold">Kết thúc</TableHead>
                  <TableHead className="font-semibold text-center">
                    Lặp lại
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
                {unavailabilityLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải lịch nghỉ phép...
                    </TableCell>
                  </TableRow>
                ) : unavailabilityError ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-destructive"
                    >
                      {unavailabilityError}
                    </TableCell>
                  </TableRow>
                ) : filteredUnavailability.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không có lịch nghỉ phép
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnavailability.map((u) => (
                    <TableRow
                      key={u.employeeUnavailabilityId}
                      className="admin-table-row"
                    >
                      <TableCell className="font-medium">
                        {u.employeeName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.reason}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {toDateValue(u.specificDate) || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(u.startTime)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(u.endTime)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {u.isRecurring ? "Có" : "Không"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {u.status}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openUnavailView(u)}
                            aria-label="Xem lịch nghỉ phép"
                            title="Xem lịch nghỉ phép"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openUnavailEdit(u)}
                            aria-label="Chỉnh sửa lịch nghỉ phép"
                            title="Chỉnh sửa lịch nghỉ phép"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openUnavailDelete(u)}
                            aria-label="Xóa lịch nghỉ phép"
                            title="Xóa lịch nghỉ phép"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
      )}

      <Dialog
        open={isViewOpen}
        onOpenChange={(open) => {
          setIsViewOpen(open);
          if (!open) {
            setViewEmployeeId(null);
            setViewEmployeeName("");
            setViewSchedules([]);
            setViewError(null);
            setIsViewLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              Lịch làm việc: {viewEmployeeName || "Nhân viên"}
              {viewEmployeeId ? ` (ID: ${viewEmployeeId})` : ""}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isViewLoading
                ? "Đang tải..."
                : viewError
                  ? viewError
                  : `Tổng lịch: ${viewSchedules.length}`}
            </p>
          </DialogHeader>

          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Công việc</TableHead>
                  <TableHead className="font-semibold text-center">
                    THỨ
                  </TableHead>
                  <TableHead className="font-semibold">Bắt đầu</TableHead>
                  <TableHead className="font-semibold">Kết thúc</TableHead>
                  <TableHead className="font-semibold text-center">
                    Lặp lại
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isViewLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : viewError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-destructive"
                    >
                      {viewError}
                    </TableCell>
                  </TableRow>
                ) : viewSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không có lịch
                    </TableCell>
                  </TableRow>
                ) : (
                  viewSchedules.map((item) => (
                    <TableRow key={item.scheduleId} className="admin-table-row">
                      <TableCell className="text-muted-foreground">
                        {item.task}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {dayOfWeekLabel(item.dayOfWeek)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(item.startTime)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(item.endTime)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.isRecurring ? "Có" : "Không"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditSaving(false);
            setEditSchedule(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              Cập nhật lịch làm việc
              {editSchedule ? ` (ID: ${editSchedule.scheduleId})` : ""}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Chỉnh sửa thông tin lịch làm việc
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-edit-employeeId">Nhân viên</Label>
              <select
                id="schedule-edit-employeeId"
                value={editForm.employeeId ? String(editForm.employeeId) : ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    employeeId: Number(e.target.value),
                  }))
                }
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={employeesLoading || Boolean(employeesError)}
              >
                <option value="" disabled>
                  {employeesError
                    ? "Không tải được danh sách nhân viên"
                    : employeesLoading
                      ? "Đang tải danh sách..."
                      : "Chọn nhân viên"}
                </option>
                {employeeOptions.map((e) => {
                  const name = employeeNameById[e.employeeId];
                  const label = name ? `${name}` : `ID: ${e.employeeId}`;
                  return (
                    <option key={e.employeeId} value={String(e.employeeId)}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-edit-task">Công việc</Label>
              <Input
                id="schedule-edit-task"
                value={editForm.task}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, task: e.target.value }))
                }
                placeholder="VD: Làm ca sáng"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="schedule-edit-start">Bắt đầu</Label>
                <Input
                  id="schedule-edit-start"
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schedule-edit-end">Kết thúc</Label>
                <Input
                  id="schedule-edit-end"
                  type="datetime-local"
                  value={editForm.endTime}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Lặp lại</p>
                <p className="text-xs text-muted-foreground">
                  Lịch sẽ lặp lại theo tuần
                </p>
              </div>
              <Switch
                checked={editForm.isRecurring}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, isRecurring: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
            >
              Hủy
            </Button>
            <Button onClick={submitEdit} disabled={editSaving || !editSchedule}>
              {editSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unavailCreateOpen}
        onOpenChange={(open) => {
          setUnavailCreateOpen(open);
          if (open && !employeeOptions.length && !employeesLoading) {
            loadEmployeesForSelect();
          }
          if (!open) {
            setUnavailCreating(false);
          }
        }}
      >
        <DialogContent className="max-w-lg p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">Thêm nghỉ phép</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Nhập thông tin để tạo lịch nghỉ phép cho nhân viên
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unavail-create-employee">Nhân viên</Label>
              <select
                id="unavail-create-employee"
                value={
                  unavailCreateForm.employeeId
                    ? String(unavailCreateForm.employeeId)
                    : ""
                }
                onChange={(e) =>
                  setUnavailCreateForm((prev) => ({
                    ...prev,
                    employeeId: Number(e.target.value),
                  }))
                }
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={employeesLoading || Boolean(employeesError)}
              >
                <option value="" disabled>
                  {employeesError
                    ? "Không tải được danh sách nhân viên"
                    : employeesLoading
                      ? "Đang tải danh sách..."
                      : "Chọn nhân viên"}
                </option>
                {employeeOptions.map((e) => {
                  const name = employeeNameById[e.employeeId];
                  const label = name ? `${name}` : `ID: ${e.employeeId}`;
                  return (
                    <option key={e.employeeId} value={String(e.employeeId)}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unavail-create-reason">Lý do</Label>
              <Input
                id="unavail-create-reason"
                value={unavailCreateForm.reason}
                onChange={(e) =>
                  setUnavailCreateForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="VD: Nghỉ phép cá nhân"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unavail-create-date">Ngày</Label>
                <Input
                  id="unavail-create-date"
                  type="date"
                  value={unavailCreateForm.specificDate}
                  onChange={(e) =>
                    setUnavailCreateForm((prev) => ({
                      ...prev,
                      specificDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unavail-create-status">Trạng thái</Label>
                <select
                  id="unavail-create-status"
                  value={String(unavailCreateForm.status ?? "ACTIVE")}
                  onChange={(e) =>
                    setUnavailCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unavail-create-start">Bắt đầu</Label>
                <Input
                  id="unavail-create-start"
                  type="datetime-local"
                  value={unavailCreateForm.startTime}
                  onChange={(e) =>
                    setUnavailCreateForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unavail-create-end">Kết thúc</Label>
                <Input
                  id="unavail-create-end"
                  type="datetime-local"
                  value={unavailCreateForm.endTime}
                  onChange={(e) =>
                    setUnavailCreateForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Lặp lại</p>
                <p className="text-xs text-muted-foreground">
                  Nghỉ phép lặp lại theo tuần
                </p>
              </div>
              <Switch
                checked={Boolean(unavailCreateForm.isRecurring)}
                onCheckedChange={(checked) =>
                  setUnavailCreateForm((prev) => ({
                    ...prev,
                    isRecurring: checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnavailCreateOpen(false)}
              disabled={unavailCreating}
            >
              Hủy
            </Button>
            <Button onClick={createUnavailability} disabled={unavailCreating}>
              {unavailCreating ? "Đang tạo..." : "Tạo nghỉ phép"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unavailViewOpen}
        onOpenChange={(open) => {
          setUnavailViewOpen(open);
          if (!open) {
            setUnavailViewLoading(false);
            setUnavailViewError(null);
            setUnavailViewItem(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              Nghỉ phép
              {unavailViewItem
                ? ` (ID: ${unavailViewItem.employeeUnavailabilityId})`
                : ""}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {unavailViewLoading
                ? "Đang tải..."
                : unavailViewError
                  ? unavailViewError
                  : ""}
            </p>
          </DialogHeader>

          {unavailViewItem ? (
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Nhân viên</p>
                  <p className="font-medium">{unavailViewItem.employeeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <p className="font-medium">{unavailViewItem.status}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Lý do</p>
                <p className="font-medium">{unavailViewItem.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Ngày</p>
                  <p className="font-medium">
                    {toDateValue(unavailViewItem.specificDate) || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lặp lại</p>
                  <p className="font-medium">
                    {unavailViewItem.isRecurring ? "Có" : "Không"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Bắt đầu</p>
                  <p className="font-medium">
                    {formatDateTime(unavailViewItem.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kết thúc</p>
                  <p className="font-medium">
                    {formatDateTime(unavailViewItem.endTime)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={unavailEditOpen}
        onOpenChange={(open) => {
          setUnavailEditOpen(open);
          if (!open) {
            setUnavailEditSaving(false);
            setUnavailEditItem(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              Cập nhật nghỉ phép
              {unavailEditItem
                ? ` (ID: ${unavailEditItem.employeeUnavailabilityId})`
                : ""}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Chỉnh sửa thông tin nghỉ phép
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unavail-edit-employee">Nhân viên</Label>
              <select
                id="unavail-edit-employee"
                value={
                  unavailEditForm.employeeId
                    ? String(unavailEditForm.employeeId)
                    : ""
                }
                onChange={(e) =>
                  setUnavailEditForm((prev) => ({
                    ...prev,
                    employeeId: Number(e.target.value),
                  }))
                }
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={employeesLoading || Boolean(employeesError)}
              >
                <option value="" disabled>
                  {employeesError
                    ? "Không tải được danh sách nhân viên"
                    : employeesLoading
                      ? "Đang tải danh sách..."
                      : "Chọn nhân viên"}
                </option>
                {employeeOptions.map((e) => {
                  const name = employeeNameById[e.employeeId];
                  const label = name ? `${name}` : `ID: ${e.employeeId}`;
                  return (
                    <option key={e.employeeId} value={String(e.employeeId)}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unavail-edit-reason">Lý do</Label>
              <Input
                id="unavail-edit-reason"
                value={unavailEditForm.reason}
                onChange={(e) =>
                  setUnavailEditForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unavail-edit-date">Ngày</Label>
                <Input
                  id="unavail-edit-date"
                  type="date"
                  value={unavailEditForm.specificDate}
                  onChange={(e) =>
                    setUnavailEditForm((prev) => ({
                      ...prev,
                      specificDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unavail-edit-status">Trạng thái</Label>
                <select
                  id="unavail-edit-status"
                  value={String(unavailEditForm.status ?? "ACTIVE")}
                  onChange={(e) =>
                    setUnavailEditForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unavail-edit-start">Bắt đầu</Label>
                <Input
                  id="unavail-edit-start"
                  type="datetime-local"
                  value={unavailEditForm.startTime}
                  onChange={(e) =>
                    setUnavailEditForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unavail-edit-end">Kết thúc</Label>
                <Input
                  id="unavail-edit-end"
                  type="datetime-local"
                  value={unavailEditForm.endTime}
                  onChange={(e) =>
                    setUnavailEditForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Lặp lại</p>
                <p className="text-xs text-muted-foreground">
                  Nghỉ phép lặp lại theo tuần
                </p>
              </div>
              <Switch
                checked={Boolean(unavailEditForm.isRecurring)}
                onCheckedChange={(checked) =>
                  setUnavailEditForm((prev) => ({
                    ...prev,
                    isRecurring: checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnavailEditOpen(false)}
              disabled={unavailEditSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={submitUnavailEdit}
              disabled={unavailEditSaving || !unavailEditItem}
            >
              {unavailEditSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={unavailDeleteOpen}
        onOpenChange={(open) => {
          setUnavailDeleteOpen(open);
          if (!open) {
            setUnavailDeleteSaving(false);
            setUnavailDeleteItem(null);
          }
        }}
        onConfirm={confirmUnavailDelete}
        title="Xác nhận xóa lịch nghỉ phép"
        description={
          unavailDeleteItem
            ? `Bạn có chắc chắn muốn xóa nghỉ phép của "${unavailDeleteItem.employeeName}" (${toDateValue(unavailDeleteItem.specificDate)} ${formatDateTime(unavailDeleteItem.startTime)} → ${formatDateTime(unavailDeleteItem.endTime)})? Hành động này không thể hoàn tác.`
            : "Bạn có chắc chắn muốn xóa lịch nghỉ phép? Hành động này không thể hoàn tác."
        }
        confirmLabel={unavailDeleteSaving ? "Đang xóa..." : "Xóa"}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setIsCreating(false);
          }
        }}
      >
        <DialogContent className="max-w-lg p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">Thêm lịch làm việc</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Nhập thông tin để tạo lịch làm việc cho nhân viên
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="schedule-employeeId">Nhân viên</Label>
              </div>

              <select
                id="schedule-employeeId"
                value={
                  createForm.employeeId ? String(createForm.employeeId) : ""
                }
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    employeeId: Number(e.target.value),
                  }))
                }
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={employeesLoading || Boolean(employeesError)}
              >
                <option value="" disabled>
                  {employeesError
                    ? "Không tải được danh sách nhân viên"
                    : employeesLoading
                      ? "Đang tải danh sách..."
                      : "Chọn nhân viên"}
                </option>
                {employeeOptions.map((e) => {
                  const name = employeeNameById[e.employeeId];
                  const label = name ? `${name}` : `ID: ${e.employeeId}`;
                  return (
                    <option key={e.employeeId} value={String(e.employeeId)}>
                      {label}
                    </option>
                  );
                })}
              </select>

              {createForm.employeeId ? (
                <p className="text-xs text-muted-foreground">
                  {employeeNameById[createForm.employeeId]
                    ? `Đã chọn: ${employeeNameById[createForm.employeeId]}`
                    : `Đã chọn ID: ${createForm.employeeId}`}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-task">Công việc</Label>
              <Input
                id="schedule-task"
                value={createForm.task}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, task: e.target.value }))
                }
                placeholder="VD: Làm ca sáng"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="schedule-start">Bắt đầu</Label>
                <Input
                  id="schedule-start"
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schedule-end">Kết thúc</Label>
                <Input
                  id="schedule-end"
                  type="datetime-local"
                  value={createForm.endTime}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Lặp lại</p>
                <p className="text-xs text-muted-foreground">
                  Lịch sẽ lặp lại theo tuần
                </p>
              </div>
              <Switch
                checked={createForm.isRecurring}
                onCheckedChange={(checked) =>
                  setCreateForm((prev) => ({ ...prev, isRecurring: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button onClick={createSchedule} disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo lịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteSaving(false);
            setDeleteSchedule(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa lịch làm việc"
        description={
          deleteSchedule
            ? `Bạn có chắc chắn muốn xóa lịch của "${deleteSchedule.employeeName}" (${dayOfWeekLabel(deleteSchedule.dayOfWeek)} ${formatDateTime(deleteSchedule.startTime)} → ${formatDateTime(deleteSchedule.endTime)})? Hành động này không thể hoàn tác.`
            : "Bạn có chắc chắn muốn xóa lịch làm việc? Hành động này không thể hoàn tác."
        }
        confirmLabel={deleteSaving ? "Đang xóa..." : "Xóa"}
      />
    </div>
  );
}
