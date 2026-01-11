"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-3 py-2 rounded-lg transition
     ${
       pathname === path
         ? "bg-amber-700 text-white font-semibold"
         : "hover:bg-gray-100 hover:text-black"
     }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* body */}
      <div className="flex p-4 pt-20 flex-1">
        {/* Sidebar */}
        <aside className="w-50 bg-white border-r p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Thức uống</h2>

          <ul className="space-y-2">
            <li>
              <a
                href="/menu/beverages"
                className={linkClass("/menu/beverages")}
              >
                Tất cả
              </a>
            </li>

            <li>
              <a
                href="/menu/beverages/cafe"
                className={linkClass("/menu/beverages/cafe")}
              >
                Cà phê
              </a>
            </li>

            <li>
              <a
                href="/menu/beverages/juice"
                className={linkClass("/menu/beverages/juice")}
              >
                Nước trái cây
              </a>
            </li>

            <li>
              <a
                href="/menu/beverages/milk-tea"
                className={linkClass("/menu/beverages/milk-tea")}
              >
                Trà sữa
              </a>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="flex-1 pl-6">{children}</main>
      </div>

      {/* Footer nằm dưới cùng */}
      <Footer />
    </div>
  );
}
