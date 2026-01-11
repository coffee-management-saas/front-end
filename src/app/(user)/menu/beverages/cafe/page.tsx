"use client";
import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Footer from "@/components/footer";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";

const CoffeeMenu = () => {
  const [cart, setCart] = useState(0);

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
    {
      id: 7,
      name: "Cà phê Cappuccino (L)",
      price: 65000,
      image:
        "https://i.pinimg.com/1200x/81/92/7e/81927ee1cf8fcd7715530b0856cf553d.jpg",
    },
    {
      id: 8,
      name: "Cà Phê Sữa Kem",
      price: 65000,
      image:
        "https://i.pinimg.com/736x/94/38/65/943865d41a8675c959ddf82aef1667ec.jpg",
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
          {coffeeItems.map((item) => (
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
      {/* <div className="w-full mt-6 flex">
        <div className="ml-auto pr-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>

              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div> */}
    </div>
  );
};

export default CoffeeMenu;
