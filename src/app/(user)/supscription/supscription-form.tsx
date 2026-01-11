"use client";
import React, { useState, useRef } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Footer from "@/components/footer";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  isBestSeller?: boolean;
  badge?: string;
}

const SubscriptionCards: React.FC = () => {
  const [cart, setCart] = useState(0);
  const newsRef = useRef<HTMLDivElement>(null);

  // Thông tin về các chương trình khuyến mãi
  const supcription: Product[] = [
    {
      id: 1,
      name: "MỪNG NGÀY QUỐC TẾ PHỤ NỮ",
      price: 59000,
      image:
        "https://i.pinimg.com/736x/5e/fe/ef/5efeefde66fb51a9c3cf727336312d5d.jpg",
      isBestSeller: true,
    },
    {
      id: 2,
      name: "VOURCHER LIỀN TAY",
      price: 59000,
      image:
        "https://i.pinimg.com/736x/95/49/0c/95490c7ff1918c006114347b834d6faf.jpg",
    },
    {
      id: 3,
      name: "COMMING SOON ",
      price: 55000,
      image:
        "https://i.pinimg.com/1200x/4a/ad/3a/4aad3ab445759dc77d1d0f47818411a6.jpg",
      badge: "Hồng Trà Sữa (L)",
    },
    {
      id: 4,
      name: "Trà Sữa Lai (M)",
      price: 55000,
      image:
        "https://i.pinimg.com/1200x/4a/0a/0f/4a0a0f55f41ea855c05605765c71be32.jpg",
    },
    {
      id: 5,
      name: "CHÀO MỪNG NĂM MỚI ",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/51/c6/07/51c6075b5b11f4e0cafc153d698fbe8e.jpg",
    },
    {
      id: 6,
      name: "Trà Sữa Ô Long Quế Hoa (L)",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/64/d7/2e/64d72e14084b39358fad5c4354c4f05f.jpg",
    },
  ];
  const handleAddToCart = () => {
    setCart(cart + 1);
  };

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

  return (
    <div className="min-h-screen ">
      {/* Main Content */}
      <main className="container mx-auto px-2 py-4 pt-1">
        {/* Title Section */}
        <div className="text-center mb-12 mt-6">
          <h1 className="text-2xl md:text-2xl font-bold text-amber-700 mb-2">
            TIN TỨC & KHUYẾN MÃI
          </h1>
        </div>

        {/* Products Grid */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => scrollLeft(newsRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div
            ref={newsRef}
            className="flex overflow-x-hidden gap-4 pb-4 mb-8 flex-1"
          >
            {supcription.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-48"
              >
                {/* Product Image */}
                <div className="relative bg-gray-100 h-32 flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                {/* Product Info */}
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-800 mb-1 h-8 text-xs leading-tight">
                    {product.name}
                  </h3>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-amber-700 hover:bg-amber-700 text-white font-semibold py-1 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1 text-xs"
                  >
                    Xem ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => scrollRight(newsRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </main>

      {/* Floating Cart Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-amber-700 hover:bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
        <ShoppingCart className="w-8 h-8" />
        {cart > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold">
            {cart}
          </span>
        )}
      </button>
      <Footer />
    </div>
  );
};

export default SubscriptionCards;
