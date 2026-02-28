import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <span className="text-2xl">🔎</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          Không tìm thấy trang
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[#8b4f22] px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Trở về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
