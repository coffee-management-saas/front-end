"use client";
import React, { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
type LevelOption = "Ít" | "Bình thường" | "Nhiều";
type SizeOption = "M" | "L";
const JuiceMenu = () => {
  const [cart, setCart] = useState(0);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeOption>("M");
  const [selectedIce, setSelectedIce] = useState<LevelOption>("Nhiều");
  const [selectedTea, setSelectedTea] = useState<LevelOption>("Nhiều");
  const [quantity, setQuantity] = useState<number>(1);
  const [toppingCount, setToppingCount] = useState<number>(0);
  const juiceItems = [
    {
      id: 1,
      name: "Nước cam ép",
      price: 35000,
      image:
        "https://i.pinimg.com/1200x/c2/6a/4a/c26a4abb816850ea054c45c382ac8ae5.jpg",
    },
    {
      id: 2,
      name: "Nước chanh",
      price: 65000,
      image:
        "https://i.pinimg.com/1200x/27/81/5b/27815bdd1ebf5c78378f48d3b2ba3bde.jpg",
    },
    {
      id: 3,
      name: "Nước ép dưa hấu",
      price: 65000,
      image:
        "https://i.pinimg.com/1200x/fd/4c/20/fd4c203bc9627fdb503e33c098d13b79.jpg",
    },
    {
      id: 4,
      name: "Sinh tố xoài",
      price: 39000,
      image:
        "https://i.pinimg.com/1200x/4e/c5/ba/4ec5bae6762b72e26bfa1d295aca8379.jpg",
    },
    {
      id: 5,
      name: "Sinh tố chuối xoài",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/ab/03/e9/ab03e942604b1bb6e4699f23d30335ed.jpg",
    },
    {
      id: 6,
      name: "Nước ép thơm",
      price: 35000,
      image:
        "https://i.pinimg.com/736x/ee/94/d7/ee94d710d36d2b867309b3eefd3af996.jpg",
    },
  ];

  const handleOpenPopover = (id: number) => {
    setSelectedSize("M");
    setSelectedIce("Nhiều");
    setQuantity(1);
    setToppingCount(0);
    setOpenPopoverId(id);
  };
  const handleConfirmAddToCart = () => {
    setCart((prev) => prev + 1);
    setOpenPopoverId(null);
  };
  useEffect(() => {
    if (openPopoverId !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [openPopoverId]);

  return (
    <div className="min-h-screen bg-white pt-6">
      <div className="flex">
        {/* Main Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {juiceItems.map((item) => {
            const sizeDelta = selectedSize === "L" ? 0 : -9000;
            const toppingPrice = 22000;
            const totalPrice =
              (item.price + sizeDelta) * quantity + toppingCount * toppingPrice;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md max-w-50 mx-auto overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href="/products/details" className="block">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={200}
                    height={140}
                    className="object-cover rounded-lg"
                  />
                </Link>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-amber-700 mb-2 h-5">
                    {item.name}
                  </h3>
                  <h3 className="text-sm font-bold text-amber-700 mb-2 h-5">
                    {item.price} ₫
                  </h3>

                  <Dialog
                    open={openPopoverId === item.id}
                    onOpenChange={(open) => {
                      if (!open) setOpenPopoverId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <button
                        onClick={() => handleOpenPopover(item.id)}
                        className="w-full bg-amber-700 text-white py-1.5 rounded-lg hover:bg-amber-800 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={14} />
                        Đặt mua
                      </button>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl w-full h-[85vh] overflow-hidden p-0 flex flex-col pt-6">
                      {/* BODY chiếm phần còn lại */}
                      <div className="flex-1 min-h-0">
                        <div className="h-full overflow-hidden px-6 pb-6">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full min-h-0">
                            {/* LEFT */}
                            <div className="md:col-span-2 h-full flex items-start justify-center">
                              <div className="relative w-45 h-45 rounded-xl bg-gray-100 overflow-hidden">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>

                            {/* RIGHT */}
                            <div className="md:col-span-3 h-full pr-2 text-sm flex flex-col min-h-0">
                              {/* HEADER FIX TOP */}
                              <div className="shrink-0 pb-2 border-b border-gray-100 bg-white">
                                <DialogTitle className="text-lg font-bold text-amber-700">
                                  {item.name}
                                </DialogTitle>
                                <p className="mt-1 text-[11px] text-gray-500">
                                  {item.name}
                                </p>

                                <div className="mt-2 flex items-center justify-between">
                                  <div className="text-lg font-extrabold text-amber-700">
                                    {item.price.toLocaleString("vi-VN")} ₫
                                  </div>

                                  <div className="flex items-center gap-2 pl-6">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 w-7 p-0 rounded-md bg-amber-700 text-white hover:bg-amber-700"
                                      onClick={() =>
                                        setQuantity((q) => Math.max(1, q - 1))
                                      }
                                    >
                                      −
                                    </Button>

                                    <span className="w-5 text-center text-sm font-semibold">
                                      {quantity}
                                    </span>

                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 w-7 p-0 rounded-md bg-amber-700 text-white hover:bg-amber-700"
                                      onClick={() => setQuantity((q) => q + 1)}
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/*  SCROLL AREA */}
                              <div className="flex-1 min-h-0 h-0 overflow-y-auto space-y-3 pr-2 py-3">
                                <div className="space-y-3 min-h-0">
                                  {/* SIZE */}
                                  <div>
                                    <Label className="text-xs font-bold text-amber-700">
                                      Chọn kích cỡ
                                    </Label>

                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSize("L")}
                                        className={`h-8 rounded-md border text-xs font-semibold transition
           ${
             selectedSize === "L"
               ? "bg-amber-700 text-white border-amber-700"
               : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
           }`}
                                      >
                                        L
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedSize("M")}
                                        className={`h-8 rounded-md border text-xs font-semibold transition
           ${
             selectedSize === "M"
               ? "bg-amber-700 text-white border-amber-700"
               : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
           }`}
                                      >
                                        M
                                      </button>
                                    </div>
                                  </div>

                                  {/* TRÀ */}
                                  <div>
                                    <Label className="text-xs font-bold text-amber-700">
                                      Trà
                                    </Label>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                      {(
                                        [
                                          "Ít",
                                          "Bình thường",
                                          "Nhiều",
                                        ] as LevelOption[]
                                      ).map((opt) => (
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
                                    <Label className="text-xs font-bold text-amber-700">
                                      Đá
                                    </Label>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                      {(
                                        [
                                          "Ít",
                                          "Bình thường",
                                          "Nhiều",
                                        ] as LevelOption[]
                                      ).map((opt) => (
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

                                  {/* TOPPING */}
                                  <div className="pb-2">
                                    <Label className="text-xs font-bold text-amber-700">
                                      Chọn Topping
                                    </Label>

                                    <div className="mt-2 flex items-center justify-between rounded-md bg-white">
                                      <div>
                                        <div className="text-xs font-medium">
                                          Topping vải (4 trái)
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          22.000 đ
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="h-6 w-6 rounded-md bg-gray-100 text-amber-700 text-sm font-bold"
                                          onClick={() =>
                                            setToppingCount((c) =>
                                              Math.max(0, c - 1)
                                            )
                                          }
                                        >
                                          −
                                        </button>
                                        <span className="w-5 text-center text-xs font-semibold">
                                          {toppingCount}
                                        </span>
                                        <button
                                          type="button"
                                          className="h-6 w-6 rounded-md bg-gray-100 text-amber-700 text-sm font-bold"
                                          onClick={() =>
                                            setToppingCount((c) => c + 1)
                                          }
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between rounded-md bg-white">
                                      <div>
                                        <div className="text-xs font-medium">
                                          Topping thạch
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          22.000 đ
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="h-6 w-6 rounded-md bg-gray-100 text-amber-700 text-sm font-bold"
                                          onClick={() =>
                                            setToppingCount((c) =>
                                              Math.max(0, c - 1)
                                            )
                                          }
                                        >
                                          −
                                        </button>
                                        <span className="w-5 text-center text-xs font-semibold">
                                          {toppingCount}
                                        </span>
                                        <button
                                          type="button"
                                          className="h-6 w-6 rounded-md bg-gray-100 text-amber-700 text-sm font-bold"
                                          onClick={() =>
                                            setToppingCount((c) => c + 1)
                                          }
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* FOOTER */}
                      <div className="shrink-0 pt-2 pb-3 px-5 border-t border-gray-100 bg-white">
                        <button
                          type="button"
                          onClick={handleConfirmAddToCart}
                          className="w-full h-10 rounded-md
                  bg-amber-700 hover:bg-amber-800
                  text-white font-medium text-sm
                  flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Thêm vào giỏ hàng : {totalPrice.toLocaleString()} đ
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

export default JuiceMenu;
