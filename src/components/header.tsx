"use client";

import {
  Search,
  User,
  ShoppingBag,
  Users,
  Star,
  LogOut,
  ChevronRight,
  Coffee,
  Truck,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { ProductCategoriesResponse, ProductCategory } from "@/types/catagories";
import { DeliveryMethodModal } from "@/components/DeliveryMethodModal";
import NotificationDropdown from "@/components/notification-dropdown";

export default function PhucLongHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<{
    type: "delivery" | "pickup" | null;
    data?: any;
  }>({ type: null });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const router = useRouter();
  const { tokens, setTokens } = useAppContext();

  const isAuthenticated = useMemo(
    () => Boolean(tokens?.accessToken),
    [tokens?.accessToken],
  );

  useEffect(() => {
    const run = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "10" });
        const res = await fetch(`/api/categories?${qs.toString()}`, {
          cache: "no-store",
        });

        const data = (await res.json()) as ProductCategoriesResponse;

        if (!res.ok || data?.code !== 200) {
          throw new Error(data?.message || "Load categories failed");
        }

        const items: ProductCategory[] = (data?.data ?? []).filter(
          (c) => !c.status || c.status === "ACTIVE",
        );

        setCategories(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load categories failed";
        setCatError(msg);
      } finally {
        setCatLoading(false);
      }
    };

    run();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutFromNextClientToNextServer();
      toast.success("Đăng xuất thành công");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Đăng xuất thất bại");
    } finally {
      setTokens({ accessToken: "", refreshToken: "", expiresAt: "" });
      router.replace("/login");
    }
  };

  const handleLogin = () => router.push("/login");
  const handleRegister = () => router.push("/register");

  const handleSelectDeliveryMethod = (
    method: "delivery" | "pickup",
    data?: any,
  ) => {
    setDeliveryMethod({ type: method, data });

    if (method === "delivery") {
      toast.success(`Đã chọn giao hàng đến: ${data.address}`);
    } else if (method === "pickup") {
      toast.success(`Đã chọn nhận tại: ${data.store.name}`);
    }

    // Save to localStorage for persistence
    localStorage.setItem(
      "deliveryMethod",
      JSON.stringify({ type: method, data }),
    );
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 z-50 w-full">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-[#693916]  rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-xs">F&B</span>
            </div>
          </Link>

          {/* Search Bar */}
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

          {/* Delivery Method Selector */}
          <button
            onClick={() => setDeliveryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all group"
          >
            <Truck className="w-5 h-5 text-[#693916] group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#693916]">
              {deliveryMethod.type === "delivery"
                ? "Giao hàng tận nơi"
                : deliveryMethod.type === "pickup"
                  ? "Nhận tại cửa hàng"
                  : "Chọn Phương Thức Nhận Hàng"}
            </span>
          </button>

          {/* Mail/Notification Icon with Dropdown */}
          <div className="relative group">
            <button className="relative p-2 rounded-full hover:bg-amber-50 transition-all">
              <Mail className="w-6 h-6 text-[#693916] group-hover:text-amber-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Dropdown - appears on hover */}
            <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-50 transform translate-y-2 group-hover:translate-y-0">
              <NotificationDropdown />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4 ml-auto">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-2 rounded-full transition hover:bg-green-50"
                    >
                      <User className="w-6 h-6 text-[#693916]" />
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
                      <Link
                        href="/profile?tab=personal-info"
                        className="flex items-center gap-3"
                      >
                        <User className="w-4 h-4 text-gray-500 group-hover:text-[#693916]" />
                        <span className="text-sm text-gray-700 group-hover:text-[#693916]">
                          Thông tin cá nhân
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link
                        href="/profile?tab=orders"
                        className="flex items-center gap-3"
                      >
                        <ShoppingBag className="w-4 h-4 text-gray-500 group-hover:text-[#693916]" />
                        <span className="text-sm text-gray-700 group-hover:text-[#693916]">
                          Đơn hàng
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2 hover:bg-green-50"
                    >
                      <Link
                        href="/profile?tab=member"
                        className="flex items-center gap-3"
                      >
                        <Users className="w-4 h-4 text-gray-500 group-hover:text-[#693916]" />
                        <span className="text-sm text-gray-700 group-hover:text-[#693916]">
                          Khách hàng thành viên
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
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogin}
                  className="hidden sm:inline-flex border-gray-100 text-[#693916] hover:bg-amber-50 hover:text-[#693916]"
                >
                  Đăng nhập
                </Button>

                <Button
                  size="sm"
                  onClick={handleRegister}
                  className="bg-[#693916] text-white hover:bg-[#693916]"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 text-sm font-medium text-[#693916]">
            <li>
              <Link
                href="/"
                className="block py-3 hover:text-[#876F60] transition border-b-2 border-transparent hover:border-[#876F60]"
              >
                TRANG CHỦ
              </Link>
            </li>

            <li className="group relative h-full">
              <Link
                href="/menu"
                className="flex items-center gap-1 py-3 hover:text-[#876F60] transition border-b-2 border-transparent hover:border-[#876F60]"
              >
                MENU
                <ChevronRight className="w-4 h-4 text-gray-400 rotate-90 transition-transform group-hover:-rotate-90" />
              </Link>

              {/* Hover Dropdown */}
              <div className="absolute top-full left-0 w-72 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-50 transform translate-y-4 group-hover:translate-y-0">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-amber-100 p-2 overflow-hidden ring-1 ring-black/5">
                  <div className="px-4 py-3 border-b border-dashed border-amber-100 mb-1">
                    <span className="text-xs font-bold text-[#693916] uppercase tracking-widest flex items-center gap-2">
                      <Coffee className="w-3 h-3 text-amber-600" />
                      Danh mục sản phẩm
                    </span>
                  </div>

                  <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {catLoading && (
                      <div className="px-4 py-6 text-center">
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-xs text-gray-400 font-medium">
                          Đang tải...
                        </span>
                      </div>
                    )}

                    {catError && (
                      <div className="px-3 py-2 text-xs text-red-500 bg-red-50 rounded-lg">
                        {catError}
                      </div>
                    )}

                    {!catLoading &&
                      !catError &&
                      categories.map((c) => (
                        <Link
                          key={c.id}
                          href={`/menu?categoryId=${encodeURIComponent(String(c.id))}`}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent group/item transition-all duration-200"
                        >
                          <span className="text-sm font-medium text-gray-600 group-hover/item:text-[#693916] group-hover/item:font-semibold transition-colors">
                            {c.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:text-[#693916] transform group-hover/item:translate-x-1 transition-all" />
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </li>

            {/* <li>
              <a
                href="#"
                className="block py-3 hover:text-[#876F60] transition border-b-2 border-transparent hover:border-[#876F60]"
              >
                SẢN PHẨM ĐÓNG GÓI
              </a>
            </li> */}

            <li>
              <Link
                href="/about"
                className="block py-3 hover:text-[#876F60] transition border-b-2 border-transparent hover:border-[#876F60]"
              >
                VỀ CHÚNG TÔI
              </Link>
            </li>

            <li>
              <Link
                href="/promotions"
                className="block py-3 hover:text-[#876F60] transition border-b-2 border-transparent hover:border-[#876F60]"
              >
                KHUYẾN MÃI
              </Link>
            </li>

            <li>
              <Link
                href="/membership"
                className="block py-3 hover:text-[#876F60] transition border-b-2 border-transparent hover:border-[#876F60]"
              >
                THẺ THÀNH VIÊN
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Delivery Method Modal */}
      <DeliveryMethodModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        onSelectMethod={handleSelectDeliveryMethod}
      />
    </header>
  );
}
