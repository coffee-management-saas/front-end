"use client";
import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import CoffeeMenu from "@/app/(user)/menu/beverages/cafe/page";
import Footer from "@/components/footer";

const JuiceMenu = () => {
  const [cart, setCart] = useState(0);

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
    {
      id: 7,
      name: "Cà phê Cappuccino (L)",
      price: 65000,
      image:
        "https://i.pinimg.com/736x/58/bf/7d/58bf7d52b0e92943ae4df81df3c18903.jpg",
    },
    {
      id: 8,
      name: "Cà Phê Sữa Kem",
      price: 65000,
      image:
        "https://i.pinimg.com/736x/4c/ce/e9/4ccee99b825d0c8a83be74db379bf5a1.jpg",
    },
    {
      id: 9,
      name: "Cà Phê Sữa Đá (M)",
      price: 39000,
      image:
        "https://i.pinimg.com/736x/89/0e/53/890e53b3fb9eab117dcbb14a96cd9706.jpg",
    },
    {
      id: 10,
      name: "Cà phê Latte (M)",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/51/2e/77/512e777310e7d04b528e525480591674.jpg",
    },
  ];

  const handleAddToCart = () => {
    setCart(cart + 1);
  };

  return (
    <div className="min-h-screen bg-white pt-6">
      <div className="flex">
        {/* Main Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {juiceItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md max-w-50 mx-auto overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={200} // ↓ nhỏ hơn
                height={140} // ↓ nhỏ hơn
                className="object-cover rounded-lg"
              />
              <div className="p-3">
                <h3 className="text-sm font-semibold text-amber-700 mb-2 h-5">
                  {item.name}
                </h3>
                <h3 className="text-sm  font-bold text-amber-700 mb-2 h-5">
                  {item.price} ₫
                </h3>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-amber-700 text-white py-1.5 rounded-lg hover:bg-amber-800 
             transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={14} />
                  Đặt mua
                </button>
              </div>
            </div>
          ))}
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
      {/* <Footer /> */}
    </div>
  );
};

export default JuiceMenu;
