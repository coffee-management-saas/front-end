"use client";
import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  isBestSeller?: boolean;
  badge?: string;
}

const MilkTeaHomepage: React.FC = () => {
  const [cart, setCart] = useState(0);

  const products: Product[] = [
    {
      id: 1,
      name: "Trà Sữa Phúc Long (L)",
      price: 59000,
      image: "/api/placeholder/250/300",
      isBestSeller: true,
    },
    {
      id: 2,
      name: "Trà Sữa Ô Long (L)",
      price: 59000,
      image: "/api/placeholder/250/300",
    },
    {
      id: 3,
      name: "Hồng Trà Sữa (L)",
      price: 55000,
      image: "/api/placeholder/250/300",
      badge: "Hồng Trà Sữa (L)",
    },
    {
      id: 4,
      name: "Trà Sữa Lai (M)",
      price: 55000,
      image: "/api/placeholder/250/300",
    },
    {
      id: 5,
      name: "Trà Sữa Ô Long Quế Hoa (L)",
      price: 55000,
      image: "/api/placeholder/250/300",
    },
    {
      id: 6,
      name: "Trà Sữa Ô Long Quế Hoa (L)",
      price: 55000,
      image: "/api/placeholder/250/300",
    },
  ];

  const handleAddToCart = () => {
    setCart(cart + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-2 py-4">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
            BEST SELLERS - TRÀ SỮA ĐẬM VỊ
          </h1>
          <div className="w-24 h-1 bg-green-700 mx-auto mt-4"></div>
        </div>

        {/* Products Grid */}
        <div className="flex overflow-x-auto gap-4 pb-4 mb-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-48"
            >
              {/* Product Image */}
              <div className="relative bg-gray-100 h-32 flex items-center justify-center">
                {product.isBestSeller && (
                  <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-1 text-xs font-semibold">
                    Best Seller
                  </div>
                )}

                <div className="w-16 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                  <div className="w-14 h-22 bg-linear-to-b from-amber-100 to-amber-200 rounded-lg relative">
                    <div className="absolute top-2 w-full h-4 bg-white/80 rounded-t-lg"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        ĐẬM VỊ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-1 h-8 text-xs leading-tight">
                  {product.name}
                </h3>
                <p className="text-base font-bold text-green-700 mb-2">
                  {product.price.toLocaleString("vi-VN")} ₫
                </p>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-1 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1 text-xs"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Đặt mua
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="flex justify-center">
          <button className="px-8 py-3 border-2 border-green-700 text-green-700 font-semibold rounded-lg hover:bg-green-700 hover:text-white transition-colors duration-300">
            Xem thêm 5 sản phẩm BEST SELLERS - TRÀ SỮA ĐẬM VỊ ∨
          </button>
        </div>
      </main>

      {/* Floating Cart Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
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

export default MilkTeaHomepage;
