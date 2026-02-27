"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, Gem, Medal, Star } from "lucide-react";

type RankStatus = "ACTIVE" | "INACTIVE" | "DELETED" | string;

type MembershipRank = {
  id: number;
  rankName: string;
  pointRate: number;
  requiredPoints: number;
  status: RankStatus;
};

type MembershipRanksResponse = {
  code: number;
  status: string;
  message: string;
  data: MembershipRank[];
};

function normalizeRankName(name: string) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function formatNumber(value: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(value);
  } catch {
    return String(value);
  }
}

function rankTheme(rankName: string) {
  const n = normalizeRankName(rankName);

  if (n.includes("BRONZE") || n.includes("ĐỒNG") || n.includes("DONG")) {
    return {
      label: "BRONZE",
      Icon: Crown,
      accent: "text-amber-700",
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      cardBorder: "border-gray-200",
      topBar: "bg-amber-400",
      iconBg: "bg-amber-50 border-amber-100",
      dot: "bg-amber-500",
      multiplier: "text-amber-700",
    };
  }
  if (n.includes("SILVER") || n.includes("BẠC") || n.includes("BAC")) {
    return {
      label: "SILVER",
      Icon: Star,
      accent: "text-slate-500",
      badge: "border-slate-200 bg-slate-50 text-slate-700",
      cardBorder: "border-gray-200",
      topBar: "bg-slate-300",
      iconBg: "bg-slate-50 border-slate-100",
      dot: "bg-slate-400",
      multiplier: "text-slate-400",
    };
  }
  if (n.includes("GOLD") || n.includes("VÀNG") || n.includes("VANG")) {
    return {
      label: "GOLD",
      Icon: Medal,
      accent: "text-amber-600",
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      cardBorder: "border-amber-200",
      topBar: "bg-amber-500",
      iconBg: "bg-amber-50 border-amber-100",
      dot: "bg-amber-500",
      multiplier: "text-amber-500",
    };
  }
  if (
    n.includes("PLATINUM") ||
    n.includes("BẠCH KIM") ||
    n.includes("BACH KIM")
  ) {
    return {
      label: "PLATINUM",
      Icon: Crown,
      accent: "text-emerald-700",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      cardBorder: "border-emerald-200",
      topBar: "bg-emerald-500",
      iconBg: "bg-emerald-50 border-emerald-100",
      dot: "bg-emerald-500",
      multiplier: "text-emerald-600",
    };
  }
  if (
    n.includes("DIAMOND") ||
    n.includes("KIM CƯƠNG") ||
    n.includes("KIM CUONG")
  ) {
    return {
      label: "DIAMOND",
      Icon: Gem,
      accent: "text-sky-600",
      badge: "border-sky-200 bg-sky-50 text-sky-800",
      cardBorder: "border-sky-200",
      topBar: "bg-sky-500",
      iconBg: "bg-sky-50 border-sky-100",
      dot: "bg-sky-500",
      multiplier: "text-sky-500",
    };
  }

  return {
    label: rankName || "RANK",
    Icon: Star,
    accent: "text-emerald-600",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    cardBorder: "border-gray-200",
    topBar: "bg-emerald-500",
    iconBg: "bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-500",
    multiplier: "text-emerald-600",
  };
}

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text().catch(() => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function MembershipPage() {
  const [ranks, setRanks] = useState<MembershipRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const qs = new URLSearchParams({ page: "0", size: "100" });
        const res = await fetch(`/api/membership-ranks?${qs.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        const payload = await parseJsonSafely<
          MembershipRanksResponse | { message?: string }
        >(res);

        if (!res.ok || !payload || Array.isArray(payload)) {
          const msg =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as Record<string, unknown>).message ?? "")
              : "";
          throw new Error(msg || `Load ranks failed (${res.status})`);
        }

        const envelope = payload as MembershipRanksResponse;
        if (envelope.code !== 200 || !Array.isArray(envelope.data)) {
          throw new Error(envelope.message || "Load ranks failed");
        }

        const items = envelope.data
          .filter((r) => r && typeof r.id === "number")
          .map((r) => ({
            id: r.id,
            rankName: String(r.rankName ?? ""),
            pointRate: Number(r.pointRate ?? 0),
            requiredPoints: Number(r.requiredPoints ?? 0),
            status: String(r.status ?? ""),
          }));

        if (active) setRanks(items);
      } catch (e) {
        if (!active) return;
        setError(
          e instanceof Error
            ? e.message
            : "Không thay đổi được hạng thành viên",
        );
        setRanks([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  const activeRanks = useMemo(
    () => ranks.filter((r) => String(r.status).toUpperCase() === "ACTIVE"),
    [ranks],
  );

  const ranksForUI = activeRanks.length > 0 ? activeRanks : ranks;

  const popularId = useMemo(() => {
    const sorted = [...ranksForUI].sort(
      (a, b) => a.requiredPoints - b.requiredPoints,
    );
    if (sorted.length < 3) return null;
    return sorted[Math.floor(sorted.length / 2)]?.id ?? null;
  }, [ranksForUI]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F5] to-white text-gray-900">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-800">
            <Crown className="h-4 w-4" />
            CẤP ĐỘ THÀNH VIÊN
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Danh sách hạng thành viên
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Xem danh sách hạng và điều kiện tích điểm để bạn biết mình đang ở
            đâu và cần bao nhiêu điểm để lên hạng.
          </p>
        </div>

        {error && !loading ? (
          <div className="mt-8 text-center">
            <Link
              href="/login?force=1"
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              Đăng nhập để xem hạng
            </Link>
          </div>
        ) : null}

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-xl bg-gray-100" />
                  <div className="mt-4 h-4 w-24 rounded bg-gray-100" />
                  <div className="mt-3 h-10 w-32 rounded bg-gray-100" />
                  <div className="mt-6 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
              ))
            : ranksForUI.map((rank) => {
                const theme = rankTheme(rank.rankName);
                const isPopular = popularId !== null && rank.id === popularId;
                const isInactive =
                  String(rank.status).toUpperCase() !== "ACTIVE";

                return (
                  <div
                    key={rank.id}
                    className={[
                      "relative rounded-2xl border bg-white p-6 shadow-sm",
                      theme.cardBorder,
                      isPopular ? "shadow-md ring-2 ring-amber-200" : "",
                      isInactive ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <div
                      className={`absolute top-0 left-1/2 h-1 w-20 -translate-x-1/2 rounded-b-full sm:w-24 ${theme.topBar}`}
                    />

                    <div className="flex items-center justify-between">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center border ${theme.iconBg}`}
                      >
                        <theme.Icon className={`h-6 w-6 ${theme.accent}`} />
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}
                      >
                        {theme.label}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {rank.rankName}
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        Yêu cầu tối thiểu{" "}
                        <span className="font-semibold text-gray-900">
                          {formatNumber(rank.requiredPoints)}
                        </span>{" "}
                        điểm để đạt hạng.
                      </p>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end gap-2">
                        <span
                          className={`text-4xl font-extrabold tracking-tight ${theme.multiplier}`}
                        >
                          x
                          {Number.isFinite(rank.pointRate) ? rank.pointRate : 0}
                        </span>
                        <span className="pb-1 text-sm text-gray-500">
                          tích điểm
                        </span>
                      </div>
                      <div className="mt-4 h-px w-full bg-gray-100" />
                    </div>

                    <ul className="mt-6 space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span
                          className={`mt-1 h-1.5 w-1.5 rounded-full ${theme.dot}`}
                        />
                        <span>
                          Điều kiện:{" "}
                          <b className="text-gray-900">
                            {formatNumber(rank.requiredPoints)}
                          </b>{" "}
                          Điểm
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span
                          className={`mt-1 h-1.5 w-1.5 rounded-full ${theme.dot}`}
                        />
                        <span>
                          Tỷ lệ tích điểm:{" "}
                          <b className="text-gray-900">x{rank.pointRate}</b>
                        </span>
                      </li>
                    </ul>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
