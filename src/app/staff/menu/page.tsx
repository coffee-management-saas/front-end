"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, Minus, Plus } from "lucide-react";

type Category = "coffee" | "trasua" | "banh" | "nuocep" | "combo";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  size: "Small" | "Large";
  category: Category;
}

type SugarLevel = "50%" | "70%" | "100%";
type IceLevel = "50%" | "70%" | "100%";

interface CartItem extends MenuItem {
  quantity: number;
  sugar: SugarLevel;
  ice: IceLevel;
}

const isImageUrl = (src: string) => /^https?:\/\//i.test(src);

const TAB_OPTIONS: { label: string; value: Category }[] = [
  { label: "Coffee", value: "coffee" },
  { label: "Trà sữa", value: "trasua" },
  { label: "Bánh", value: "banh" },
  { label: "Nước ép", value: "nuocep" },
  { label: "Combo", value: "combo" },
];

const CoffeeShopUI = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryFromUrl =
    (searchParams.get("category") as Category) || "coffee";

  const [activeTab, setActiveTab] = useState<Category>(categoryFromUrl);

  useEffect(() => {
    setActiveTab(categoryFromUrl);
  }, [categoryFromUrl]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const menuItems: MenuItem[] = [
    {
      id: 1,
      name: "Cà Phê Đen Đá",
      price: 35000,
      image:
        "https://i.pinimg.com/736x/eb/fa/73/ebfa73187f0aa58158d36d28b86a6532.jpg",
      size: "Small",
      category: "coffee",
    },
    {
      id: 2,
      name: "Cà phê Cappuccino",
      price: 65000,
      image:
        "https://i.pinimg.com/1200x/81/92/7e/81927ee1cf8fcd7715530b0856cf553d.jpg",
      size: "Small",
      category: "coffee",
    },
    {
      id: 3,
      name: "Americano",
      price: 65000,
      image:
        "https://i.pinimg.com/736x/94/38/65/943865d41a8675c959ddf82aef1667ec.jpg",
      size: "Small",
      category: "coffee",
    },
    {
      id: 4,
      name: "V60",
      price: 65000,
      image:
        "https://i.pinimg.com/736x/14/02/15/1402155c47a8f20ca6bcd8275593d0be.jpg",
      size: "Small",
      category: "coffee",
    },
    // Ví dụ thêm món khác category
    {
      id: 5,
      name: "Trà sữa Trân Châu",
      price: 45000,
      image:
        "https://i.pinimg.com/736x/94/38/65/943865d41a8675c959ddf82aef1667ec.jpg",
      size: "Small",
      category: "trasua",
    },
    {
      id: 6,
      name: "Bánh Tiramisu",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/14/02/15/1402155c47a8f20ca6bcd8275593d0be.jpg",
      size: "Small",
      category: "banh",
    },
  ];

  const [quantities, setQuantities] = useState<Record<number, number>>(() =>
    Object.fromEntries(menuItems.map((m) => [m.id, 1])),
  );

  const [selectedSizes, setSelectedSizes] = useState<
    Record<number, "Small" | "Large">
  >(() => Object.fromEntries(menuItems.map((m) => [m.id, "Small"])));

  const sugarOptions: SugarLevel[] = ["50%", "70%", "100%"];
  const iceOptions: IceLevel[] = ["50%", "70%", "100%"];

  const [selectedSugar, setSelectedSugar] = useState<
    Record<number, SugarLevel>
  >(() => Object.fromEntries(menuItems.map((m) => [m.id, "50%"])));

  const [selectedIce, setSelectedIce] = useState<Record<number, IceLevel>>(() =>
    Object.fromEntries(menuItems.map((m) => [m.id, "50%"])),
  );

  const onChangeTab = (next: Category) => {
    setActiveTab(next);

    const params = new URLSearchParams(searchParams.toString());
    params.set("category", next);

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const filteredMenuItems = useMemo(
    () => menuItems.filter((m) => m.category === activeTab),
    [menuItems, activeTab],
  );

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const addToCart = (item: MenuItem) => {
    const size = selectedSizes[item.id] || "Small";
    const sugar = selectedSugar[item.id] || "50%";
    const ice = selectedIce[item.id] || "50%";
    const qtyToAdd = quantities[item.id] || 1;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.id === item.id &&
          ci.size === size &&
          ci.sugar === sugar &&
          ci.ice === ice,
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + qtyToAdd,
        };
        return next;
      }

      return [...prev, { ...item, size, sugar, ice, quantity: qtyToAdd }];
    });

    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  const updateCartQuantity = (
    id: number,
    size: "Small" | "Large",
    sugar: SugarLevel,
    ice: IceLevel,
    delta: number,
  ) => {
    setCartItems((prev) => {
      return prev
        .map((ci) => {
          if (
            ci.id === id &&
            ci.size === size &&
            ci.sugar === sugar &&
            ci.ice === ice
          ) {
            return { ...ci, quantity: ci.quantity + delta };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0);
    });
  };

  const hasCart = cartItems.length > 0;

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const discount = hasCart ? 3000 : 0;
  const total = totalItems - discount;

  return (
    <div className="flex min-h-screen bg-gray-50 items-start">
      {/* Left Section - Menu */}
      <div className="flex-1 min-w-0 p-6">
        {/* Tabs -> query param */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TAB_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => onChangeTab(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === t.value
                  ? "bg-amber-700 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredMenuItems.map((item) => {
            const currentSize = selectedSizes[item.id] || "Small";
            const currentSugar = selectedSugar[item.id] || "50%";
            const currentIce = selectedIce[item.id] || "50%";

            const inCart = cartItems.some(
              (ci) =>
                ci.id === item.id &&
                ci.size === currentSize &&
                ci.sugar === currentSugar &&
                ci.ice === currentIce,
            );

            const pillBase =
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all";
            const pillActive = "bg-gray-800 text-white";
            const pillIdle = "bg-gray-100 text-gray-600 hover:bg-gray-200";

            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex gap-3">
                  {/* Product Image  */}
                  <div className="relative w-16 h-16 bg-linear-to-b from-amber-100 to-amber-200 rounded-xl shrink-0 overflow-hidden">
                    {isImageUrl(item.image) ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {item.image}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {item.name}
                      </h3>
                      <span className="text-amber-700 text-sm font-semibold shrink-0">
                        {item.price.toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    {/* Size */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-gray-600 w-10">
                        Size
                      </span>
                      <button
                        onClick={() =>
                          setSelectedSizes((prev) => ({
                            ...prev,
                            [item.id]: "Small",
                          }))
                        }
                        className={`${pillBase} ${
                          currentSize === "Small" ? pillActive : pillIdle
                        }`}
                      >
                        Small
                      </button>
                      <button
                        onClick={() =>
                          setSelectedSizes((prev) => ({
                            ...prev,
                            [item.id]: "Large",
                          }))
                        }
                        className={`${pillBase} ${
                          currentSize === "Large" ? pillActive : pillIdle
                        }`}
                      >
                        Large
                      </button>
                    </div>

                    {/* Sugar */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-gray-600 w-10">
                        Đường
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sugarOptions.map((opt) => (
                          <button
                            key={opt}
                            onClick={() =>
                              setSelectedSugar((prev) => ({
                                ...prev,
                                [item.id]: opt,
                              }))
                            }
                            className={`${pillBase} ${
                              currentSugar === opt ? pillActive : pillIdle
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ice */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-gray-600 w-10">Đá</span>
                      <div className="flex flex-wrap gap-1.5">
                        {iceOptions.map((opt) => (
                          <button
                            key={opt}
                            onClick={() =>
                              setSelectedIce((prev) => ({
                                ...prev,
                                [item.id]: opt,
                              }))
                            }
                            className={`${pillBase} ${
                              currentIce === opt ? pillActive : pillIdle
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qty + Add */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-gray-800">
                      {quantities[item.id] || 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>

                  <button
                    onClick={() => addToCart(item)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                      inCart
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-amber-700 hover:bg-amber-800 text-white"
                    }`}
                  >
                    {inCart ? "Add more" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Section - Cart */}
      <div className="w-64 bg-white px-4 py-5 shadow-lg flex flex-col h-fit self-start mt-16 rounded-3xl mx-6">
        {hasCart ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Cart</h2>
              <span className="text-[11px] text-gray-300">Order #3243</span>
            </div>

            {/* Delivery Options */}
            <div className="flex gap-2 mb-4">
              <button className="px-3 py-1.5 rounded-full bg-gray-800 text-white text-[11px] font-medium">
                Delivery
              </button>
              <button className="px-3 py-1.5 rounded-full bg-white text-gray-400 text-[11px] font-medium border border-gray-200">
                Dine in
              </button>
              <button className="px-3 py-1.5 rounded-full bg-white text-gray-400 text-[11px] font-medium border border-gray-200">
                Take away
              </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-${item.size}-${item.sugar}-${item.ice}`}
                  className="bg-gray-50 rounded-2xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {isImageUrl(item.image) ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg">{item.image}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-black truncate">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-black mt-0.5 truncate">
                        {item.size} • Đường: {item.sugar} • Đá: {item.ice}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-black">
                      {item.price.toLocaleString("vi-VN")}đ
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.id,
                            item.size,
                            item.sugar,
                            item.ice,
                            -1,
                          )
                        }
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        title="Giảm / xoá"
                      >
                        <Minus className="w-3.5 h-3.5 text-black" />
                      </button>

                      <span className="w-4 text-center text-sm font-semibold text-black">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.id,
                            item.size,
                            item.sugar,
                            item.ice,
                            1,
                          )
                        }
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        title="Tăng"
                      >
                        <Plus className="w-3.5 h-3.5 text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-black">Items</span>
                <span className="text-black font-medium">
                  {totalItems.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-black">Discounts</span>
                <span className="text-black font-medium">
                  -{discount.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <div className="flex justify-between text-[11px] pt-2">
                <span className="text-black">Total</span>
                <span className="text-amber-700 font-semibold">
                  {total.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <button className="mt-4 w-full rounded-full bg-amber-700 hover:bg-amber-800 text-white py-2.5 text-sm font-medium">
              Place an order
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 text-black" />
            </div>
            <p className="text-sm text-black font-medium">Empty cart</p>
            <p className="text-xs text-black mt-1">Add items to order.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeShopUI;
