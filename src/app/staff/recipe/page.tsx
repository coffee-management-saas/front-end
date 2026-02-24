"use client";

import { useEffect, useMemo, useState } from "react";
import { Beaker, BookOpen, Coffee, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApiEnvelope, Product, ProductVariant } from "@/types/product";
import type { RecipeItemDto, RecipeResponse } from "@/types/recipes";
import type { Variant } from "@/types/variants";

type VariantLike = ProductVariant | Variant;

type VariantsApiResponse =
  | ApiEnvelope<VariantLike[]>
  | { code?: number; data?: VariantLike[]; message?: string };

type ProductsApiResponse =
  | ApiEnvelope<Product[]>
  | { code?: number; data?: Product[]; message?: string };

type VariantRow = {
  id: number;
  name: string;
  code: string;
  sku: string;
  size: string;
  price: number | null;
  costPrice: number | null;
  status: string;
};

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

function readDataArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const arr = (data as Record<string, unknown>).data;
  return Array.isArray(arr) ? (arr as T[]) : [];
}

function getVariantSizeLabel(v: VariantLike): string {
  if ("sizeCode" in v && typeof v.sizeCode === "string" && v.sizeCode.trim()) {
    return v.sizeCode;
  }
  if ("size" in v && typeof v.size === "string" && v.size.trim()) return v.size;
  if (
    "size" in v &&
    v.size &&
    typeof v.size === "object" &&
    "code" in v.size &&
    typeof v.size.code === "string" &&
    v.size.code.trim()
  ) {
    return v.size.code;
  }
  return "-";
}

function toVariantRow(v: VariantLike, productNameFallback = ""): VariantRow {
  const baseName =
    ("name" in v && typeof v.name === "string" ? v.name : "")?.trim() ||
    ("productName" in v && typeof v.productName === "string"
      ? v.productName
      : ""
    )?.trim() ||
    productNameFallback.trim() ||
    ("code" in v && typeof v.code === "string" ? v.code : "")?.trim() ||
    ("skuCode" in v && typeof v.skuCode === "string"
      ? v.skuCode
      : ""
    )?.trim() ||
    `Variant #${v.id}`;

  const code =
    ("code" in v && typeof v.code === "string" ? v.code : "")?.trim() ||
    ("skuCode" in v && typeof v.skuCode === "string"
      ? v.skuCode
      : ""
    )?.trim() ||
    ("sizeCode" in v && typeof v.sizeCode === "string"
      ? v.sizeCode
      : ""
    )?.trim() ||
    "-";

  const sku =
    ("skuCode" in v && typeof v.skuCode === "string"
      ? v.skuCode
      : ""
    )?.trim() || "-";

  const size = getVariantSizeLabel(v);

  const price =
    "price" in v && typeof v.price === "number" && Number.isFinite(v.price)
      ? v.price
      : null;
  const costPrice =
    "costPrice" in v &&
    typeof v.costPrice === "number" &&
    Number.isFinite(v.costPrice)
      ? v.costPrice
      : null;
  const status =
    "status" in v && typeof v.status === "string" && v.status.trim()
      ? v.status.toUpperCase()
      : "-";

  return {
    id: Number(v.id),
    name: size !== "-" ? `${baseName} (${size})` : baseName,
    code,
    sku,
    size,
    price,
    costPrice,
    status,
  };
}

export default function RecipePage() {
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const [variants, setVariants] = useState<VariantLike[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [variantsReloadKey, setVariantsReloadKey] = useState(0);

  const [activeVariantId, setActiveVariantId] = useState<number | null>(null);

  const [recipeItems, setRecipeItems] = useState<RecipeItemDto[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeReloadKey, setRecipeReloadKey] = useState(0);

  useEffect(() => {
    const run = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/products?${qs.toString()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res
          .json()
          .catch(() => null)) as ProductsApiResponse | null;

        if (!res.ok) {
          throw new Error(
            readMessage(data) || `Load products failed (${res.status})`,
          );
        }

        const list = readDataArray<Product>(data).filter(Boolean);
        setProducts(list);
        setSelectedProductId((prev) => prev ?? list[0]?.id ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load products failed";
        setProductsError(msg);
        setProducts([]);
        setSelectedProductId(null);
      } finally {
        setProductsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      const productId = selectedProductId;
      if (!productId) {
        setVariants([]);
        setVariantsError(null);
        setActiveVariantId(null);
        return;
      }

      setVariantsLoading(true);
      setVariantsError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        qs.set("productId", String(productId));
        const res = await fetch(`/api/variants?${qs.toString()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res
          .json()
          .catch(() => null)) as VariantsApiResponse | null;

        if (!res.ok) {
          throw new Error(
            readMessage(data) || `Load variants failed (${res.status})`,
          );
        }

        const list = readDataArray<VariantLike>(data);
        setVariants(list);
        setActiveVariantId((prev) => prev ?? list[0]?.id ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load variants failed";
        setVariantsError(msg);
        setVariants([]);
        setActiveVariantId(null);
      } finally {
        setVariantsLoading(false);
      }
    };

    run();
  }, [selectedProductId, variantsReloadKey]);

  useEffect(() => {
    const run = async () => {
      const id = activeVariantId;
      if (!id) {
        setRecipeItems([]);
        setRecipeError(null);
        return;
      }

      setRecipeLoading(true);
      setRecipeError(null);
      try {
        const res = await fetch(`/api/recipes/variant/${id}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as
          | RecipeResponse
          | { message?: string }
          | null;

        if (!res.ok) {
          throw new Error(
            data?.message || `Load recipes failed (${res.status})`,
          );
        }
        if (!data || typeof data !== "object") {
          throw new Error("Load recipes failed");
        }
        const record = data as Record<string, unknown>;
        if (!("data" in record) || !Array.isArray(record.data)) {
          throw new Error("Load recipes failed");
        }

        setRecipeItems(readDataArray<RecipeItemDto>(data).filter(Boolean));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load recipes failed";
        setRecipeError(msg);
        setRecipeItems([]);
      } finally {
        setRecipeLoading(false);
      }
    };

    run();
  }, [activeVariantId, recipeReloadKey]);

  const selectedProductName = useMemo(() => {
    const id = selectedProductId;
    if (!id) return "";
    return products.find((p) => p.id === id)?.name ?? "";
  }, [products, selectedProductId]);

  const rows = useMemo(() => {
    return variants
      .filter(Boolean)
      .map((v) => toVariantRow(v, selectedProductName));
  }, [selectedProductName, variants]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) => {
      return [r.name, r.code, r.sku, r.size]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [rows, search]);

  const activeRow =
    rows.find((r) => r.id === activeVariantId) ?? filtered[0] ?? null;

  const stats = useMemo(() => {
    return {
      total: rows.length,
      showing: filtered.length,
      ingredients: recipeItems.length,
    };
  }, [filtered.length, recipeItems.length, rows.length]);

  const formatMoney = (val: number | null) =>
    typeof val === "number" ? val.toLocaleString("vi-VN") : "-";

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xl text-[#693916] font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Công thức pha chế
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#cec3bc]/35 px-3 py-1.5 text-[#693916] border border-[#cec3bc]/60">
              <span className="h-2 w-2 rounded-full bg-[#693916]" />
              Tổng biến thể: {stats.total}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 border border-gray-200">
              <span className="h-2 w-2 rounded-full bg-gray-500" />
              Đang hiển thị: {stats.showing}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-gray-700 border border-gray-200">
              <span className="h-2 w-2 rounded-full bg-[#876F60]" />
              Nguyên liệu: {stats.ingredients}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món / mã / SKU / size"
            className="border-0 shadow-none focus-visible:ring-0 text-xs h-8 min-w-[220px] px-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
            value={selectedProductId ?? ""}
            onChange={(e) => {
              const next = Number(e.target.value);
              setSelectedProductId(Number.isFinite(next) ? next : null);
              setActiveVariantId(null);
              setRecipeItems([]);
              setRecipeError(null);
            }}
            disabled={productsLoading || products.length === 0}
          >
            {products.length === 0 ? (
              <option value="">
                {productsLoading ? "Đang tải sản phẩm..." : "Không có sản phẩm"}
              </option>
            ) : (
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7 xl:col-span-8 overflow-hidden">
          <CardContent className="p-0 -mt-px">
            {productsError && (
              <div className="px-3 py-2 text-sm text-red-700 bg-red-50 border-b border-red-100">
                {productsError}
              </div>
            )}
            {variantsError && (
              <div className="px-3 py-2 text-sm text-red-700 bg-red-50 border-b border-red-100">
                {variantsError}
              </div>
            )}

            <div className="overflow-auto">
              <table className="min-w-full text-xs leading-tight">
                <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-2.5 py-2 text-left font-semibold">Món</th>
                    <th className="px-2.5 py-2 text-left font-semibold">SKU</th>
                    <th className="px-2.5 py-2 text-left font-semibold">
                      Size
                    </th>

                    <th className="px-2.5 py-2 text-left font-semibold">
                      Trạng thái
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {variantsLoading && filtered.length === 0 ? (
                    <tr>
                      <td className="px-2.5 py-3 text-gray-600" colSpan={7}>
                        Đang tải danh sách...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-2.5 py-3 text-gray-600" colSpan={7}>
                        Không có dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr
                        key={r.id}
                        className={`border-b last:border-0 cursor-pointer hover:bg-[#cec3bc]/25 ${
                          activeRow?.id === r.id
                            ? "bg-[#cec3bc]/20"
                            : "bg-white"
                        }`}
                        onClick={() => setActiveVariantId(r.id)}
                      >
                        <td className="px-2.5 py-2">
                          <div className="font-semibold text-stone-900 text-sm leading-tight">
                            {r.name}
                          </div>
                        </td>
                        <td className="px-2.5 py-2 text-gray-700">{r.sku}</td>
                        <td className="px-2.5 py-2 text-gray-700">{r.size}</td>

                        <td className="px-2.5 py-2 text-gray-700">
                          {r.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5 xl:col-span-4 h-fit sticky top-4">
          <CardHeader className="px-3 py-2 border-b space-y-0.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Chi tiết định lượng</CardTitle>
              <span className="text-[11px] text-gray-500">
                Máy POS • nội bộ
              </span>
            </div>
            {activeRow && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#cec3bc] px-2 py-1 font-semibold text-[#693916]">
                  <Beaker className="w-3.5 h-3.5" /> Size {activeRow.size}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 border text-gray-700">
                  <Coffee className="w-3.5 h-3.5" /> {recipeItems.length} NL
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 border text-gray-700">
                  Mã {activeRow.sku}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 border text-gray-700">
                  Giá {formatMoney(activeRow.price)}
                </span>
              </div>
            )}
          </CardHeader>

          {activeRow ? (
            <CardContent className="space-y-4 px-4 pb-5 -mt-px">
              <div>
                <p className="text-sm font-semibold text-stone-900 mb-2">
                  Nguyên liệu • {activeRow.name}
                </p>

                {recipeLoading ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-sm text-gray-600">
                    Đang tải công thức...
                  </div>
                ) : recipeError ? (
                  <div className="rounded-xl border border-red-100 bg-red-50/40 p-3 text-sm text-red-700">
                    {recipeError}
                  </div>
                ) : recipeItems.length === 0 ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-sm text-gray-600">
                    Chưa có công thức cho biến thể này.
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y">
                    {recipeItems.map((ing) => (
                      <div
                        key={`${ing.id}-${ing.ingredientId}`}
                        className="flex items-center justify-between px-3 py-2 text-sm text-gray-800 gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate">
                            {ing.ingredientName ??
                              `Nguyên liệu #${ing.ingredientId}`}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            Ghi chú: {String(ing.note ?? "").trim() || "-"}
                          </div>
                        </div>
                        <span className="font-semibold text-stone-900 whitespace-nowrap">
                          {Number(ing.quantityRequired ?? 0).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          {ing.unitName ?? ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="h-9 text-sm w-full hover:bg-gray-50"
                type="button"
                onClick={() => setRecipeReloadKey((k) => k + 1)}
                disabled={recipeLoading}
              >
                {recipeLoading ? "Đang tải..." : "Tải lại công thức"}
              </Button>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-gray-600">
                Chọn một biến thể để xem công thức.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
