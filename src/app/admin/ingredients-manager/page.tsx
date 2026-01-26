"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Filter,
  Package2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type IngredientLine = {
  id: string;
  name: string;
  amount: string;
  unit: string;
  note?: string;
};

type Recipe = {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
  tags: string[];
  ingredients: IngredientLine[];
  steps: string[];
};

const seedRecipes: Recipe[] = [
  {
    id: "rc-latte-caramel",
    name: "Latte hạnh nhân caramel",
    category: "Coffee",
    size: "360 ml",
    price: 59000,
    tags: ["best seller", "hot"],
    ingredients: [
      { id: "i1", name: "Espresso blend", amount: "18", unit: "g" },
      { id: "i2", name: "Sữa hạnh nhân", amount: "180", unit: "ml" },
      { id: "i3", name: "Syrup caramel", amount: "12", unit: "g" },
      { id: "i4", name: "Hạnh nhân lát", amount: "3", unit: "g" },
    ],
    steps: [
      "Làm nóng ly, kiểm tra máy ở 93°C.",
      "Chiết 18g cafe ra 40ml trong 25s, khuấy degas 10s.",
      "Steam 180ml sữa 55°C, foam mịn.",
      "Rót layer, topping caramel + hạnh nhân, giao trong 90s.",
    ],
  },
  {
    id: "rc-coldbrew-orange",
    name: "Cold Brew cam sành",
    category: "Cold Brew",
    size: "400 ml",
    price: 65000,
    tags: ["iced"],
    ingredients: [
      { id: "i1", name: "Cold brew base", amount: "120", unit: "ml" },
      { id: "i2", name: "Nước cam sành", amount: "80", unit: "ml" },
      { id: "i3", name: "Syrup đường nâu", amount: "15", unit: "ml" },
      { id: "i4", name: "Đá viên", amount: "120", unit: "g" },
    ],
    steps: [
      "Cho syrup + nước cam + đá vào shaker, lắc 8s.",
      "Đổ cold brew vào ly, thêm hỗn hợp cam lên trên.",
      "Trang trí lát cam, giao trong 60s.",
    ],
  },
  {
    id: "rc-oolong-milk",
    name: "Trà ô long sữa rang",
    category: "Tea / Milk Tea",
    size: "500 ml",
    price: 52000,
    tags: ["milk tea"],
    ingredients: [
      { id: "i1", name: "Trà ô long rang", amount: "90", unit: "ml" },
      { id: "i2", name: "Sữa tươi", amount: "120", unit: "ml" },
      { id: "i3", name: "Creamer rang", amount: "20", unit: "g" },
      { id: "i4", name: "Trân châu đường nâu", amount: "50", unit: "g" },
    ],
    steps: [
      "Ủ trà ô long 4 phút, để ấm.",
      "Khuấy creamer với 30ml trà cho tan.",
      "Cho đá + trà + sữa vào lắc 6s, rót ra ly.",
      "Thêm trân châu và váng sữa nếu có.",
    ],
  },
];

const categoryTone: Record<string, string> = {
  Coffee: "bg-amber-50 text-amber-700",
  "Cold Brew": "bg-sky-50 text-sky-700",
  "Tea / Milk Tea": "bg-emerald-50 text-emerald-700",
};

function IngredientsManagerPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(seedRecipes);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const emptyForm: Recipe = {
    id: "",
    name: "",
    category: seedRecipes[0].category,
    size: "360 ml",
    price: 0,
    tags: [],
    ingredients: [],
    steps: [],
  };
  const [form, setForm] = useState<Recipe>(emptyForm);
  const [ingDraft, setIngDraft] = useState({ name: "", amount: "", unit: "" });
  const [stepsText, setStepsText] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(recipes.map((i) => i.category))),
    [recipes],
  );

  const filtered = useMemo(() => {
    return recipes.filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCategory = category === "all" || item.category === category;
      return matchSearch && matchCategory;
    });
  }, [category, recipes, search]);

  const summary = useMemo(() => {
    const totalIngredients = recipes.reduce(
      (acc, r) => acc + r.ingredients.length,
      0,
    );
    return {
      totalRecipes: recipes.length,
      totalIngredients,
      categories: categories.length,
    };
  }, [categories.length, recipes]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      category: categories[0] ?? seedRecipes[0].category,
    });
    setIngDraft({ name: "", amount: "", unit: "" });
    setStepsText("");
    setMode("create");
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: Recipe) => {
    setForm(item);
    setMode("edit");
    setStepsText(item.steps.join("\n"));
    setIngDraft({ name: "", amount: "", unit: "" });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const target = recipes.find((i) => i.id === id);
    if (!target) return;
    const ok = window.confirm(`Xóa công thức "${target.name}"?`);
    if (ok) setRecipes((prev) => prev.filter((i) => i.id !== id));
  };

  const addIngredientLine = () => {
    if (!ingDraft.name.trim() || !ingDraft.amount.trim()) return;
    const newLine: IngredientLine = {
      id: `ing-${Date.now()}`,
      name: ingDraft.name.trim(),
      amount: ingDraft.amount.trim(),
      unit: ingDraft.unit.trim() || "",
    };
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, newLine] }));
    setIngDraft({ name: "", amount: "", unit: "" });
  };

  const removeIngredientLine = (id: string) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((ing) => ing.id !== id),
    }));
  };

  const upsertRecipe = () => {
    if (!form.name.trim()) return alert("Tên món không được trống");
    if (form.ingredients.length === 0)
      return alert("Cần ít nhất 1 thành phần cho công thức");

    const payload: Recipe = {
      ...form,
      steps: stepsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (mode === "create") {
      const newItem: Recipe = {
        ...payload,
        id: `rc-${Date.now()}`,
      };
      setRecipes((prev) => [newItem, ...prev]);
    } else {
      setRecipes((prev) => prev.map((i) => (i.id === form.id ? payload : i)));
    }

    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <Card className="border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader className="pb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Quản lý công thức
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Công thức & thành phần
            </h1>
            <p className="text-sm text-slate-600">
              Lưu, chỉnh sửa và triển khai công thức đồ uống cho quán.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4" />
              Thêm công thức
            </Button>
            <Button
              variant="outline"
              className="border-slate-200 text-slate-800"
            >
              <ChefHat className="w-4 h-4" />
              Bộ SOP bar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Tổng công thức",
              value: `${summary.totalRecipes} món`,
              desc: `${summary.categories} nhóm đồ uống`,
              icon: Package2,
              tone: "from-amber-100 via-white to-white",
            },
            {
              label: "Thành phần đã định nghĩa",
              value: `${summary.totalIngredients} nguyên liệu`,
              desc: "Đi kèm định lượng & đơn vị",
              icon: Beaker,
              tone: "from-sky-100 via-white to-white",
            },
            {
              label: "Công thức nổi bật",
              value: "3 đề xuất",
              desc: "Best seller tuần này",
              icon: ClipboardCheck,
              tone: "from-emerald-100 via-white to-white",
            },
            {
              label: "Sửa đổi gần nhất",
              value: "Hôm nay",
              desc: "Nhớ publish lên app bán hàng",
              icon: AlertTriangle,
              tone: "from-rose-100 via-white to-white",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br ${item.tone} px-4 py-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)]`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">{item.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-white text-amber-700 flex items-center justify-center border border-slate-200">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-2">
          <div>
            <CardTitle className="text-base">Bộ lọc nhanh</CardTitle>
            <CardDescription>Tìm công thức theo tên hoặc nhóm.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700"
          >
            <Filter className="w-4 h-4" />
            Lưu cấu hình
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.6fr]">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Input
              placeholder="Tìm theo tên món..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value === "all" ? "all" : e.target.value)
            }
          >
            <option value="all">Tất cả nhóm</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start border border-slate-200 text-slate-800"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            <Sparkles className="w-4 h-4" />
            Đặt lại
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <Card className="border-slate-200 bg-white/95 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Danh sách công thức</CardTitle>
                <CardDescription>
                  Thành phần chi tiết & các bước pha chế.
                </CardDescription>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {filtered.length} món
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">
                Không có công thức nào khớp bộ lọc.
              </div>
            )}
            {filtered.map((item) => {
              const tone =
                categoryTone[item.category] ?? "bg-slate-50 text-slate-700";
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium ${tone}`}
                        >
                          {item.category}
                        </span>
                        <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-200">
                          {item.size}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Giá đề xuất: {item.price.toLocaleString("vi-VN")} ₫
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-800"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-500 mb-2">
                        Thành phần
                      </p>
                      <div className="space-y-2">
                        {item.ingredients.map((ing) => (
                          <div
                            key={ing.id}
                            className="flex items-start justify-between text-sm text-slate-900"
                          >
                            <div>
                              <p className="font-medium">{ing.name}</p>
                              {ing.note ? (
                                <p className="text-xs text-slate-500">
                                  {ing.note}
                                </p>
                              ) : null}
                            </div>
                            <p className="text-sm text-slate-700">
                              {ing.amount} {ing.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-500 mb-2">
                        Các bước pha
                      </p>
                      <ol className="space-y-1 text-sm text-slate-800 list-decimal list-inside">
                        {item.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border-slate-200 bg-white/95 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Ghi chú bar</CardTitle>
                  <CardDescription>
                    Nhắc nhanh: cách bảo quản & lưu ý khẩu vị.
                  </CardDescription>
                </div>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                - Siro homemade nên dán ngày nấu, dùng trong 5 ngày.
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                - Espresso blend: purge 2s trước shot đầu mỗi ca.
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                - Với đồ đá, lắc đủ 8s để tan syrup, tránh tách lớp.
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Batch brew hôm nay
                  </CardTitle>
                  <CardDescription>
                    Theo dõi mẻ pha chế & người phụ trách
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-200 text-slate-800"
                >
                  <Plus className="w-4 h-4" />
                  Tạo mẻ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  name: "Cold brew base",
                  window: "08:30 → 11:00",
                  owner: "Thịnh",
                  status: "Đang ủ",
                },
                {
                  name: "Trà ô long rang",
                  window: "09:15 → 10:00",
                  owner: "Vy",
                  status: "Hoàn thành",
                },
              ].map((batch) => (
                <div
                  key={batch.name}
                  className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{batch.name}</p>
                    <p className="text-xs text-slate-600">
                      Thời gian {batch.window}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Phụ trách: {batch.owner}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      batch.status === "Hoàn thành"
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-amber-100 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Thêm công thức mới" : "Chỉnh sửa công thức"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin món, thành phần và các bước pha.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tên món</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ví dụ: Latte hạnh nhân caramel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Nhóm</Label>
              <select
                id="category"
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size/định lượng ly</Label>
              <Input
                id="size"
                value={form.size}
                onChange={(e) =>
                  setForm((f) => ({ ...f, size: e.target.value }))
                }
                placeholder="360 ml"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá bán đề xuất (₫)</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Thành phần</Label>
              <div className="space-y-2">
                {form.ingredients.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Chưa có thành phần nào. Thêm bên dưới.
                  </p>
                )}
                {form.ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {ing.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {ing.amount} {ing.unit}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => removeIngredientLine(ing.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="grid gap-2 md:grid-cols-[1.2fr_0.6fr_0.4fr_auto]">
                  <Input
                    placeholder="Tên thành phần"
                    value={ingDraft.name}
                    onChange={(e) =>
                      setIngDraft((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Số lượng"
                    value={ingDraft.amount}
                    onChange={(e) =>
                      setIngDraft((d) => ({ ...d, amount: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Đơn vị"
                    value={ingDraft.unit}
                    onChange={(e) =>
                      setIngDraft((d) => ({ ...d, unit: e.target.value }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-800"
                    onClick={addIngredientLine}
                  >
                    Thêm
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="steps">Các bước pha (mỗi dòng một bước)</Label>
              <Textarea
                id="steps"
                rows={5}
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                placeholder="Ví dụ:\n1. Chiết 18g cafe ra 40ml trong 25s\n2. Steam sữa 55°C..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={upsertRecipe}
            >
              {mode === "create" ? "Lưu công thức" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IngredientsManagerPage;
