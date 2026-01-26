"use client";

import React from "react";

const quickLinks = [
  {
    title: "Về chúng tôi",
    items: ["Giới thiệu", "Thư viện hình ảnh", "Liên hệ"],
  },
  { title: "Tuyển dụng", items: ["Cửa hàng", "Kiosk", "Văn phòng", "Nhà máy"] },
  {
    title: "Hỗ trợ",
    items: ["Câu hỏi thường gặp", "Chính sách bảo mật", "Điều khoản sử dụng"],
  },
];

const socials = [
  { label: "Facebook", href: "#", icon: "" },
  { label: "Instagram", href: "#", icon: "" },
  { label: "YouTube", href: "#", icon: "" },
];

const Footer: React.FC = () => {
  return (
    <footer className="mt-10 bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900 text-amber-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-8">
        <div className="flex flex-wrap gap-6 justify-between items-start">
          <div className="space-y-3 max-w-sm">
            <p className="text-sm font-semibold tracking-wide uppercase text-amber-200">
              F&B Coffee
            </p>
            <h3 className="text-xl font-bold leading-snug">
              Thức uống chuẩn vị, phục vụ tận tâm mỗi ngày.
            </h3>
            <p className="text-sm text-amber-100/80">
              Phòng 702, Tầng 7, Central Plaza, 17 Lê Duẩn, Bến Nghé, Quận 1,
              TP.HCM
            </p>
            <div className="text-sm space-y-1 text-amber-100/90">
              <p>
                Hotline đặt hàng:{" "}
                <span className="font-semibold text-white">1800 6779</span>
              </p>
              <p>
                Hotline công ty:{" "}
                <span className="font-semibold text-white">1900 2345 18</span>
              </p>
              <p>
                Email:{" "}
                <span className="font-semibold text-white">
                  sales@b&b.masangroup.com
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-8">
            {quickLinks.map((group) => (
              <div key={group.title} className="min-w-[140px] space-y-2">
                <h4 className="text-sm font-semibold text-amber-100 uppercase tracking-wide">
                  {group.title}
                </h4>
                <ul className="space-y-1 text-sm text-amber-100/80">
                  {group.items.map((item) => (
                    <li key={item} className="hover:text-white cursor-pointer">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-amber-100/20 pt-4">
          <div className="text-xs text-amber-100/70 ">
            © {new Date().getFullYear()} F&P Coffee. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
