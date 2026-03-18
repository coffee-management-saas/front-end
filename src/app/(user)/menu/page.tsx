"use client";

import { cn, formatCurrency, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import { Flame, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getProducts } from "@/services/product.service";
import type { Product } from "@/types/product";

export interface Beverage {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  isPopular?: boolean;
}

interface BeverageCardProps {
  beverage: Beverage;
  index?: number;
}

function BeverageCard({ beverage, index = 0 }: BeverageCardProps) {
  const slug = toProductSlug(beverage.name, beverage.id);
  const [imgSrc, setImgSrc] = useState(beverage.image);

  // useEffect(() => {
  //   setImgSrc(beverage.image);
  // }, [beverage.image]);

  return (
    <div
      className={cn(
        "group rounded-2xl overflow-hidden border border-[#EDE2D7] bg-white min-h-[392px] flex flex-col",
        "shadow-[0_18px_50px_-34px_rgba(0,0,0,0.45)] hover:shadow-[0_26px_70px_-40px_rgba(0,0,0,0.55)]",
        "hover:-translate-y-1 transition-all duration-300",
        "animate-scale-in",
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative h-64 overflow-hidden bg-[#F7F1EA] sm:h-72">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <img
            src={imgSrc}
            alt={beverage.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={() => {
              setImgSrc((prev) =>
                prev === FALLBACK_IMG ? prev : FALLBACK_IMG,
              );
            }}
          />
        </Link>

        {beverage.isPopular && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E23B2E] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.65)]">
            <Flame className="size-3" />
            HOT
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-[#B36A2E] uppercase">
          {beverage.category || "Sản phẩm"}
        </div>
        <h3 className="mt-1 font-display font-semibold text-base text-[#3b2314] line-clamp-2">
          {beverage.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#9E8B7C] line-clamp-3">
          {beverage.description}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-display text-lg font-bold text-[#7a4a2a]">
            {formatCurrency(beverage.price)}
          </span>
          <Link
            href={`/products/${slug}`}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-[#7a4a2a] text-white",
              "shadow-[0_16px_34px_-18px_rgba(0,0,0,0.65)]",
              "transition-transform duration-200 hover:scale-110 active:scale-95",
            )}
            aria-label={`Đặt mua ${beverage.name}`}
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const searchParams = useSearchParams();
  const categoryId = useMemo(() => {
    const v = searchParams.get("categoryId");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId == null) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getProducts({
          page: 0,
          size: 20,
          categoryId,
          status: "ACTIVE",
        });

        const items: Product[] = result.data;

        const mapped: Beverage[] = items.map((p) => ({
          id: String(p.id),
          name: p.name,
          description: p.description ?? "",

          image: canUseImage(p.image) ? p.image! : FALLBACK_IMG,
          category: p.categoryName ?? "",
          price: p.price ?? 0,
          isPopular: false,
        }));

        setBeverages(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load products failed");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [categoryId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[#3b2314] line-clamp-2">
          Tất cả sản phẩm
        </h1>
        {loading && (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {!loading && !error && beverages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Không có sản phẩm trong danh mục này.
        </p>
      )}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {beverages.map((b, i) => (
          <BeverageCard key={b.id} beverage={b} index={i} />
        ))}
      </div>
    </div>
  );
}

function toProductSlug(name: string, id: string) {
  const base = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "san-pham"}-${id}`;
}
