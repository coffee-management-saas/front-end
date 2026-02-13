"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
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
  isPopular?: boolean;
}

interface BeverageCardProps {
  beverage: Beverage;
  index?: number;
}

function BeverageCard({ beverage, index = 0 }: BeverageCardProps) {
  const slug = toProductSlug(beverage.name, beverage.id);
  return (
    <div
      className={cn(
        "group bg-card rounded-2xl overflow-hidden shadow-soft border border-border/30",
        "hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300",
        "animate-scale-in",
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative h-56 overflow-hidden bg-secondary/30">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <img
            src={beverage.image}
            alt={beverage.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Link>

        {beverage.isPopular && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full shadow-lg">
            Bán chạy
          </div>
        )}

        <Link
          href={`/products/${slug}`}
          className={cn(
            "absolute bottom-3 right-3 w-10 h-10 rounded-full",
            "bg-primary text-primary-foreground shadow-warm",
            "flex items-center justify-center",
            "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
            "transition-all duration-300 hover:scale-110 active:scale-95",
          )}
          aria-label={`Đặt mua ${beverage.name}`}
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-lg text-foreground mb-1 line-clamp-1">
          {beverage.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {beverage.description}
        </p>
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

          image:
            p.image ??
            "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
          category: p.categoryName ?? "",
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
        <h1 className="text-2xl font-display font-semibold">Menu đồ uống</h1>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {beverages.map((b, i) => (
          <BeverageCard key={b.id} beverage={b} index={i} />
        ))}
      </div>
    </div>
  );
}

function toProductSlug(name: string, id: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "san-pham"}-${id}`;
}
