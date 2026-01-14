"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
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
              <Link href="/menu/cake" className={linkClass("/menu/cake")}>
                Tất cả
              </Link>
            </li>

            <li>
              <a
                href="/menu/cake/banh-lanh"
                className={linkClass("/menu/cake/banh-lanh")}
              >
                Bánh lạnh
              </a>
            </li>

            <li>
              <a
                href="/menu/cake/banh-mi"
                className={linkClass("/menu/cake/banh-mi")}
              >
                Bánh mì
              </a>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="flex-1 pl-6">{children}</main>
      </div>
    </div>
  );
}
