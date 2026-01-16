"use client";

import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

export default function StaffHeader() {
  return (
    <header className="h-full bg-[#f6f7fb] border-b border-gray-200">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Search + Filter */}
        <div className="flex items-center gap-3 w-full max-w-170">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 w-full shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Search..."
              className="w-full outline-none text-sm bg-transparent"
            />
          </div>

          <button className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-full shadow-sm text-sm font-medium">
            <SlidersHorizontal size={18} />
            Filter
          </button>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
              {/* thay bằng <Image/> nếu bạn có avatar */}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                Albert Flores
              </p>
              <p className="text-xs text-gray-500">purrcoff@gmail.com</p>
            </div>
            <button className="p-1 rounded-lg hover:bg-gray-50">
              <ChevronDown size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
