"use client";

import Image from "next/image";
import { Coffee, Heart, Users, Award, Clock, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F5] pt-10">
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <Image
          src="/images/about-hero.png"
          alt="F&B Coffee Shop Interior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Về Chúng Tôi
            </h1>
            <p className="text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
              Nơi hương vị cà phê hòa quyện cùng những khoảnh khắc đáng nhớ
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/images/coffee-quality.png"
              alt="Premium Coffee Beans"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="inline-block">
              <span className="text-sm font-bold text-[#693916] uppercase tracking-widest bg-amber-100 px-4 py-2 rounded-full">
                Câu Chuyện Của Chúng Tôi
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#693916] leading-tight">
              Hành Trình Từ Hạt Cà Phê Đến Tách Cà Phê Hoàn Hảo
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Được thành lập từ năm 2020, F&B Coffee bắt đầu từ niềm đam mê mãnh
              liệt với cà phê chất lượng cao và mong muốn tạo ra một không gian
              ấm cúng cho cộng đồng. Chúng tôi tin rằng mỗi tách cà phê không
              chỉ là một thức uống, mà là một trải nghiệm, một câu chuyện được
              kể qua từng hương vị tinh tế.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              Với đội ngũ barista chuyên nghiệp và tâm huyết, chúng tôi cam kết
              mang đến những sản phẩm tốt nhất từ những hạt cà phê được chọn lọc
              kỹ càng từ các vùng trồng nổi tiếng trên thế giới.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#693916] mb-4">
              Giá Trị Cốt Lõi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Những nguyên tắc định hướng mọi hoạt động của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="group bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100">
              <div className="w-16 h-16 bg-[#693916] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#693916] mb-3">
                Chất Lượng Hàng Đầu
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Chúng tôi chỉ sử dụng những hạt cà phê cao cấp nhất, được rang
                xay tươi mỗi ngày để đảm bảo hương vị tuyệt hảo trong từng tách
                cà phê.
              </p>
            </div>

            {/* Value 2 */}
            <div className="group bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100">
              <div className="w-16 h-16 bg-[#693916] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#693916] mb-3">
                Phục Vụ Tận Tâm
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Mỗi khách hàng đều được chào đón như một người bạn. Chúng tôi
                luôn lắng nghe và phục vụ với sự nhiệt tình, chu đáo nhất.
              </p>
            </div>

            {/* Value 3 */}
            <div className="group bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100">
              <div className="w-16 h-16 bg-[#693916] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#693916] mb-3">
                Cộng Đồng Gắn Kết
              </h3>
              <p className="text-gray-600 leading-relaxed">
                F&B Coffee không chỉ là quán cà phê, mà là nơi kết nối mọi
                người, nơi những câu chuyện được chia sẻ và tình bạn được nuôi
                dưỡng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-[#693916]" />
            </div>
            <div className="text-4xl font-bold text-[#693916] mb-2">5+</div>
            <div className="text-gray-600 font-medium">Năm Kinh Nghiệm</div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[#693916]" />
            </div>
            <div className="text-4xl font-bold text-[#693916] mb-2">10K+</div>
            <div className="text-gray-600 font-medium">
              Khách Hàng Thân Thiết
            </div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-10 h-10 text-[#693916]" />
            </div>
            <div className="text-4xl font-bold text-[#693916] mb-2">50+</div>
            <div className="text-gray-600 font-medium">Loại Đồ Uống</div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-[#693916]" />
            </div>
            <div className="text-4xl font-bold text-[#693916] mb-2">3</div>
            <div className="text-gray-600 font-medium">Chi Nhánh</div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gradient-to-br from-[#693916] to-[#876F60] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sứ Mệnh Của Chúng Tôi
          </h2>
          <p className="text-xl md:text-2xl font-light max-w-4xl mx-auto leading-relaxed mb-8">
            Mang đến trải nghiệm cà phê đẳng cấp, tạo nên những khoảnh khắc đáng
            nhớ và xây dựng một cộng đồng yêu thương, nơi mọi người đều cảm thấy
            được chào đón và trân trọng.
          </p>
          <div className="flex items-center justify-center gap-4 text-amber-200">
            <Clock className="w-6 h-6" />
            <span className="text-lg">
              Mở cửa hàng ngày: 7:00 AM - 10:00 PM
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#693916] mb-6">
          Ghé Thăm Chúng Tôi Ngay Hôm Nay
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Hãy đến và trải nghiệm không gian ấm cúng cùng những ly cà phê tuyệt
          vời của chúng tôi. Chúng tôi luôn chào đón bạn!
        </p>
        <a
          href="/menu"
          className="inline-block bg-[#693916] hover:bg-[#876F60] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Xem Thực Đơn
        </a>
      </section>
    </div>
  );
}
