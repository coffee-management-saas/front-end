"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Filter, Gift, Percent, Search, Tag } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAppContext } from "@/app/AppProvider";
import { ApiError } from "@/lib/utils";
import { getPromotions } from "@/services/promotion.service";
import type { Promotion as PromotionDto } from "@/types/promotion";

type Status = "active" | "scheduled" | "expired";

type PromotionRow = {
  id: number;
  name: string;
  code: string;
  valueLabel: string;
  condition: string;
  minimumSpentLabel: string;
  startIso: string;
  endIso: string;
  startLabel: string;
  endLabel: string;
  status: Status;
};

const statusLabel: Record<Status, string> = {
  active: "Đang chạy",
  scheduled: "Sắp diễn ra",
  expired: "Hết hạn",
};

function tabLabel(v: Status | "all"): string {
  if (v === "all") return "Tất cả";
  return statusLabel[v];
}

function toDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateKeyVi(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

function isPromoActiveOnDate(
  dateKey: string,
  startIso?: string | null,
  endIso?: string | null,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return true;
  const dayStart = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(dayStart.getTime())) return true;
  const dayEndMs = dayStart.getTime() + 24 * 60 * 60 * 1000 - 1;
  const dayStartMs = dayStart.getTime();

  const startMs = Date.parse(String(startIso ?? ""));
  const endMs = Date.parse(String(endIso ?? ""));
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return true;

  // overlap [startMs, endMs] with [dayStartMs, dayEndMs]
  return startMs <= dayEndMs && endMs >= dayStartMs;
}

const statusStyle: Record<Status, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  scheduled: "bg-amber-100 text-amber-800 border-amber-200",
  expired: "bg-transparent text-red-600 border-transparent",
};

const formatMoney = new Intl.NumberFormat("vi-VN");

function formatDateOnly(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function computeStatus(dto: PromotionDto, nowMs = Date.now()): Status {
  const rawStatus = String(
    dto.status ?? dto.promotionStatus ?? "",
  ).toUpperCase();
  if (rawStatus === "DELETED") return "expired";
  if (rawStatus === "INACTIVE") return "expired";

  const startMs = Date.parse(dto.startDate ?? "");
  const endMs = Date.parse(dto.endDate ?? "");

  if (Number.isFinite(startMs) && nowMs < startMs) return "scheduled";
  if (Number.isFinite(endMs) && nowMs > endMs) return "expired";
  return "active";
}

function buildCondition(dto: PromotionDto): string {
  const parts: string[] = [];
  if (Number(dto.minimumSpent) > 0) {
    parts.push(
      `Đơn tối thiểu ${formatMoney.format(Number(dto.minimumSpent))}đ`,
    );
  }
  if (dto.discountType === "PERCENTAGE" && Number(dto.maxDiscountAmount) > 0) {
    parts.push(`Tối đa ${formatMoney.format(Number(dto.maxDiscountAmount))}đ`);
  }
  if (Number(dto.usageLimitPerUser) > 0) {
    parts.push(
      `Giới hạn/user ${formatMoney.format(Number(dto.usageLimitPerUser))}`,
    );
  }
  if (dto.promotionType === "ORDER") parts.push("Áp dụng: Đơn hàng");
  if (dto.promotionType === "PRODUCT") parts.push("Áp dụng: Sản phẩm");
  return parts.length ? parts.join(" • ") : "—";
}

function toPromotionRow(dto: PromotionDto): PromotionRow {
  const status = computeStatus(dto);
  const value = Number(dto.discountValue) || 0;
  const name =
    String(dto.promotionName ?? "").trim() ||
    String(dto.promotionCode ?? "").trim() ||
    `#${dto.promotionId}`;
  const code = String(dto.promotionCode ?? "").trim();
  const startIso = String(dto.startDate ?? "");
  const endIso = String(dto.endDate ?? "");
  const startLabel = formatDateOnly(dto.startDate);
  const endLabel = formatDateOnly(dto.endDate);

  const minimumSpentLabel =
    Number(dto.minimumSpent) > 0
      ? `${formatMoney.format(Number(dto.minimumSpent))}đ`
      : "—";

  const valueLabel =
    dto.promotionType === "PRODUCT"
      ? "Quà tặng"
      : dto.discountType === "PERCENTAGE"
        ? `${value}%`
        : value === 0
          ? "Free"
          : `${formatMoney.format(value)}đ`;

  return {
    id: Number(dto.promotionId),
    name,
    code,
    condition: buildCondition(dto),
    valueLabel,
    minimumSpentLabel,
    startIso,
    endIso,
    startLabel,
    endLabel,
    status,
  };
}

export default function PromotionPage() {
  const { accessToken } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<Status | "all">("all");
  const [dateKey, setDateKey] = useState<string>("");

  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getPromotions(undefined);
        const mapped = Array.isArray(list) ? list.map(toPromotionRow) : [];
        if (!cancelled) setPromotions(mapped.filter(Boolean));
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setError(
            "Bạn không có quyền xem khuyến mãi. Vui lòng đăng nhập lại.",
          );
        } else {
          setError(
            e instanceof Error ? e.message : "Không tải được khuyến mãi",
          );
        }
        setPromotions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return promotions.filter((p) => {
      const matchKw =
        !kw ||
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        p.condition.toLowerCase().includes(kw);
      const matchTab = tab === "all" || p.status === tab;
      const matchDate = dateKey
        ? isPromoActiveOnDate(dateKey, p.startIso, p.endIso)
        : true;
      return matchKw && matchTab && matchDate;
    });
  }, [keyword, tab, dateKey, promotions]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xl text-[#693916] font-semibold flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Chương trình ưu đãi
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Quản lý và theo dõi thời gian hiệu lực khuyến mãi
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm flex-1 min-w-[220px] max-w-[420px]">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên hoặc mã khuyến mãi..."
            className="border-0 shadow-none focus-visible:ring-0 text-xs h-8 px-2"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              className="border border-gray-200 bg-[#cec3bc]/35"
              aria-label={`Bộ lọc: ${tabLabel(tab)}`}
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Lọc trạng thái</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={tab}
              onValueChange={(v) => setTab(v as Status | "all")}
            >
              <DropdownMenuRadioItem value="all">Tất cả</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active">
                Đang chạy
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="scheduled">
                Sắp diễn ra
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="expired">
                Hết hạn
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theo ngày</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDateKey(toDateKeyLocal(new Date()));
              }}
            >
              Khuyến mãi hôm nay
            </DropdownMenuItem>
            {dateKey ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setDateKey("");
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
          <CardTitle className="text-sm ">Danh sách khuyến mãi</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b">
              {error}
            </div>
          ) : null}

          {/* Mobile list (no horizontal scroll) */}
          <div className="md:hidden divide-y">
            {loading && promotions.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="px-4 py-4 space-y-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-7 w-24 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                ))
              : null}

            {!loading && filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-600">
                Không tìm thấy khuyến mãi phù hợp.
              </div>
            ) : null}

            {filtered.map((p) => {
              return (
                <div key={p.id} className="px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-900 text-base truncate">
                        {p.name}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap ${statusStyle[p.status]}`}
                    >
                      {statusLabel[p.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <div className="text-[11px] text-gray-500">Giá trị</div>
                      <div className="font-semibold text-stone-900">
                        {p.valueLabel}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">
                        Đơn tối thiểu
                      </div>
                      <div className="font-medium">{p.minimumSpentLabel}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">Thời gian</div>
                      <div className="font-medium">
                        {p.startLabel} – {p.endLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-600"
                      aria-label="Copy mã"
                      onClick={async () => {
                        const text = p.code || "";
                        if (!text) return;
                        try {
                          await navigator.clipboard.writeText(text);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-xs leading-tight table-fixed">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="text-left px-2.5 py-2 font-semibold w-[14%]">
                    Mã
                  </th>
                  <th className="text-left px-2.5 py-2 font-semibold w-[22%]">
                    Tên
                  </th>
                  <th className="text-left px-2.5 py-2 font-semibold w-[14%]">
                    Giá trị
                  </th>
                  <th className="text-left px-2.5 py-2 font-semibold w-[16%]">
                    Đơn tối thiểu
                  </th>
                  <th className="text-left px-2.5 py-2 font-semibold w-[20%]">
                    Thời gian
                  </th>
                  <th className="text-left px-2.5 py-2 font-semibold w-[10%]">
                    Trạng thái
                  </th>
                  <th className="text-right px-2.5 py-2 font-semibold w-[4%]">
                    &nbsp;
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && promotions.length === 0
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-2.5 py-2">
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="px-2.5 py-2">
                          <Skeleton className="h-4 w-44" />
                        </td>
                        <td className="px-2.5 py-2">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-2.5 py-2">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-2.5 py-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-24 mt-2" />
                        </td>
                        <td className="px-2.5 py-2">
                          <Skeleton className="h-7 w-24 rounded-full" />
                        </td>
                        <td className="px-2.5 py-2 text-right">
                          <Skeleton className="h-8 w-10 ml-auto" />
                        </td>
                      </tr>
                    ))
                  : null}

                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-600"
                    >
                      Không tìm thấy khuyến mãi phù hợp.
                    </td>
                  </tr>
                ) : null}

                {filtered.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="px-2.5 py-2">
                        <div className="text-[11px] text-[#683a04] font-mono truncate">
                          {p.code || `#${p.id}`}
                        </div>
                      </td>

                      <td className="px-2.5 py-2">
                        <div className="font-semibold text-stone-900 text-sm truncate">
                          {p.name}
                        </div>
                      </td>

                      <td className="px-2.5 py-2">
                        <div className="font-semibold text-stone-900">
                          {p.valueLabel}
                        </div>
                      </td>

                      <td className="px-2.5 py-2 text-gray-700">
                        <span className="truncate block">
                          {p.minimumSpentLabel}
                        </span>
                      </td>

                      <td className="px-2.5 py-2 text-gray-700">
                        <div className="truncate">{p.startLabel}</div>
                        <div className="truncate">{p.endLabel}</div>
                      </td>

                      <td className="px-2.5 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border whitespace-nowrap ${statusStyle[p.status]}`}
                        >
                          {statusLabel[p.status]}
                        </span>
                      </td>

                      <td className="px-2.5 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600"
                            aria-label="Copy mã"
                            onClick={async () => {
                              const text = p.code || "";
                              if (!text) return;
                              try {
                                await navigator.clipboard.writeText(text);
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
