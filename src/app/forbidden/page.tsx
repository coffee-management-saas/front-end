import Link from "next/link";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForbiddenPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const nextPath = first(params.next);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">
          Không có quyền truy cập
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Tài khoản của bạn không có quyền truy cập trang này.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#8b4f22] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a5b2a]"
          >
            Về trang chủ
          </Link>
          <Link
            href="/login?force=1"
            className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </main>
  );
}
