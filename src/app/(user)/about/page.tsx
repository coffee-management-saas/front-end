"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Coffee,
  Heart,
  Users,
  Award,
  Clock,
  MapPin,
  Sparkles,
  Leaf,
} from "lucide-react";

const featuredProductPoints = [
  "Mỗi tháng, Tea Cafe đều phát triển thêm món uống mới để thực đơn luôn tươi mới và giàu cảm hứng.",
  "Từng công thức được thử nghiệm kỹ để cân bằng hương vị, hình thức và trải nghiệm khi thưởng thức.",
  "Chúng tôi muốn mỗi lần khách quay lại đều có thêm một lựa chọn mới để khám phá và yêu thích.",
];

const coreValues = [
  {
    icon: Coffee,
    step: "01",
    eyebrow: "Chất lượng",
    title: "Chất Lượng Hàng Đầu",
    description:
      "Chúng tôi chỉ sử dụng những hạt cà phê cao cấp nhất, được rang xay tươi mỗi ngày để đảm bảo hương vị tuyệt hảo trong từng tách cà phê.",
    note: "Tuyển chọn nguyên liệu kỹ lưỡng cho từng món",
  },
  {
    icon: Heart,
    step: "02",
    eyebrow: "Trải nghiệm",
    title: "Phục Vụ Tận Tâm",
    description:
      "Mỗi khách hàng đều được chào đón như một người bạn. Chúng tôi luôn lắng nghe và phục vụ với sự nhiệt tình, chu đáo nhất.",
    note: "Chăm chút từ khi gọi món đến lúc thưởng thức",
  },
  {
    icon: Users,
    step: "03",
    eyebrow: "Kết nối",
    title: "Cộng Đồng Gắn Kết",
    description:
      "Tea Cafe không chỉ là quán cà phê, mà là nơi kết nối mọi người, nơi những câu chuyện được chia sẻ và tình bạn được nuôi dưỡng.",
    note: "Gìn giữ một không gian gần gũi mỗi ngày",
  },
] as const;

const featuredProductImages = [
  // {
  //   src: "/images/export-02-cutout-preview3.png",
  //   alt: "Sản phẩm nổi bật Tea Cafe",
  // },
  {
    src: "/images/133.png",
    alt: "Bộ sưu tập đồ uống mới của Tea Cafe",
  },
  {
    src: "/images/ngoc.png",
    alt: "Bộ sưu tập đồ uống mới của Tea Cafe",
  },
];

export default function AboutPage() {
  const [activeProductImage, setActiveProductImage] = useState(0);

  const handleScrollToStory = () => {
    const storySection = document.getElementById("about-story");

    if (!storySection) return;

    storySection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (featuredProductImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveProductImage(
        (prev) => (prev + 1) % featuredProductImages.length,
      );
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F9F7F5_0%,#FCFAF7_38%,#F6F1EA_100%)]">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <Image
          src="/images/about-hero.png"
          alt="Không gian Tea Cafe"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(61,36,18,0.22)_0%,rgba(12,8,5,0.68)_56%,rgba(7,5,4,0.86)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,5,0.7)_0%,rgba(14,10,7,0.54)_36%,rgba(10,7,5,0.82)_100%)]" />
        <div className="relative flex min-h-[540px] items-center justify-center px-4 py-24 md:min-h-[640px]">
          <div className="mx-auto max-w-5xl text-center text-white">
            <div className="mb-8 flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.36em] text-amber-200/90">
              <span className="h-px w-12 bg-amber-200/55" />
              Tea Cafe Signature Space
              <span className="h-px w-12 bg-amber-200/55" />
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#fbf2e8] sm:text-6xl md:text-7xl lg:text-[5.6rem]">
              Về Chúng Tôi
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-white/72 sm:text-lg md:text-xl">
              Khám phá hành trình tạo nên Tea Cafe, nơi hương vị được chăm chút
              bằng sự tinh tế, lòng hiếu khách và mong muốn mang đến những trải
              nghiệm đáng nhớ trong từng khoảnh khắc.
            </p>

            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={handleScrollToStory}
                className="aboutHeroCta group relative inline-flex items-center gap-3 overflow-hidden border border-white/22 bg-black/14 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-amber-200/60 hover:bg-white/10 hover:shadow-[0_24px_44px_-30px_rgba(0,0,0,0.65)] active:translate-y-0"
              >
                <span className="aboutHeroCtaShimmer pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.18)_45%,transparent_75%)]" />
                <span className="relative z-10">Tìm hiểu ngay</span>
                <span className="relative z-10 flex h-4 w-5 items-center">
                  <ArrowRight className="aboutHeroCtaArrow h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section
        id="about-story"
        className="container mx-auto scroll-mt-24 px-4 py-16 md:py-24"
      >
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
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#693916] shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Câu Chuyện Của Chúng Tôi
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

      {/* Product Introduction Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/35 to-transparent" />
        <div className="pointer-events-none absolute -left-16 top-24 h-44 w-44 rounded-full bg-[#ead9bd]/12 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-16 h-56 w-56 rounded-full bg-[#f6ede0]/35 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#693916] shadow-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Đổi Mới Mỗi Tháng
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold leading-tight text-[#693916] md:text-4xl">
                  Chúng tôi luôn muốn mang đến cho khách hàng những món uống mới
                </h2>
                <p className="max-w-2xl text-lg leading-relaxed text-[#6f6256]">
                  Với Tea Cafe, sáng tạo sản phẩm không phải là một điểm nhấn
                  ngẫu hứng mà là một phần trong hành trình phát triển thương
                  hiệu. Chúng tôi luôn nỗ lực mang đến những món uống mới theo
                  từng tháng, từ ý tưởng nguyên liệu, cách phối vị đến trải
                  nghiệm khi thưởng thức, để thực đơn luôn mới mẻ và khách hàng
                  luôn có thêm điều đáng mong chờ.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {featuredProductPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-[#efe6da] bg-white/72 p-4 text-sm leading-6 text-[#5f5247] shadow-[0_14px_30px_-26px_rgba(93,59,20,0.28)] backdrop-blur-sm"
                  >
                    <div className="mb-2 flex items-center gap-2 text-[#7b5722]">
                      <Leaf className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                        Tea Cafe
                      </span>
                    </div>
                    {point}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="/menu"
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#693916] px-7 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:bg-[#876F60]"
                >
                  Xem Thực Đơn
                </a>
                <p className="text-sm font-medium text-[#7a6858]">
                  Mỗi tháng là một trải nghiệm mới, nhưng chất lượng và sự chỉn
                  chu vẫn luôn được giữ nguyên trong từng ly.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="relative px-6 pb-8 pt-10">
                <div className="pointer-events-none absolute inset-x-8 bottom-8 h-24 rounded-full bg-white/35 blur-2xl" />
                <div className="pointer-events-none absolute left-0 top-28 h-40 w-56 rounded-[50%] bg-[#e3cf9f]/14 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-20 h-40 w-56 rounded-[50%] bg-[#f8efe0]/28 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/45 via-white/10 to-transparent" />

                <div className="relative mx-auto max-w-[420px]">
                  <div className="relative aspect-[3/4] w-full">
                    {featuredProductImages.map((image, index) => (
                      <Image
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 1024px) 80vw, 420px"
                        className={`object-contain drop-shadow-[0_28px_38px_rgba(104,73,23,0.22)] transition-all duration-700 ${
                          activeProductImage === index
                            ? "translate-y-0 scale-100 opacity-100"
                            : "pointer-events-none translate-y-4 scale-[0.98] opacity-0"
                        }`}
                        priority={index === 0}
                      />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2">
                    {featuredProductImages.map((image, index) => (
                      <button
                        key={`${image.src}-dot`}
                        type="button"
                        onClick={() => setActiveProductImage(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          activeProductImage === index
                            ? "w-8 bg-[#693916]"
                            : "w-2.5 bg-[#d7c8b0] hover:bg-[#bba17c]"
                        }`}
                        aria-label={`Chuyển đến hình sản phẩm ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a5721] shadow-sm">
                  Signature Pick
                </div>
                <div className="absolute bottom-5 right-5 rounded-full bg-[#693916] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_16px_34px_-18px_rgba(54,28,8,0.7)]">
                  Fresh Everyday
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/32 to-transparent" />
        <div className="pointer-events-none absolute -left-12 top-24 h-48 w-48 rounded-full bg-[#efe0cb]/22 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-16 h-52 w-52 rounded-full bg-[#f7ecdb]/35 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#693916] shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Giá Trị Cốt Lõi
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#693916] md:text-4xl">
              Những nguyên tắc tạo nên bản sắc của Tea Cafe
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#6c6258]">
              Mỗi sản phẩm, mỗi trải nghiệm và mỗi cuộc gặp gỡ tại Tea Cafe đều
              được xây dựng từ những giá trị cốt lõi rõ ràng và bền vững.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {coreValues.map(
              (
                { icon: Icon, step, eyebrow, title, description, note },
                index,
              ) => (
                <article
                  key={title}
                  className={`group relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-white/86 p-7 shadow-[0_24px_60px_-42px_rgba(83,50,20,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_72px_-40px_rgba(83,50,20,0.42)] md:p-8 ${
                    index === 1 ? "lg:-translate-y-3" : ""
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#c89c64_0%,#f1dfc3_100%)]" />
                  <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-[#f6eee3]/55 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#6e3f20_0%,#8d613f_100%)] text-white shadow-[0_22px_40px_-26px_rgba(79,45,19,0.75)] transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-[#d9cab8]">
                      {step}
                    </span>
                  </div>

                  <div className="relative mt-7">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b7650]">
                      {eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#693916]">
                      {title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-7 text-[#64594f]">
                      {description}
                    </p>
                  </div>

                  <div className="relative mt-6 flex items-center gap-3 border-t border-[#efe5da] pt-5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#b6834f]" />
                    <p className="text-sm font-medium text-[#7a6858]">{note}</p>
                  </div>
                </article>
              ),
            )}
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top,#faf7f3_0%,#f1e8de_42%,#ebe1d7_100%)] px-6 py-16 text-center text-[#5a3c29] shadow-[0_36px_80px_-44px_rgba(90,57,25,0.14)] md:px-10 md:py-20">
            <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/28 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-10 h-48 w-48 rounded-full bg-[#efe2d2]/45 blur-3xl" />
            <h2 className="mb-6 text-3xl font-bold text-[#693916] md:text-4xl">
              Sứ Mệnh Của Chúng Tôi
            </h2>
            <p className="mx-auto mb-8 max-w-4xl text-xl font-light leading-relaxed text-[#6c5c4f] md:text-2xl">
              Mang đến trải nghiệm cà phê đẳng cấp, tạo nên những khoảnh khắc
              đáng nhớ và xây dựng một cộng đồng yêu thương, nơi mọi người đều
              cảm thấy được chào đón và trân trọng.
            </p>
            <div className="inline-flex items-center justify-center gap-4 rounded-full border border-[#ddd1c3] bg-white/58 px-5 py-3 text-[#7f5d3f] shadow-[0_18px_34px_-28px_rgba(90,57,25,0.22)]">
              <Clock className="h-6 w-6" />
              <span className="text-lg">
                Mở cửa hàng ngày: 7:00 AM - 10:00 PM
              </span>
            </div>
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

      <style jsx>{`
        .aboutHeroCta {
          animation: aboutHeroCtaPulse 3.6s ease-in-out infinite;
        }

        .aboutHeroCtaShimmer {
          transform: translateX(-140%);
          opacity: 0;
          will-change: transform, opacity;
          animation: aboutHeroCtaShimmer 3.6s ease-in-out infinite;
        }

        .aboutHeroCtaArrow {
          will-change: transform;
          animation: aboutHeroCtaArrow 1.4s ease-in-out infinite;
        }

        @keyframes aboutHeroCtaPulse {
          0%,
          100% {
            box-shadow: 0 16px 28px -24px rgba(0, 0, 0, 0.28);
          }
          50% {
            box-shadow:
              0 22px 42px -28px rgba(0, 0, 0, 0.42),
              0 0 0 1px rgba(252, 211, 77, 0.14);
          }
        }

        @keyframes aboutHeroCtaShimmer {
          0%,
          18% {
            transform: translateX(-140%);
            opacity: 0;
          }
          30%,
          48% {
            opacity: 1;
          }
          62%,
          100% {
            transform: translateX(140%);
            opacity: 0;
          }
        }

        @keyframes aboutHeroCtaArrow {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aboutHeroCta,
          .aboutHeroCtaShimmer,
          .aboutHeroCtaArrow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
