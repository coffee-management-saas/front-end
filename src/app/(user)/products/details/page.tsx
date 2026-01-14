"use client";
import React, { useMemo, useState, useRef } from "react";
import {
  Minus,
  Plus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
type LevelOption = "Ít" | "Bình thường" | "Nhiều";
interface Topping {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SuggestItem {
  id: string;
  name: string;
  price: number;
  image: string;
  isBestSeller?: boolean;
}

const DetailProduct: React.FC = () => {
  const [size, setSize] = useState<"L" | "M">("L");
  const [cart, setCart] = useState(0);
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const [selectedIce, setSelectedIce] = useState<LevelOption>("Nhiều");
  const [selectedTea, setSelectedTea] = useState<LevelOption>("Nhiều");
  const [quantity, setQuantity] = useState<number>(1);
  const [toppingCount, setToppingCount] = useState<number>(0);

  const [toppings, setToppings] = useState<Topping[]>([
    { id: "1", name: "Topping vải (4 trái)", price: 20000, quantity: 0 },
    { id: "2", name: "Bánh flan phúc long", price: 20000, quantity: 0 },
    { id: "3", name: "Topping đặc thơm", price: 25000, quantity: 0 },
    { id: "4", name: "Topping thạch konjac", price: 15000, quantity: 0 },
    { id: "5", name: "Topping nhãn (4 trái)", price: 20000, quantity: 0 },
    { id: "6", name: "Đào (3 miếng)", price: 20000, quantity: 0 },
    { id: "7", name: "Topping đác cam", price: 25000, quantity: 0 },
  ]);
  const coffeeItems = [
    {
      id: 1,
      name: "Cà Phê Đen Đá (M)",
      price: 35000,
      image:
        "https://i.pinimg.com/736x/eb/fa/73/ebfa73187f0aa58158d36d28b86a6532.jpg",
    },
    {
      id: 2,
      name: "Cà phê Cappuccino (L)",
      price: 65000,
      image:
        "https://i.pinimg.com/1200x/81/92/7e/81927ee1cf8fcd7715530b0856cf553d.jpg",
    },
    {
      id: 3,
      name: "Cà Phê Sữa Kem",
      price: 65000,
      image:
        "https://i.pinimg.com/736x/94/38/65/943865d41a8675c959ddf82aef1667ec.jpg",
    },
    {
      id: 4,
      name: "Cà Phê Sữa Đá (M)",
      price: 39000,
      image:
        "https://i.pinimg.com/736x/14/02/15/1402155c47a8f20ca6bcd8275593d0be.jpg",
    },
    {
      id: 5,
      name: "Cà phê Latte (M)",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/4d/e4/0c/4de40c8bbd7ca5c9a76587faf386d444.jpg",
    },
    {
      id: 6,
      name: "Cà Phê Đen Đá (M)",
      price: 35000,
      image:
        "https://i.pinimg.com/736x/eb/fa/73/ebfa73187f0aa58158d36d28b86a6532.jpg",
    },
  ];
  const item = coffeeItems[0];

  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };
  const basePrice = 59000;
  const sizeDelta = size === "M" ? -4000 : 0;

  const updateToppingQuantity = (id: string, delta: number) => {
    setToppings((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, quantity: Math.max(0, t.quantity + delta) } : t
      )
    );
  };

  const toppingTotal = useMemo(
    () => toppings.reduce((sum, t) => sum + t.price * t.quantity, 0),
    [toppings]
  );

  const totalPrice = basePrice + sizeDelta + toppingTotal;

  const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

  return (
    <div className="max-w-6xl mx-auto bg-white min-h-screen px-4 md:px-6">
      {/* Breadcrumb */}
      <div className="pt-4 pb-2 text-xs text-gray-500">
        Trang chủ / <span className="text-gray-800">Sản phẩm</span>
      </div>
      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start pt-12">
        {/* LEFT: Image card */}
        <div className="relative h-105 md:h-130 rounded-xl overflow-hidden">
          {/* Image */}
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>

        {/* RIGHT: Content */}
        <div className="pt-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Trà Sữa Ô Long (L)
              </h2>
              <p className="text-xs text-gray-500 mt-1">SKU: 6500001</p>
              <p className="text-lg md:text-xl font-bold text-amber-700 mt-2">
                {formatPrice(basePrice)}
              </p>
            </div>

            {/* Qty controls (top-right like screenshot) */}
            <div className="flex items-center gap-2 mt-1">
              <button
                className="w-7 h-7 rounded bg-amber-700 text-white flex items-center justify-center"
                type="button"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm w-6 text-center">1</span>
              <button
                className="w-7 h-7 rounded bg-amber-700 text-white flex items-center justify-center"
                type="button"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Size */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">
              Chọn kích cỡ
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSize("L")}
                className={[
                  "w-20 h-8 rounded border text-xs font-semibold",
                  size === "L"
                    ? "bg-amber-700 text-white border-amber-700"
                    : "bg-white text-gray-700 border-gray-200",
                ].join(" ")}
              >
                L
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSize("M")}
                  className={[
                    "w-20 h-8 rounded border text-xs font-semibold",
                    size === "M"
                      ? "bg-amber-700 text-white border-amber-700"
                      : "bg-white text-gray-700 border-gray-200",
                  ].join(" ")}
                >
                  M
                </button>
              </div>
            </div>
          </div>
          {/* TRÀ */}
          <div>
            <Label className="text-xs font-bold text-amber-700 pt-5">Trà</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 pt-2">
              {(["Ít", "Bình thường", "Nhiều"] as LevelOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedTea(opt)}
                  className={`h-8 px-3 rounded-md border text-xs font-medium transition ${
                    selectedTea === opt
                      ? "bg-amber-700 text-white border-amber-700"
                      : "bg-gray-100 border-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* ĐÁ */}
          <div>
            <Label className="text-xs font-bold text-amber-700 pt-5">Đá</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 pt-2">
              {(["Ít", "Bình thường", "Nhiều"] as LevelOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedIce(opt)}
                  className={`h-8 px-3 rounded-md border text-xs font-medium transition ${
                    selectedIce === opt
                      ? "bg-amber-700 text-white border-amber-700"
                      : "bg-gray-100 border-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div className="mt-5">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">
              Chọn Topping
            </h3>

            <div className="space-y-3">
              {toppings.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_auto] gap-4 items-center"
                >
                  <div>
                    <p className="text-xs text-gray-900">{t.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {formatPrice(t.price)}
                    </p>
                  </div>

                  {/* Controls aligned right like screenshot */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateToppingQuantity(t.id, -1)}
                      disabled={t.quantity === 0}
                      className={[
                        "w-7 h-7 rounded border flex items-center justify-center",
                        t.quantity === 0
                          ? "bg-amber-700 text-white border-gray-200 cursor-not-allowed"
                          : "bg-amber-700 text-white border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                      type="button"
                    >
                      <Minus className="w-4 h-4 " />
                    </button>

                    <span className="w-5 text-center text-sm text-gray-800">
                      {t.quantity}
                    </span>

                    <button
                      onClick={() => updateToppingQuantity(t.id, 1)}
                      className="w-7 h-7 rounded border border-gray-200 bg-amber-700 text-white hover:bg-gray-50 flex items-center justify-center"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add to cart button (right column, like screenshot) */}
            <button
              className="mt-5 w-full bg-amber-800 hover:bg-amber-900 text-white py-2.5 rounded-md font-semibold text-sm flex items-center justify-center gap-2"
              type="button"
            >
              <ShoppingCart className="w-4 h-4" />
              Thêm vào giỏ hàng : {formatPrice(totalPrice)}
            </button>
          </div>
        </div>
      </div>
      {/* SẢN PHẨM  GỢI Ý */}
      <div className="text-center mb-12 mt-6 pt-10">
        <h1 className="text-xl md:text-xl font-bold text-amber-700 mb-2">
          SẢN PHẨM GỢI Ý
        </h1>
      </div>
      {/* Products Grid */}
      <div className="flex items-center gap-3">
        {/* Left button */}
        <button
          onClick={() => scrollLeft(bestSellerRef)}
          className="hidden md:flex bg-white shadow-md rounded-full p-2
               hover:bg-gray-100 transition flex-shrink-0"
          type="button"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        {/* Slider */}
        <div
          ref={bestSellerRef}
          className="flex flex-1 gap-4 pb-4 mb-8 overflow-x-auto scroll-smooth
               [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {coffeeItems.map((items) => (
            <div
              key={items.id}
              className="
          bg-white rounded-lg shadow-md overflow-hidden
          hover:shadow-xl transition-shadow duration-300
          shrink-0
          w-[80%] sm:w-[45%]
          md:w-[calc((100%-1rem*4)/5)]
        "
            >
              {/* Image */}
              <div className="relative bg-gray-100 h-36 flex items-center justify-center">
                <Image
                  src={items.image}
                  alt={items.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-2">
                <h3 className="text-xs font-semibold text-gray-800 mb-1 h-8 leading-tight">
                  {items.name}
                </h3>
                <p className="text-base font-bold text-amber-700 mb-2">
                  {items.price.toLocaleString("vi-VN")} ₫
                </p>
                <button
                  className="w-full bg-amber-700 text-white font-semibold py-1
                       rounded-lg flex items-center justify-center gap-1 text-xs"
                  type="button"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Đặt mua
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right button */}
        <button
          onClick={() => scrollRight(bestSellerRef)}
          className="hidden md:flex bg-white shadow-md rounded-full p-2
               hover:bg-gray-100 transition flex-shrink-0"
          type="button"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>{" "}
      {/* Floating Cart Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-amber-700 hover:bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
        <ShoppingCart className="w-8 h-8" />
        {cart > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold">
            {cart}
          </span>
        )}
      </button>
    </div>
  );
};

export default DetailProduct;
