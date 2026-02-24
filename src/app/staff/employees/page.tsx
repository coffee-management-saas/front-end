"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar as CalendarIcon,
  Filter,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScheduleDto, SchedulesResponse } from "@/types/schedules";
import { useAppContext } from "@/app/AppProvider";
import { getEmployeeById, getEmployees } from "@/services/employee.service";
import type {
  EmployeeDto,
  EmployeeType,
  ShopEmployeeProfile,
} from "@/types/employee";

function employeeTypeLabel(t?: EmployeeType | string | null): string {
  switch (String(t ?? "").toUpperCase()) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "TEMPORARY":
      return "Thời vụ";
    default:
      return String(t ?? "").trim() || "—";
  }
}

function parseJsonSafely<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readEmployeeIdFromToken(accessToken?: string): number | null {
  const payload = decodeJwtPayload(accessToken);
  const raw =
    (payload?.employeeId as unknown) ??
    (payload?.userId as unknown) ??
    (payload?.id as unknown);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function readMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const code = (data as Record<string, unknown>).code;
  if (typeof code === "number" && code >= 400) {
    const msg = (data as Record<string, unknown>).message;
    return typeof msg === "string" && msg.trim() ? msg : "BE error";
  }
  const msg = (data as Record<string, unknown>).message;
  return typeof msg === "string" && msg.trim() ? msg : null;
}

function readSchedules(data: unknown): ScheduleDto[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const arr = obj.data;
  return Array.isArray(arr) ? (arr as ScheduleDto[]) : [];
}

function formatTimeHHmm(value?: string | null): string {
  if (!value) return "-";
  const timeOnly = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (timeOnly) {
    const hh = String(Number(timeOnly[1])).padStart(2, "0");
    const mm = timeOnly[2];
    return `${hh}:${mm}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return value;
}

function formatTimeRangeLabel(
  startTime?: string | null,
  endTime?: string | null,
): string {
  const st = formatTimeHHmm(startTime);
  const en = formatTimeHHmm(endTime);
  if (st !== "-" && en !== "-") return `${st} - ${en}`;
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return "-";
}

function formatDateOnlyVi(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function toDateKeyLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateKeyLocal(dateKey?: string | null): Date | null {
  if (!dateKey) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateKeyVi(dateKey?: string | null): string {
  const d = parseDateKeyLocal(dateKey);
  if (!d) return "—";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatScheduleDateRangeLabel(
  startTime?: string | null,
  endTime?: string | null,
): string | null {
  const startDate = formatDateOnlyVi(startTime);
  const endDate = formatDateOnlyVi(endTime);
  if (startDate && endDate) {
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  }
  return startDate || endDate;
}

function scheduleIntersectsDateKey(s: ScheduleDto, dateKey: string): boolean {
  const selected = parseDateKeyLocal(dateKey);
  if (!selected) return true;

  const selectedStart = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
    0,
    0,
    0,
    0,
  );
  const selectedEnd = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
    23,
    59,
    59,
    999,
  );

  const start = s.startTime ? new Date(s.startTime) : null;
  const end = s.endTime ? new Date(s.endTime) : null;
  const startOk = !!start && !Number.isNaN(start.getTime());
  const endOk = !!end && !Number.isNaN(end.getTime());

  if (startOk && endOk) {
    return start <= selectedEnd && end >= selectedStart;
  }
  if (startOk) return toDateKeyLocal(start!) === dateKey;
  if (endOk) return toDateKeyLocal(end!) === dateKey;
  return false;
}

function dayOfWeekLabel(v?: string | null): string {
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
      return String(v ?? "").trim() || "—";
  }
}

function dayOfWeekLabelFromDateLike(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const labels = [
    "Chủ nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ] as const;
  return labels[d.getDay()] ?? null;
}

function readStringField(
  obj: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function scheduleDayLabel(s: ScheduleDto): string {
  const obj = s as unknown as Record<string, unknown>;
  const start = readStringField(obj, ["startDay", "start_day", "startday"]);
  const end = readStringField(obj, ["endDay", "end_day", "endday"]);
  const dow = readStringField(obj, ["dayOfWeek", "day_of_week", "dow"]);
  if (start) {
    if (end && end.toUpperCase() !== start.toUpperCase()) {
      return `${dayOfWeekLabel(start)} - ${dayOfWeekLabel(end)}`;
    }
    return dayOfWeekLabel(start);
  }
  if (end) return dayOfWeekLabel(end);
  if (dow) return dayOfWeekLabel(dow);
  return (
    dayOfWeekLabelFromDateLike(s.startTime) ??
    dayOfWeekLabelFromDateLike(s.endTime) ??
    "—"
  );
}

export default function EmployeesPage() {
  const { tokens } = useAppContext();
  const accessToken = tokens.accessToken;
  const [scheduleType, setScheduleType] = useState<EmployeeType | "all">("all");
  const [scheduleDateKey, setScheduleDateKey] = useState("");

  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [profileByEmployeeId, setProfileByEmployeeId] = useState<
    Record<number, ShopEmployeeProfile>
  >({});

  const [scheduleKeyword, setScheduleKeyword] = useState("");
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [scheduleScope, setScheduleScope] = useState<"ALL" | "SELF">("ALL");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const resp = await getEmployees({ page: 0, size: 200 });
        const list = Array.isArray(resp?.data) ? resp.data : [];
        if (!cancelled) setEmployees(list.filter(Boolean));
      } catch {
        if (!cancelled) setEmployees([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const employeeIds = employees
      .map((e) => Number(e.employeeId))
      .filter((id) => Number.isFinite(id) && id > 0);
    const scheduleEmployeeIds = schedules
      .map((s) => Number(s.employeeId))
      .filter((id) => Number.isFinite(id) && id > 0);
    const uniqueIds = Array.from(
      new Set<number>([...employeeIds, ...scheduleEmployeeIds]),
    );
    const missing = uniqueIds.filter((id) => !(id in profileByEmployeeId));
    if (missing.length === 0) return;

    const run = async () => {
      await Promise.all(
        missing.map(async (id) => {
          try {
            const profile = await getEmployeeById(id);
            if (cancelled) return;
            setProfileByEmployeeId((prev) => ({ ...prev, [id]: profile }));
          } catch {
            // ignore
          }
        }),
      );
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [employees, schedules, profileByEmployeeId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setSchedulesLoading(true);
      setSchedulesError(null);
      setScheduleScope("ALL");
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        let res = await fetch(`/api/schedules?${qs.toString()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });

        let raw = await res.text();
        let data = parseJsonSafely<unknown>(raw);
        if (!res.ok && res.status === 403) {
          const selfId = readEmployeeIdFromToken(accessToken);
          if (selfId) {
            setScheduleScope("SELF");
            res = await fetch(`/api/schedules/${selfId}`, {
              credentials: "same-origin",
              cache: "no-store",
            });
            raw = await res.text();
            data = parseJsonSafely<unknown>(raw);
          }
        }

        if (!res.ok) {
          throw new Error(readMessage(data) || "Không tải được lịch làm");
        }

        const envelope = data as SchedulesResponse | null;
        const list = readSchedules(envelope);
        if (!cancelled) setSchedules(list.filter(Boolean));
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Không tải được lịch làm";
        setSchedulesError(msg);
        setSchedules([]);
      } finally {
        if (!cancelled) setSchedulesLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const filteredSchedules = useMemo(() => {
    const kw = scheduleKeyword.trim().toLowerCase();
    return schedules.filter((s) => {
      const name = String(s.employeeName ?? "").toLowerCase();
      const task = String(s.task ?? "").toLowerCase();
      const obj = s as unknown as Record<string, unknown>;
      const day = readStringField(obj, [
        "dayOfWeek",
        "day_of_week",
        "dow",
      ]).toLowerCase();
      const startDay = readStringField(obj, [
        "startDay",
        "start_day",
        "startday",
      ]).toLowerCase();
      const endDay = readStringField(obj, [
        "endDay",
        "end_day",
        "endday",
      ]).toLowerCase();

      const normalizedType = String(s.employeeType ?? "")
        .trim()
        .toUpperCase();
      const matchType =
        scheduleType === "all" || normalizedType === scheduleType;

      const matchDate =
        !scheduleDateKey || scheduleIntersectsDateKey(s, scheduleDateKey);

      const matchKw =
        !kw ||
        name.includes(kw) ||
        task.includes(kw) ||
        day.includes(kw) ||
        startDay.includes(kw) ||
        endDay.includes(kw) ||
        String(s.employeeId ?? "").includes(kw);

      return matchKw && matchType && matchDate;
    });
  }, [scheduleKeyword, schedules, scheduleType, scheduleDateKey]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xl text-[#693916] font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Danh sách nhân viên
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm min-w-[240px]">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <Input
            value={scheduleKeyword}
            onChange={(e) => setScheduleKeyword(e.target.value)}
            placeholder="Tìm theo tên nhân viên / công việc / thứ"
            className="border-0 shadow-none focus-visible:ring-0 text-xs h-8 px-2"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 bg-[#cec3bc]/35"
              aria-label={
                scheduleDateKey
                  ? `Đang lọc theo ngày ${formatDateKeyVi(scheduleDateKey)}`
                  : "Chọn ngày để lọc"
              }
            >
              <CalendarIcon className="w-4 h-4" />
              {scheduleDateKey ? formatDateKeyVi(scheduleDateKey) : "Chọn ngày"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <div className="p-3 pb-0">
              <div className="text-xs text-gray-600">Lọc theo ngày</div>
            </div>
            <Calendar
              mode="single"
              selected={parseDateKeyLocal(scheduleDateKey) ?? undefined}
              onSelect={(d) => {
                if (!d) return;
                setScheduleDateKey(toDateKeyLocal(d));
              }}
              initialFocus
            />
            {scheduleDateKey ? (
              <div className="p-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setScheduleDateKey("")}
                >
                  Bỏ lọc ngày
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              className="border border-gray-200 bg-[#cec3bc]/35"
              aria-label={`Bộ lọc: ${scheduleType === "all" ? "Tất cả" : employeeTypeLabel(scheduleType)}`}
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Loại nhân viên</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={scheduleType}
              onValueChange={(v) => setScheduleType(v as EmployeeType | "all")}
            >
              <DropdownMenuRadioItem value="all">Tất cả</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="FULL_TIME">
                Full-time
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="PART_TIME">
                Part-time
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="TEMPORARY">
                Thời vụ
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theo ngày</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setScheduleDateKey(toDateKeyLocal(new Date()));
              }}
            >
              Lịch hôm nay
            </DropdownMenuItem>
            {scheduleDateKey ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setScheduleDateKey("");
                }}
              >
                Bỏ lọc ngày
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card className="py-0 gap-0">
        <CardHeader className="px-3 py-2 border-b !pb-2 gap-1">
          <CardTitle className="text-sm ">Danh sách nhân viên</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scheduleScope === "SELF" && !schedulesError ? (
            <div className="px-4 py-2 text-xs text-amber-900 bg-amber-50 border-t">
              Tài khoản hiện tại không có quyền xem tất cả lịch làm. Đang hiển
              thị lịch của bạn.
            </div>
          ) : null}
          {schedulesError ? (
            <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-t">
              {schedulesError}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm leading-tight table-fixed">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold w-1/5">
                    Nhân viên
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-1/5">
                    <span className="inline-flex items-center gap-1">
                      Số điện thoại
                    </span>
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-1/5">
                    Thứ trong tuần
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-1/5">
                    Giờ
                  </th>

                  <th className="text-left px-3 py-2 font-semibold w-1/5">
                    Công việc
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedulesLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-gray-600"
                    >
                      Đang tải lịch làm...
                    </td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-gray-600"
                    >
                      Không có lịch làm.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((s) => (
                    <tr
                      key={String(
                        s.scheduleId ?? `${s.employeeId}-${s.startTime}`,
                      )}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-3">
                        <div className="font-semibold text-stone-900">
                          {String(s.employeeName ?? "").trim() ||
                            `ID: ${s.employeeId}`}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {employeeTypeLabel(s.employeeType)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {String(
                          profileByEmployeeId[Number(s.employeeId)]?.phone ??
                            "",
                        ).trim() || "-"}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {scheduleDayLabel(s)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-gray-500">
                            {formatScheduleDateRangeLabel(
                              s.startTime,
                              s.endTime,
                            ) || "—"}
                          </div>
                          <div>
                            {formatTimeRangeLabel(s.startTime, s.endTime)}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {String(s.task ?? "").trim() || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
