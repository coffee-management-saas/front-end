"use client";
import { Search, ShoppingCart, Mail, User } from "lucide-react";
import { useState } from "react";

export default function PhucLongHeader() {
  const [cart, setCart] = useState(2);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="w-full">
      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">F&B</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Bạn muốn mua gì..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm"
                />
              </div>
            </div>

            {/* Right Side Icons & User Info */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700 hidden md:inline">
                    {/* Xin chào, {user.name} */}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-green-700 hover:text-green-800 font-medium hidden md:inline"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Mail className="w-6 h-6 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <User className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Cart Button */}
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <ShoppingCart className="w-6 h-6 text-green-700" />
                {cart > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {cart}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-gray-200">
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center gap-8 text-sm font-medium text-gray-700">
              <li>
                <a
                  href="#"
                  className="block py-3 hover:text-green-700 transition border-b-2 border-transparent hover:border-green-700"
                >
                  TRANG CHỦ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-3 hover:text-green-700 transition border-b-2 border-transparent hover:border-green-700"
                >
                  MENU
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-3 hover:text-green-700 transition border-b-2 border-transparent hover:border-green-700"
                >
                  SẢN PHẨM ĐÓNG GÓI
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-3 hover:text-green-700 transition border-b-2 border-transparent hover:border-green-700"
                >
                  VỀ CHÚNG TÔI
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-3 hover:text-green-700 transition border-b-2 border-transparent hover:border-green-700"
                >
                  KHUYẾN MÃI
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-3 hover:text-green-700 transition border-b-2 border-transparent hover:border-green-700"
                >
                  HỘI VIÊN
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    </div>
  );
}
