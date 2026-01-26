"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Clock3,
  Beaker,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: number;
  name: string;
  code: string;
  category: "Coffee" | "Tea" | "Cold Brew" | "Bakery";
  size: "S" | "M" | "L";
  brewMethod: "Máy pha" | "Phin" | "Trà" | "Thủ công";
  time: string; // e.g. "2:30"
  status: "ACTIVE" | "INACTIVE";
  ingredients: Ingredient[];
  steps: string;
  caffeine: string;
  lastUpdated: string;
  yield: string; // ml or pcs
  cost: number;
}

const MOCK_RECIPES: Recipe[] = [
  {
    id: 1,
    name: "Cold Brew Cam Sành",
    code: "CB-CS",
    category: "Cold Brew",
    size: "M",
    brewMethod: "Thủ công",
    time: "3:00",
    status: "ACTIVE",
    ingredients: [
      { name: "Cold brew concentrate", amount: 120, unit: "ml" },
      { name: "Nước cam sành tươi", amount: 40, unit: "ml" },
      { name: "Syrup đường mía", amount: 10, unit: "ml" },
      { name: "Đá viên", amount: 120, unit: "g" },
    ],
    steps:
      "Rót concentrate + syrup, khuấy đều. Thêm cam, đá, trang trí lát cam.",
    caffeine: "80mg",
    lastUpdated: "24/01/2026",
    yield: "280 ml",
    cost: 18000,
  },
  {
    id: 2,
    name: "Latte Hạnh Nhân",
    code: "L-AL",
    category: "Coffee",
    size: "M",
    brewMethod: "Máy pha",
    time: "2:10",
    status: "ACTIVE",
    ingredients: [
      { name: "Espresso double", amount: 40, unit: "ml" },
      { name: "Sữa hạnh nhân", amount: 160, unit: "ml" },
      { name: "Syrup vanilla", amount: 8, unit: "ml" },
    ],
    steps: "Chiết 2 shot, hấp sữa 60-65°C, rót layering, tạo art đơn giản.",
    caffeine: "120mg",
    lastUpdated: "20/01/2026",
    yield: "220 ml",
    cost: 21000,
  },
  {
    id: 3,
    name: "Trà Ô Long Sữa Rang",
    code: "T-OLR",
    category: "Tea",
    size: "L",
    brewMethod: "Trà",
    time: "3:20",
    status: "INACTIVE",
    ingredients: [
      { name: "Trà ô long rang", amount: 6, unit: "g" },
      { name: "Nước 90°C", amount: 180, unit: "ml" },
      { name: "Kem sữa", amount: 40, unit: "ml" },
      { name: "Đá viên", amount: 140, unit: "g" },
    ],
    steps: "Ủ trà 3 phút, lọc bã. Lắc với kem sữa + đá, rót ra ly.",
    caffeine: "60mg",
    lastUpdated: "12/01/2026",
    yield: "360 ml",
    cost: 16000,
  },
];

export default function RecipePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | Recipe["category"]>("ALL");
  const [activeId, setActiveId] = useState<number | null>(
    MOCK_RECIPES[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return MOCK_RECIPES.filter((r) => {
      const matchKw =
        !kw ||
        r.name.toLowerCase().includes(kw) ||
        r.code.toLowerCase().includes(kw);
      const matchCat = category === "ALL" || r.category === category;
      return matchKw && matchCat;
    });
  }, [search, category]);

  const activeRecipe = filtered.find((r) => r.id === activeId) || filtered[0];
  const stats = useMemo(() => {
    const src = filtered.length ? filtered : MOCK_RECIPES;
    const total = src.length;
    const active = src.filter((r) => r.status === "ACTIVE").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [filtered]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-900">
            Công thức pha chế
          </h1>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-800 border border-amber-100">
              <span className="h-2 w-2 rounded-full bg-amber-700" />
              Tổng: {stats.total}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-green-700 border border-green-100">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Đang dùng: {stats.active}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 border border-gray-200">
              <span className="h-2 w-2 rounded-full bg-gray-500" />
              Tạm tắt: {stats.inactive}
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
            placeholder="Tìm công thức / mã / nguyên liệu"
            className="border-0 shadow-none focus-visible:ring-0 text-xs h-8 min-w-[200px] px-2"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-1.5 py-1 shadow-sm">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "Coffee", label: "Cà phê" },
            { key: "Tea", label: "Trà / Sữa" },
            { key: "Cold Brew", label: "Cold Brew" },
            { key: "Bakery", label: "Bakery" },
          ].map((cat) => (
            <Button
              key={cat.key}
              size="sm"
              variant={category === cat.key ? "default" : "ghost"}
              className={`rounded-full h-8 px-3 text-[11px] ${
                category === cat.key ? "" : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setCategory(cat.key as typeof category)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <Button className="h-9 gap-2 text-sm px-3">
          <Plus className="w-4 h-4" />
          Tạo công thức mới
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Bảng danh sách */}
        <Card className="col-span-12 lg:col-span-7 xl:col-span-8 overflow-hidden">
          <CardHeader className="px-3 py-2 border-b">
            <CardTitle className="text-2x1 font-semibold leading-tight">
              Danh sách công thức
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 -mt-px">
            <div className="overflow-auto">
              <table className="min-w-full text-xs leading-tight">
                <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-2.5 py-2 text-left font-semibold">Món</th>
                    <th className="px-2.5 py-2 text-left font-semibold">Mã</th>
                    <th className="px-2.5 py-2 text-left font-semibold">
                      Loại
                    </th>
                    <th className="px-2.5 py-2 text-left font-semibold">
                      Size
                    </th>
                    <th className="px-2.5 py-2 text-left font-semibold">
                      Dụng cụ
                    </th>
                    <th className="px-2.5 py-2 text-left font-semibold">
                      Thời gian
                    </th>
                    <th className="px-2.5 py-2 text-left font-semibold">
                      Trạng thái
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b last:border-0 cursor-pointer hover:bg-amber-50 ${
                        activeRecipe?.id === r.id
                          ? "bg-amber-50/60"
                          : "bg-white"
                      }`}
                      onClick={() => setActiveId(r.id)}
                    >
                      <td className="px-2.5 py-2">
                        <div className="font-semibold text-stone-900 text-sm leading-tight">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-gray-500 leading-tight">
                          Cập nhật: {r.lastUpdated}
                        </div>
                      </td>

                      <td className="px-2.5 py-2 text-gray-700">{r.code}</td>
                      <td className="px-2.5 py-2 text-gray-700">
                        {r.category}
                      </td>
                      <td className="px-2.5 py-2 text-gray-700">{r.size}</td>
                      <td className="px-2.5 py-2 text-gray-700">
                        {r.brewMethod}
                      </td>
                      <td className="px-2.5 py-2 text-gray-700">{r.time}</td>

                      <td className="px-2.5 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            r.status === "ACTIVE"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {r.status === "ACTIVE" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          {r.status === "ACTIVE" ? "Đang dùng" : "Tạm tắt"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pane chi tiết */}
        <Card className="col-span-12 lg:col-span-5 xl:col-span-4 h-fit sticky top-4">
          <CardHeader className="px-3 py-2 border-b space-y-0.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Chi tiết định lượng</CardTitle>
              <span className="text-[11px] text-gray-500">
                Máy POS • nội bộ
              </span>
            </div>
            {activeRecipe && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                  <Beaker className="w-3.5 h-3.5" /> {activeRecipe.yield}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 border text-gray-700">
                  <Coffee className="w-3.5 h-3.5" /> {activeRecipe.caffeine}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 border text-gray-700">
                  <Clock3 className="w-3.5 h-3.5" /> {activeRecipe.time}
                </span>
              </div>
            )}
          </CardHeader>

          {activeRecipe ? (
            <CardContent className="space-y-4 px-4 pb-5 -mt-px">
              <div>
                <p className="text-sm font-semibold text-stone-900 mb-2">
                  Nguyên liệu định lượng
                </p>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y">
                  {activeRecipe.ingredients.map((ing) => (
                    <div
                      key={ing.name}
                      className="flex items-center justify-between px-3 py-2 text-sm text-gray-800"
                    >
                      <span>{ing.name}</span>
                      <span className="font-semibold text-stone-900">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">
                  Quy trình
                </p>
                <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed">
                  {activeRecipe.steps}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-gray-500 text-xs">Chi phí</p>
                  <p className="text-lg font-semibold text-amber-800">
                    {activeRecipe.cost.toLocaleString("vi-VN")}
                    <span className="text-sm text-gray-500"> đ / ly</span>
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-gray-500 text-xs">Cập nhật</p>
                  <p className="text-xs font-semibold text-stone-900">
                    {activeRecipe.lastUpdated}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 h-9 text-sm">In tem pha chế</Button>
                <Button variant="outline" className="flex-1 h-9 text-sm">
                  Xuất PDF
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-sm text-gray-600">
                Chọn một công thức để xem chi tiết.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
