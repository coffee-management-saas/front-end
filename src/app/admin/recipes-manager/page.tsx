"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Filter, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { IngredientDto } from "@/types/ingredient";
import type { Product, ProductVariant } from "@/types/product";
import type {
  IngredientsApiResponse,
  ProductsApiResponse,
  RecipeApiResponse,
  RecipeCreateInput,
  RecipeForm,
  RecipeItemDto,
  RecipeResponse,
  RecipeItemForm,
  ToppingsApiResponse,
  VariantsApiResponse,
} from "@/types/recipes";
import type { ToppingDto } from "@/types/topping";
import type { IngredientBaseUnit } from "@/types/ingredient";

type RecipeFormErrors = Partial<
  Record<keyof Pick<RecipeForm, "variantId" | "toppingId">, string>
> & {
  items?: string;
};

type RecipeItemErrors = Partial<Record<keyof RecipeItemForm, string>>;

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const normalizeIngredients = (payload: unknown): IngredientDto[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as IngredientDto[];
  if (data && typeof data === "object") {
    const nested = data as {
      data?: unknown;
      content?: unknown;
      items?: unknown;
    };
    if (Array.isArray(nested.data)) return nested.data as IngredientDto[];
    if (Array.isArray(nested.content)) return nested.content as IngredientDto[];
    if (Array.isArray(nested.items)) return nested.items as IngredientDto[];
  }
  return [];
};

const normalizeVariants = (payload: unknown): VariantRow[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  const list = Array.isArray(data) ? data : null;
  if (!list && data && typeof data === "object") {
    const nested = data as {
      data?: unknown;
      content?: unknown;
      items?: unknown;
    };
    if (Array.isArray(nested.data)) return nested.data.map(mapVariant);
    if (Array.isArray(nested.content)) return nested.content.map(mapVariant);
    if (Array.isArray(nested.items)) return nested.items.map(mapVariant);
  }
  if (list) return list.map(mapVariant);
  return [];
};

const normalizeProducts = (payload: unknown): Product[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object") {
    const nested = data as {
      data?: unknown;
      content?: unknown;
      items?: unknown;
    };
    if (Array.isArray(nested.data)) return nested.data as Product[];
    if (Array.isArray(nested.content)) return nested.content as Product[];
    if (Array.isArray(nested.items)) return nested.items as Product[];
  }
  return [];
};

type VariantLike = {
  id?: number;
  productId?: number;
  price?: number;
  code?: string;
  skuCode?: string;
  name?: string;
  productName?: string;
  size?: string | { name?: string; code?: string };
  sizeCode?: string;
  image?: string | null;
  status?: string;
};

type VariantRow = ProductVariant & { status?: string };

const mapVariant = (item: unknown): VariantRow => {
  const raw = (item ?? {}) as VariantLike;
  return {
    id: Number(raw.id ?? 0),
    productId: Number(raw.productId ?? 0),
    price: Number(raw.price ?? 0),
    code: raw.code ?? raw.skuCode ?? "",
    name: raw.name ?? raw.productName ?? "",
    size:
      typeof raw.size === "string"
        ? raw.size
        : (raw.size?.name ?? raw.size?.code),
    sizeCode: raw.sizeCode,
    image: raw.image ?? null,
    status: raw.status,
  };
};

const normalizeToppings = (payload: unknown): ToppingDto[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data as ToppingDto[];
  return [];
};

const toForm = (): RecipeForm => ({
  variantId: 0,
  toppingId: 0,
  items: [
    {
      ingredientId: 0,
      quantityRequired: 0,
      note: "",
    },
  ],
});

const STORAGE = {
  productId: "recipes.selectedProductId",
  viewVariantId: "recipes.viewVariantId",
} as const;

const resolveVariantSize = (variant: ProductVariant): string => {
  if (typeof variant.size === "string") return variant.size;
  if (variant.size && typeof variant.size === "object") {
    return variant.size.name || variant.size.code || "";
  }
  return variant.sizeCode || "";
};

const formatStatus = (status?: string): string => {
  const value = status?.toUpperCase();
  if (value === "ACTIVE") return "Hoạt động";
  if (value === "INACTIVE") return "Tạm dừng";
  return "-";
};

const formatUnitLabel = (unit?: IngredientBaseUnit): string => {
  if (!unit) return "";
  switch (unit) {
    case "GRAM":
      return "G";
    case "KILOGRAM":
      return "KG";
    case "LITER":
      return "L";
    case "MILLILITER":
      return "ML";
    case "PIECE":
      return "CÁI";
    case "PAIR":
      return "ĐÔI";
    default:
      return unit;
  }
};

export default function RecipesManagerPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<RecipeForm>(() => toForm());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [itemErrors, setItemErrors] = useState<RecipeItemErrors[]>([{}]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [toppings, setToppings] = useState<ToppingDto[]>([]);
  const [toppingsLoading, setToppingsLoading] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantRow | null>(
    null,
  );
  const [pendingViewVariantId, setPendingViewVariantId] = useState<
    number | null
  >(null);
  const safeIngredients = useMemo(
    () => ingredients.filter(Boolean) as IngredientDto[],
    [ingredients],
  );
  const safeVariants = useMemo(
    () => variants.filter(Boolean) as VariantRow[],
    [variants],
  );
  const safeToppings = useMemo(
    () => toppings.filter(Boolean) as ToppingDto[],
    [toppings],
  );
  const safeProducts = useMemo(
    () => products.filter(Boolean) as Product[],
    [products],
  );
  const filteredVariants = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return safeVariants;
    return safeVariants.filter((variant) => {
      const sizeLabel = resolveVariantSize(variant);
      return [variant.name, variant.code, variant.sizeCode, sizeLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [safeVariants, searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedProductId = window.localStorage.getItem(STORAGE.productId);
    const storedViewVariantId = window.localStorage.getItem(
      STORAGE.viewVariantId,
    );

    if (storedProductId && !Number.isNaN(Number(storedProductId))) {
      setSelectedProductId(Number(storedProductId));
    }
    if (storedViewVariantId && !Number.isNaN(Number(storedViewVariantId))) {
      setPendingViewVariantId(Number(storedViewVariantId));
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setIngredientsLoading(true);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/ingredients?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await parseJsonSafely<IngredientsApiResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load ingredients failed");
        }

        setIngredients(normalizeIngredients(data).filter(Boolean));
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
    const run = async () => {
      setProductsLoading(true);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/products?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await parseJsonSafely<ProductsApiResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load products failed");
        }

        const items = normalizeProducts(data).filter(Boolean);
        setProducts(items);
        if (items.length > 0) {
          setSelectedProductId((prev) => {
            if (prev === "") return items[0].id;
            return items.some((p) => p.id === prev) ? prev : items[0].id;
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load products failed";
        toast.error(msg);
      } finally {
        setProductsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedProductId === "") {
      window.localStorage.removeItem(STORAGE.productId);
      return;
    }
    window.localStorage.setItem(STORAGE.productId, String(selectedProductId));
  }, [selectedProductId]);

  useEffect(() => {
    const run = async () => {
      setVariantsLoading(true);
      setVariantsError(null);
      try {
        if (selectedProductId === "") {
          setVariants([]);
          return;
        }
        const qs = new URLSearchParams({ page: "0", size: "200" });
        qs.set("productId", String(selectedProductId));
        const res = await fetch(`/api/variants?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await parseJsonSafely<VariantsApiResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load variants failed");
        }

        setVariants(normalizeVariants(data).filter(Boolean));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load variants failed";
        setVariantsError(msg);
        toast.error(msg);
      } finally {
        setVariantsLoading(false);
      }
    };

    run();
  }, [selectedProductId]);

  useEffect(() => {
    if (!pendingViewVariantId || pendingViewVariantId <= 0) return;
    const found = safeVariants.find(
      (variant) => Number(variant.id) === pendingViewVariantId,
    );
    if (!found) return;
    setViewMode(true);
    setSelectedVariant(found);
    setForm({ ...toForm(), variantId: Number(found.id) });
    setErrors({});
    setItemErrors([{}]);
    setDialogOpen(true);
  }, [pendingViewVariantId, safeVariants]);

  useEffect(() => {
    const run = async () => {
      setToppingsLoading(true);
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/products/toppings?${qs.toString()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await parseJsonSafely<ToppingsApiResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load toppings failed");
        }

        setToppings(
          normalizeToppings(data).filter(
            (topping) =>
              topping &&
              String(topping.status ?? "").toUpperCase() === "ACTIVE",
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load toppings failed";
        toast.error(msg);
      } finally {
        setToppingsLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!dialogOpen || !viewMode) return;
      const variantId = Number(form.variantId);
      if (!Number.isFinite(variantId) || variantId <= 0) return;

      setRecipesLoading(true);
      try {
        const res = await fetch(`/api/recipes/variant/${variantId}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await parseJsonSafely<RecipeResponse>(res);

        if (!res.ok || !data || (data.code ?? 200) >= 400) {
          throw new Error(data?.message || "Load recipes failed");
        }

        const items = (data.data ?? []) as RecipeItemDto[];
        if (items.length > 0) {
          const nextItems = items.map((item) => ({
            ingredientId: Number(item.ingredientId ?? 0),
            quantityRequired: Number(item.quantityRequired ?? 0),
            note: item.note ?? "",
          }));
          setForm((prev) => ({
            ...prev,
            toppingId: Number(items[0].toppingId ?? 0),
            items: nextItems,
          }));
          setErrors({});
          setItemErrors(nextItems.map(() => ({})));
        } else {
          const nextItems = [
            {
              ingredientId: 0,
              quantityRequired: 0,
              note: "",
            },
          ];
          setForm((prev) => ({
            ...prev,
            toppingId: 0,
            items: nextItems,
          }));
          setErrors({});
          setItemErrors(nextItems.map(() => ({})));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load recipes failed";
        toast.error(msg);
      } finally {
        setRecipesLoading(false);
      }
    };

    run();
  }, [dialogOpen, form.variantId, viewMode]);

  const updateItem = (index: number, patch: Partial<RecipeItemForm>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
    setItemErrors((prev) => {
      const next = prev.length ? [...prev] : [];
      while (next.length <= index) next.push({});
      const current = next[index] ?? {};
      const merged: RecipeItemErrors = { ...current };
      (Object.keys(patch) as Array<keyof RecipeItemForm>).forEach((k) => {
        delete merged[k];
      });
      next[index] = merged;
      return next;
    });
    setErrors((prev) => {
      if (!prev.items) return prev;
      const next = { ...prev };
      delete next.items;
      return next;
    });
  };

  const addItem = () => {
    if (viewMode) return;
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { ingredientId: 0, quantityRequired: 0, note: "" },
      ],
    }));
    setItemErrors((prev) => [...prev, {}]);
    setErrors((prev) => {
      if (!prev.items) return prev;
      const next = { ...prev };
      delete next.items;
      return next;
    });
  };

  const removeItem = (index: number) => {
    if (viewMode) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setItemErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (submitting) return;

    const payload: RecipeCreateInput = {
      variantId: Number(form.variantId),
      toppingId: Number(form.toppingId),
      items: [],
    };

    const nextErrors: RecipeFormErrors = {};
    const nextItemErrors: RecipeItemErrors[] = form.items.map(() => ({}));

    if (!payload.variantId || payload.variantId <= 0) {
      nextErrors.variantId = "Vui lòng chọn biến thể";
    }

    if (!payload.toppingId || payload.toppingId <= 0) {
      nextErrors.toppingId = "Vui lòng chọn topping";
    }

    const isRowEmpty = (row: RecipeItemForm) =>
      Number(row.ingredientId) <= 0 &&
      Number(row.quantityRequired) === 0 &&
      !row.note.trim();

    const firstIndexByIngredient = new Map<number, number>();
    let hasAtLeastOneItem = false;

    form.items.forEach((row, index) => {
      if (isRowEmpty(row)) return;
      hasAtLeastOneItem = true;

      const ingredientId = Number(row.ingredientId);
      if (!ingredientId || ingredientId <= 0) {
        nextItemErrors[index].ingredientId = "Vui lòng chọn nguyên liệu";
      } else {
        const existedIndex = firstIndexByIngredient.get(ingredientId);
        if (typeof existedIndex === "number") {
          nextItemErrors[index].ingredientId = "Nguyên liệu bị trùng";
          nextItemErrors[existedIndex].ingredientId = "Nguyên liệu bị trùng";
        } else {
          firstIndexByIngredient.set(ingredientId, index);
        }
      }

      const qty = Number(row.quantityRequired);
      if (!Number.isFinite(qty) || qty <= 0) {
        nextItemErrors[index].quantityRequired = "Số lượng phải > 0";
      }

      payload.items.push({
        ingredientId,
        quantityRequired: qty,
        note: row.note.trim() || null,
      });
    });

    if (!hasAtLeastOneItem) {
      nextErrors.items = "Vui lòng thêm ít nhất 1 nguyên liệu";
    }

    const hasItemErrors = nextItemErrors.some((e) => Object.keys(e).length > 0);

    if (Object.keys(nextErrors).length > 0 || hasItemErrors) {
      setErrors(nextErrors);
      setItemErrors(nextItemErrors);
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setErrors({});
    setItemErrors(form.items.map(() => ({})));

    setSubmitting(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely<RecipeApiResponse>(res);

      if (!res.ok || !data || (data.code ?? 200) >= 400) {
        throw new Error(data?.message || "Create recipe failed");
      }

      toast.success("Đã tạo/cập nhật công thức");
      setDialogOpen(false);
      setForm(toForm());
      setErrors({});
      setItemErrors([{}]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create recipe failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Công thức</h1>
            <p className="text-muted-foreground mt-1">
              Tạo công thức nguyên liệu cho sản phẩm.
            </p>
          </div>
          <Button
            onClick={() => {
              setViewMode(false);
              setSelectedVariant(null);
              setSubmitting(false);
              setErrors({});
              setItemErrors([{}]);
              setForm(toForm());
              setDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo công thức
          </Button>
        </div>

        <div className="admin-card">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full max-w-sm items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, mã, size..."
                    className="pl-10 bg-background"
                  />
                </div>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setProductFilterOpen((prev) => !prev)}
                    className="h-9 w-9"
                    aria-label="Lọc sản phẩm"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  {productFilterOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-20">
                      <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                        {productsLoading
                          ? "Đang tải sản phẩm..."
                          : "Chọn sản phẩm"}
                      </div>
                      <select
                        className="h-9 text-sm w-full bg-background px-3 outline-none"
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(
                            e.target.value === "" ? "" : Number(e.target.value),
                          );
                          setProductFilterOpen(false);
                        }}
                      >
                        <option value="" disabled>
                          {productsLoading
                            ? "Đang tải sản phẩm..."
                            : "Chọn sản phẩm"}
                        </option>
                        {safeProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Variant</TableHead>
                  <TableHead className="font-semibold text-center">
                    Size
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Xem
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải danh sách biến thể...
                    </TableCell>
                  </TableRow>
                ) : variantsError ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-destructive"
                    >
                      {variantsError}
                    </TableCell>
                  </TableRow>
                ) : filteredVariants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      {safeVariants.length === 0
                        ? "Sản phẩm này chưa có biến thể."
                        : "Không tìm thấy biến thể phù hợp."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVariants.map((variant) => (
                    <TableRow key={variant.id} className="admin-table-row">
                      <TableCell>
                        {variant.name ||
                          variant.code ||
                          resolveVariantSize(variant) ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {resolveVariantSize(variant) || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatStatus(variant.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (!variant.id || Number(variant.id) <= 0) {
                              toast.error("VariantId không hợp lệ");
                              return;
                            }
                            setViewMode(true);
                            setSelectedVariant(variant);
                            setSubmitting(false);
                            setErrors({});
                            setItemErrors([{}]);
                            setForm({
                              ...toForm(),
                              variantId: Number(variant.id),
                            });
                            setDialogOpen(true);
                            if (typeof window !== "undefined") {
                              window.localStorage.setItem(
                                STORAGE.viewVariantId,
                                String(variant.id),
                              );
                            }
                          }}
                          aria-label="Xem công thức"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && submitting) return;
          setDialogOpen(open);
          if (!open) {
            setViewMode(false);
            setSelectedVariant(null);
            setForm(toForm());
            setErrors({});
            setItemErrors([{}]);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(STORAGE.viewVariantId);
            }
            setPendingViewVariantId(null);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          onEscapeKeyDown={(e) => {
            if (submitting) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (submitting) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {viewMode ? "Xem công thức" : "Tạo công thức"}
            </DialogTitle>
            <DialogDescription>
              Công thức và thành phần nguyên liệu.
              {recipesLoading && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Đang tải công thức theo biến thể...
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewMode && selectedVariant && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-sm font-medium text-foreground mb-2">
                Thông tin biến thể
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <div className="text-muted-foreground">
                  Tên
                  <div className="text-foreground font-medium">
                    {selectedVariant.name ||
                      selectedVariant.code ||
                      resolveVariantSize(selectedVariant) ||
                      "-"}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Size
                  <div className="text-foreground font-medium">
                    {resolveVariantSize(selectedVariant) || "-"}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Mã
                  <div className="text-foreground font-medium">
                    {selectedVariant.code || "-"}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Trạng thái
                  <div className="text-foreground font-medium">
                    {formatStatus(selectedVariant.status)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="variantId">Tên Biến thể </Label>
              <select
                id="variantId"
                className={`h-9 text-sm w-full rounded-md border bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:appearance-none ${
                  errors.variantId
                    ? "border-destructive focus:ring-destructive/30"
                    : "border-input"
                }`}
                value={form.variantId || ""}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    variantId: Number(e.target.value),
                  }));
                  setErrors((prev) => {
                    if (!prev.variantId) return prev;
                    const next = { ...prev };
                    delete next.variantId;
                    return next;
                  });
                }}
                disabled={viewMode || submitting}
              >
                <option value="" disabled>
                  Chọn biến thể
                </option>
                {variantsLoading ? (
                  <option value="" disabled>
                    Đang tải danh sách biến thể...
                  </option>
                ) : variantsError ? (
                  <option value="" disabled>
                    {variantsError}
                  </option>
                ) : safeVariants.length === 0 ? (
                  <option value="" disabled>
                    Sản phẩm này chưa có biến thể
                  </option>
                ) : (
                  safeVariants.map((variant) => {
                    const sizeLabel = resolveVariantSize(variant);
                    const label = [variant.name || variant.code, sizeLabel]
                      .filter(Boolean)
                      .join(" - ");
                    return (
                      <option key={variant.id} value={variant.id}>
                        {label || "-"}
                      </option>
                    );
                  })
                )}
              </select>
              {!viewMode && errors.variantId ? (
                <p className="text-xs text-destructive">{errors.variantId}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toppingId">Topping</Label>
              <select
                id="toppingId"
                className={`h-9 text-sm w-full rounded-md border bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:appearance-none ${
                  errors.toppingId
                    ? "border-destructive focus:ring-destructive/30"
                    : "border-input"
                }`}
                value={form.toppingId || ""}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    toppingId: Number(e.target.value),
                  }));
                  setErrors((prev) => {
                    if (!prev.toppingId) return prev;
                    const next = { ...prev };
                    delete next.toppingId;
                    return next;
                  });
                }}
                disabled={viewMode || submitting}
              >
                <option value="" disabled>
                  Chọn topping
                </option>
                {toppingsLoading ? (
                  <option value="" disabled>
                    Đang tải danh sách topping...
                  </option>
                ) : (
                  safeToppings.map((topping) => (
                    <option key={topping.id} value={topping.id}>
                      {topping.name}
                    </option>
                  ))
                )}
              </select>
              {!viewMode && errors.toppingId ? (
                <p className="text-xs text-destructive">{errors.toppingId}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Nguyên liệu</Label>
              {!viewMode && errors.items ? (
                <p className="text-xs text-destructive">{errors.items}</p>
              ) : null}
              <div className="space-y-3">
                {form.items.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Chưa có nguyên liệu
                  </div>
                ) : (
                  form.items.map((item, index) => (
                    <div
                      key={`recipe-item-${index}`}
                      className="rounded-lg border border-border p-3 space-y-3"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nguyên liệu</Label>
                          <select
                            className={`h-9 text-sm w-full rounded-md border bg-background px-3 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:appearance-none ${
                              itemErrors[index]?.ingredientId
                                ? "border-destructive focus:ring-destructive/30"
                                : "border-input"
                            }`}
                            value={item.ingredientId || ""}
                            onChange={(e) =>
                              updateItem(index, {
                                ingredientId: Number(e.target.value),
                              })
                            }
                            disabled={viewMode || submitting}
                          >
                            <option value="" disabled>
                              Chọn nguyên liệu
                            </option>
                            {ingredientsLoading ? (
                              <option value="" disabled>
                                Đang tải danh sách nguyên liệu...
                              </option>
                            ) : (
                              safeIngredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name}
                                </option>
                              ))
                            )}
                          </select>
                          {itemErrors[index]?.ingredientId ? (
                            <p className="text-xs text-destructive">
                              {itemErrors[index]?.ingredientId}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>Số lượng</Label>
                          <div className="space-y-1">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                className={`pr-10 text-left w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  itemErrors[index]?.quantityRequired
                                    ? "border-destructive focus-visible:ring-destructive/30"
                                    : ""
                                }`}
                                value={
                                  item.quantityRequired === 0
                                    ? ""
                                    : item.quantityRequired
                                }
                                onChange={(e) =>
                                  updateItem(index, {
                                    quantityRequired:
                                      e.target.value === ""
                                        ? 0
                                        : Number(e.target.value),
                                  })
                                }
                                placeholder="20"
                                disabled={viewMode || submitting}
                              />
                              <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground tracking-tight">
                                {formatUnitLabel(
                                  safeIngredients.find(
                                    (ing) => ing.id === item.ingredientId,
                                  )?.baseUnit,
                                )}
                              </span>
                            </div>
                            {itemErrors[index]?.quantityRequired ? (
                              <p className="text-xs text-destructive">
                                {itemErrors[index]?.quantityRequired}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Ghi chú</Label>
                        <Input
                          value={item.note}
                          onChange={(e) =>
                            updateItem(index, { note: e.target.value })
                          }
                          placeholder="Đường"
                          disabled={viewMode || submitting}
                        />
                      </div>

                      <div className="flex justify-end">
                        {!viewMode && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(index)}
                            disabled={submitting || form.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {!viewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    disabled={submitting}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nguyên liệu
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Đóng
            </Button>
            {!viewMode && (
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Lưu công thức"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
