"use client";

import React from "react";

const quickLinks = [
  {
    title: "Về chúng tôi",
    items: ["Giới thiệu", "Thư viện hình ảnh", "Liên hệ"],
  },
  { title: "Tuyển dụng", items: ["Cửa hàng", "Kiosk", "ăn phòng", "Nhà máy"] },
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
    <footer className="bg-[#693916] text-white border-t border-[#5b2f12]">
      <div className="w-full px-2 md:px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 max-w-sm">
            <p className="text-sm font-semibold tracking-wide uppercase text-white/80">
              F&B Coffee
            </p>
            <h3 className="text-xl font-bold leading-snug text-white">
              Thức uống chuẩn vị, phục vụ tận tâm mỗi ngày.
            </h3>
            <p className="text-sm text-white/70">
              Phòng 702, Tầng 7, Central Plaza, 17 Lê Duẩn, Bến Nghé, Quận 1,
              TP.HCM
            </p>
            <div className="text-sm space-y-1 text-white/75">
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

          <div className="flex flex-wrap gap-8 text-center justify-center flex-1">
            {quickLinks.map((group) => (
              <div key={group.title} className="min-w-[140px] space-y-2">
                <h4 className="text-lg font-bold text-white uppercase tracking-wide">
                  {group.title}
                </h4>
                <ul className="space-y-1 text-base text-white/80">
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
      </div>
    </footer>
  );
};

export default Footer;
