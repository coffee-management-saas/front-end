"use client";

import Link from "next/link";

export function PortalFooter() {
  return (
    <footer className="relative border-white/5 border-t pt-14 pb-8 bg-black">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-[90vw] max-w-6xl h-56 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.22)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[24px] h-[24px] text-white"
              >
                <path d="m14.622 17.897-10.68-2.913" />
                <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" />
                <path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" />
              </svg>
              <span className="text-xl font-semibold tracking-tight">
                FUTURE & BETTER
              </span>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Made with <span className="text-amber-300">♥</span> —{" "}
              <span className="text-white/90">Coffee Portal</span>.
            </p>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-semibold tracking-tight">
              Trang
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="#about"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link
                  href="#about-us"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>

              <li>
                <Link
                  href="#subscription"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Gói thành viên
                </Link>
              </li>
              <li>
                <Link
                  href="#offers"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Ưu đãi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-semibold tracking-tight">
              Social
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-white/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m3 3 18 18" />
                    <path d="M17.5 6.5 6 18" />
                    <path d="M3 8h8" />
                    <path d="M13 16h8" />
                  </svg>
                  Twitter (X)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-white/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M7 17c1.5-1 3.5-1 5 0s3.5 1 5 0" />
                    <path d="M8 7h.01M16 7h.01" />
                  </svg>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-white/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 8s.5-2 2-3 4-1 8-1 6 0 8 1 2 3 2 3v8s-.5 2-2 3-4 1-8 1-6 0-8-1-2-3-2-3z" />
                    <path d="m10 9 5 3-5 3z" />
                  </svg>
                  Youtube
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-white/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 12.5 8 20l4-2 4 2-2-7.5" />
                    <path d="M12 12a5 5 0 1 0-5-5" />
                  </svg>
                  Framer
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-semibold tracking-tight">
              Subscribe
            </h4>
            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    placeholder="Enter your email..."
                    className="w-full rounded-full bg-white/[0.04] text-white placeholder-white/50 ring-1 ring-white/15 focus:ring-2 focus:ring-amber-500/60 outline-none px-4 py-2.5 text-sm transition"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
                </div>
                <button
                  type="submit"
                  className="hidden sm:inline-flex items-center gap-2 hover:from-amber-500 hover:to-orange-700 transition-colors shadow-orange-500/20 text-sm font-medium text-white bg-gradient-to-l from-amber-600 to-orange-700 rounded-full py-2 px-4 shadow-md"
                >
                  Subscribe
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-xs text-white/50">
                No spam. Unsubscribe any time.
              </p>
            </form>
          </div>
        </div>
      </div>

      <span className="hidden md:block absolute right-6 bottom-6 h-4 w-16 rounded-full border border-white/10 bg-white/5" />
    </footer>
  );
}
