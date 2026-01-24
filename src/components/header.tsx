"use client";
import {
  Search,
  ShoppingCart,
  Mail,
  User,
  ShoppingBag,
  Heart,
  Users,
  Star,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppContext } from "@/app/AppProvider";
import { logoutFromNextClientToNextServer } from "@/services/auth.service";

export default function PhucLongHeader() {
  const [cart, setCart] = useState(2);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { setTokens } = useAppContext();
  const handleLogout = async () => {
    try {
      await logoutFromNextClientToNextServer();
      toast.success("Đăng xuất thành công");
    } catch (e) {
      console.error(e);
      toast.error("Đăng xuất thất bại");
    } finally {
      // luôn clear state phía client
      setUser(null);
      setTokens({ accessToken: "", refreshToken: "", expiresAt: "" });
      router.replace("/login");
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 z-50 w-full">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-xs">F&B</span>
            </div>
          </Link>

          {/* Search Bar sát logo */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Bạn muốn mua gì..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-amber-700 text-sm"
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <span className="text-sm text-gray-700 hidden md:inline"></span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-amber-700 hover:text-amber-700 font-medium hidden md:inline"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <Mail className="w-6 h-6 text-gray-600" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-2 rounded-full transition hover:bg-green-50"
                    >
                      <User className="w-6 h-6 text-amber-700" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-60 rounded-xl border border-gray-100 bg-white shadow-lg"
                  >
                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link href="/profile" className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-500 group-hover:text-amber-700" />
                        <span className="text-sm text-gray-700 group-hover:text-amber-700">
                          Thông tin cá nhân
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link href="/orders" className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-gray-500 group-hover:text-amber-700" />
                        <span className="text-sm text-gray-700 group-hover:text-amber-700">
                          Đơn hàng
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link
                        href="/favorites"
                        className="flex items-center gap-3"
                      >
                        <Heart className="w-4 h-4 text-gray-500 group-hover:text-amber-700" />
                        <span className="text-sm text-gray-700 group-hover:text-amber-700">
                          Sản phẩm yêu thích
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link href="/members" className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-500 group-hover:text-amber-700" />
                        <span className="text-sm text-gray-700 group-hover:text-amber-700">
                          Khách hàng thành viên
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link href="/points" className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-gray-500 group-hover:text-amber-700" />
                        <span className="text-sm text-gray-700 group-hover:text-amber-700">
                          Điểm và hạng
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                      <span className="ml-3 text-sm text-red-600">
                        Đăng xuất
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
              <ShoppingCart className="w-6 h-6 text-amber-700" />
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
              <Link
                href="/"
                className="block py-3 hover:text-amber-700 transition border-b-2 border-transparent hover:border-amber-700"
              >
                TRANG CHỦ
              </Link>
            </li>
            <li>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="block py-3 hover:text-amber-700 transition border-b-2 border-transparent hover:border-amber-700 focus:outline-none">
                    MENU
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/menu/beverages">ĐỒ UỐNG </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/menu/cake">BÁNH</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/menu/combo">COMBO</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/menu/best-seller">BEST SELLERS</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            <li>
              <a
                href="#"
                className="block py-3 hover:text-amber-700 transition border-b-2 border-transparent hover:border-amber-700"
              >
                SẢN PHẨM ĐÓNG GÓI
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-3 hover:text-amber-700 transition border-b-2 border-transparent hover:border-amber-700"
              >
                VỀ CHÚNG TÔI
              </a>
            </li>
            <li>
              <Link
                href="/promotions"
                className="block py-3 hover:text-amber-700 transition border-b-2 border-transparent hover:border-amber-700"
              >
                KHUYẾN MÃI
              </Link>
            </li>
            <li>
              <a
                href="#"
                className="block py-3 hover:text-amber-700 transition border-b-2 border-transparent hover:border-amber-700"
              >
                HỘI VIÊN
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
