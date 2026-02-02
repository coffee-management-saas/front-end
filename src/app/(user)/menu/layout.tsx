"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ProductCategoriesResponse, ProductCategory } from "@/types/catagories";

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const activeCategoryId = useMemo(() => {
    const v = searchParams.get("categoryId");
    return v ? String(v) : null;
  }, [searchParams]);

  const isMenuPath = pathname.startsWith("/menu");

  const itemClass = (isActive: boolean) =>
    `block px-3 py-2 rounded-lg transition ${
      isActive
        ? "bg-[#693916] text-white font-semibold"
        : "bg-white text-black hover:bg-gray-100"
    }`;

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

  useEffect(() => {
    if (isMenuPath && !activeCategoryId && categories.length > 0) {
      router.replace(
        `/menu?categoryId=${encodeURIComponent(String(categories[0].id))}`,
      );
    }
  }, [isMenuPath, activeCategoryId, categories, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F5]">
      <div className="flex p-4 pt-20 flex-1 ">
        <aside className="w-50 bg-[#FDFCFC] border-r p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-5">Menu</h2>

          {catLoading && (
            <div className="text-sm text-gray-500 mb-3">Đang tải...</div>
          )}
          {catError && (
            <div className="text-sm text-red-600 mb-3">{catError}</div>
          )}

          <ul className="space-y-2">
            {categories.map((c) => {
              const idStr = String(c.id);
              const href = `/menu?categoryId=${encodeURIComponent(idStr)}`;
              const isActive = isMenuPath && activeCategoryId === idStr;

              return (
                <li key={c.id}>
                  <Link href={href} className={itemClass(isActive)}>
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex-1 pl-6">{children}</main>
      </div>
    </div>
  );
}
