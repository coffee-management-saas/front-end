"use client";

import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-amber-700 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 text-sm leading-relaxed text-center">
          {/* ĐỊA CHỈ */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">ĐỊA CHỈ</h3>

            <p>
              <strong>Địa chỉ:</strong> Phòng 702, Tầng 7, Tòa nhà Central
              Plaza, số 17 Lê Duẩn, phường Bến Nghé, quận 1, Hồ Chí Minh.
            </p>

            <p>
              <strong>Hotline Đặt hàng:</strong> 1800 6779
            </p>
            <p>
              <strong>Hotline Công ty:</strong> 1900 2345 18 (Bấm phím 0: Lễ Tân
              | phím 1: CSKH)
            </p>

            <p>
              <strong>Email:</strong> sales@b&b.masangroup.com
            </p>
          </div>

          {/* CÔNG TY */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">CÔNG TY</h3>
            <p>Giới thiệu công ty</p>
            <p>Thư viện hình ảnh</p>
            <p>Liên hệ</p>
            <p>Hình ảnh Menu</p>
          </div>

          {/* TUYỂN DỤNG */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">TUYỂN DỤNG</h3>
            <p>HTCH</p>
            <p>Kiosk</p>
            <p>Văn phòng</p>
            <p>Nhà máy</p>
          </div>

          {/* CỬA HÀNG */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">CỬA HÀNG</h3>
            <p>Danh sách cửa hàng</p>
          </div>

          {/* ĐIỀU KHOẢN SỬ DỤNG */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">ĐIỀU KHOẢN SỬ DỤNG</h3>
            <p>Chính sách bảo mật thông tin</p>
            <p>Chính sách đặt hàng</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
