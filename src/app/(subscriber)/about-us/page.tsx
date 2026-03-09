import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  Coffee,
  HandHeart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export const metadata: Metadata = {
  title: "Về chúng tôi | Coffee Management",
  description:
    "Nền tảng cung cấp website bán hàng và hệ thống quản lý theo gói thuê dành cho cửa hàng cà phê: triển khai nhanh, tùy biến thương hiệu, vận hành ổn định.",
};

const stats = [
  { label: "Triển khai", value: "Nhanh", icon: Sparkles },
  { label: "Tùy biến", value: "Linh hoạt", icon: Coffee },
  { label: "Bảo mật", value: "An toàn", icon: ShieldCheck },
  { label: "Đồng hành", value: "Tận tâm", icon: HandHeart },
] as const satisfies ReadonlyArray<{
  label: string;
  value: string;
  icon: IconType;
}>;

const values = [
  {
    title: "Tập trung vào vận hành",
    description:
      "Tối ưu luồng đặt hàng, quản lý menu, khuyến mãi và hội viên để cửa hàng chạy mượt mỗi ngày.",
    icon: Coffee,
  },
  {
    title: "Tùy biến theo thương hiệu",
    description:
      "Màu sắc, banner, nội dung trang giới thiệu — chỉnh theo nhận diện để bạn sở hữu một website đúng chất quán.",
    icon: Sparkles,
  },
  {
    title: "Bảo mật & ổn định",
    description:
      "Ưu tiên bảo vệ dữ liệu và đảm bảo hệ thống hoạt động ổn định để bạn yên tâm bán hàng.",
    icon: ShieldCheck,
  },
  {
    title: "Đồng hành dài hạn",
    description:
      "Không chỉ triển khai, chúng tôi hỗ trợ vận hành, hướng dẫn sử dụng và cập nhật theo nhu cầu phát triển.",
    icon: Users,
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  icon: IconType;
}>;

const solutions = [
  {
    name: "Website bán & đặt online",
    description:
      "Menu rõ ràng, đặt hàng nhanh, giỏ hàng mượt — giúp quán tăng kênh bán và giảm tải tại quầy.",
    image: "/images/about-hero.png",
    tag: "Core",
  },
  {
    name: "Quản lý menu & khuyến mãi",
    description:
      "Dễ dàng cập nhật sản phẩm, giá, topping và tạo chương trình ưu đãi theo mùa cho khách hàng.",
    image: "/images/coffee-quality.png",
    tag: "Growth",
  },
  {
    name: "Hội viên & tích điểm",
    description:
      "Xây tệp khách hàng trung thành bằng tích điểm, ưu đãi theo hạng và lịch sử mua hàng.",
    image: "/images/hoivien.jpg",
    tag: "Retention",
  },
] as const satisfies ReadonlyArray<{
  name: string;
  description: string;
  image: string;
  tag: string;
}>;

const perks = [
  {
    title: "Thuê theo gói, chi phí rõ ràng",
    description:
      "Chọn gói phù hợp quy mô cửa hàng; dễ nâng cấp khi nhu cầu tăng mà không phải xây lại từ đầu.",
  },
  {
    title: "Triển khai nhanh, sẵn sàng vận hành",
    description:
      "Có sẵn giao diện, tính năng và quy trình setup giúp bạn lên website và bắt đầu bán nhanh hơn.",
  },
  {
    title: "Bảo trì & cập nhật định kỳ",
    description:
      "Hệ thống được cập nhật và tối ưu thường xuyên để đảm bảo ổn định trong suốt thời gian thuê.",
  },
  {
    title: "Hỗ trợ kỹ thuật & hướng dẫn sử dụng",
    description:
      "Đồng hành trong quá trình vận hành: xử lý sự cố, hướng dẫn thao tác và tối ưu trải nghiệm đặt hàng.",
  },
] as const satisfies ReadonlyArray<{ title: string; description: string }>;

const timeline = [
  {
    time: "Bước 1",
    title: "Khảo sát nhu cầu cửa hàng",
    description:
      "Hiểu mô hình bán hàng, menu, quy trình và mục tiêu để đề xuất gói thuê phù hợp.",
  },
  {
    time: "Bước 2",
    title: "Tùy biến theo thương hiệu",
    description:
      "Thiết kế, banner, nội dung trang giới thiệu và cấu trúc menu được điều chỉnh theo nhận diện quán.",
  },
  {
    time: "Bước 3",
    title: "Thiết lập vận hành & kiểm thử",
    description:
      "Nhập sản phẩm, giá, topping, khuyến mãi, hội viên và test luồng đặt hàng trước khi go‑live.",
  },
  {
    time: "Bước 4",
    title: "Go‑live & đồng hành lâu dài",
    description:
      "Vận hành chính thức, theo dõi tối ưu và hỗ trợ kỹ thuật trong suốt thời gian thuê.",
  },
] as const satisfies ReadonlyArray<{
  time: string;
  title: string;
  description: string;
}>;

const team = [
  {
    name: "Ngọc Anh",
    role: "Customer Success",
    bio: "Onboarding và đồng hành cùng cửa hàng trong quá trình sử dụng và tối ưu vận hành.",
  },
  {
    name: "Minh Khang",
    role: "Product",
    bio: "Thiết kế tính năng theo nhu cầu thực tế của quán, đảm bảo dễ dùng và hiệu quả.",
  },
  {
    name: "Thảo Vy",
    role: "Sales & Partnerships",
    bio: "Tư vấn gói thuê phù hợp và kết nối hợp tác để mở rộng hệ sinh thái cho cửa hàng.",
  },
  {
    name: "Hoàng Long",
    role: "Engineering",
    bio: "Phát triển nền tảng, đảm bảo tốc độ, bảo mật và khả năng mở rộng khi cửa hàng tăng trưởng.",
  },
] as const satisfies ReadonlyArray<{
  name: string;
  role: string;
  bio: string;
}>;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.2em] text-amber-300/90 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[92vw] max-w-6xl bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.20)_0%,transparent_65%)]" />
        <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 h-[420px] w-[94vw] max-w-6xl bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.14)_0%,transparent_60%)]" />
      </div>

      <PortalHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/about-hero.png"
            alt="Coffee Management platform"
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 md:pt-20 pb-14 md:pb-18">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-4 py-2 text-xs text-white/80">
              <Sparkles className="h-4 w-4 text-amber-300/90" />
              Nền tảng dành cho cửa hàng cà phê
            </p>
            <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight">
              Về FUTURE & BETTER
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-white/70">
              Chúng tôi tạo ra hệ thống website bán hàng và quản lý theo mô hình
              thuê gói, để các quán cà phê có thể dễ dàng tìm đến, lựa chọn gói
              phù hợp và triển khai nhanh mà không cần tự xây dựng từ đầu.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#about"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-black px-6 py-3 text-sm font-semibold shadow-[0_18px_70px_rgba(245,158,11,0.25)] hover:bg-amber-400 transition-colors"
              >
                Khám phá ngay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/portal#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-white/5 text-white px-6 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10 transition-colors"
              >
                Xem gói thuê
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-2 text-xs">
              {[
                { label: "Giới thiệu", href: "#about" },
                { label: "Tính năng", href: "#menu" },
                { label: "Triển khai", href: "#space" },
                { label: "Cam kết", href: "#values" },
                { label: "Gói thuê", href: "#pricing" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 pb-6 md:pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 px-5 py-6"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-amber-300/90" />
                  <span className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {s.value}
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/70">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <SectionHeading
            eyebrow="Về hệ thống"
            title="Website cho quán cà phê — thuê theo gói, dùng ngay"
            description="Bạn là chủ quán hoặc chuỗi cửa hàng và muốn có website bán hàng chuyên nghiệp? Coffee Management cung cấp nền tảng theo mô hình thuê bao: có sẵn tính năng, dễ tùy biến, không cần tự xây dựng từ đầu."
          />

          <div className="relative overflow-hidden rounded-[28px] ring-1 ring-white/10 bg-white/[0.03]">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/5" />
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/coffee-quality.png"
                alt="Coffee Management"
                fill
                className="object-cover opacity-85"
              />
            </div>
            <div className="relative p-6">
              <p className="text-sm text-white/70 leading-relaxed">
                Nền tảng được thiết kế cho bài toán thực tế của quán: cập nhật
                menu, quản lý sản phẩm và khuyến mãi, theo dõi đơn hàng và chăm
                sóc khách hàng thân thiết. Mọi thứ được “đóng gói” thành các gói
                thuê để bạn triển khai nhanh và tối ưu chi phí.
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-amber-300/90" /> Bảo mật
                  dữ liệu
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-2">
                  <Sparkles className="h-4 w-4 text-amber-300/90" /> Tùy biến
                  thương hiệu
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="menu"
        className="border-t border-white/5 bg-gradient-to-b from-black to-neutral-950"
      >
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <SectionHeading
              eyebrow="Tính năng nổi bật"
              title="Những module quan trọng cho quán cà phê"
              description="Từ website bán hàng đến quản lý khuyến mãi và hội viên — nền tảng được đóng gói để cửa hàng dùng ngay."
            />
            <Link
              href="/portal#pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300/90 hover:text-amber-200 transition-colors"
            >
              Xem gói thuê <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {solutions.map((item) => (
              <article
                key={item.name}
                className="group rounded-[28px] overflow-hidden bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/[0.05] transition-colors"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/55 ring-1 ring-white/10 px-3 py-1.5 text-xs text-white/80">
                    {item.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery / Implementation */}
      <section id="space" className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-start">
          <SectionHeading
            eyebrow="Triển khai"
            title="Quy trình triển khai rõ ràng, dễ theo dõi"
            description="Chúng tôi chuẩn hóa từng bước để cửa hàng lên website nhanh, vận hành ổn định và dễ mở rộng khi phát triển."
          />

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Chọn gói thuê phù hợp",
                desc: "Theo quy mô, nhu cầu và ngân sách của cửa hàng.",
                icon: Sparkles,
              },
              {
                title: "Tùy biến thương hiệu",
                desc: "Màu sắc, banner và nội dung theo nhận diện quán.",
                icon: Coffee,
              },
              {
                title: "Thiết lập menu & vận hành",
                desc: "Sản phẩm, topping, giá, khuyến mãi và hội viên.",
                icon: Users,
              },
              {
                title: "Go‑live & hỗ trợ",
                desc: "Theo dõi, tối ưu và hỗ trợ kỹ thuật trong suốt thời gian thuê.",
                icon: HandHeart,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6"
                >
                  <Icon className="h-6 w-6 text-amber-300/90" />
                  <h3 className="mt-4 font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="border-t border-white/5 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
          <SectionHeading
            eyebrow="Cam kết"
            title="Những nguyên tắc chúng tôi theo đuổi"
            description="Với mô hình thuê theo gói, điều quan trọng nhất là minh bạch, ổn định và đồng hành lâu dài cùng cửa hàng."
          />

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-[28px] bg-white/[0.03] ring-1 ring-white/10 p-6"
                >
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-amber-300/90" />
                  </div>
                  <h3 className="mt-5 font-semibold tracking-tight">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="offers" className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-start">
          <SectionHeading
            eyebrow="Lợi ích"
            title="Vì sao nhiều cửa hàng chọn mô hình thuê"
            description="Thay vì tự xây dựng từ đầu, bạn dùng ngay nền tảng đã chuẩn hóa và tập trung vào bán hàng, vận hành."
          />

          <div className="space-y-4">
            {perks.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl bg-white/[0.04] ring-1 ring-white/10 p-6"
              >
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-white/5 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
          <SectionHeading
            eyebrow="Quy trình"
            title="Triển khai theo từng bước"
            description="Bắt đầu nhanh, tùy biến theo thương hiệu và mở rộng dần theo nhu cầu của cửa hàng."
          />

          <div className="mt-10 grid gap-4">
            {timeline.map((t) => (
              <div
                key={`${t.time}:${t.title}`}
                className="rounded-3xl bg-white/[0.03] ring-1 ring-white/10 p-6 md:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-[68px]">
                    <span className="inline-flex rounded-full bg-amber-500/10 ring-1 ring-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200">
                      {t.time}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.title}</h3>
                    <p className="mt-2 text-sm text-white/70 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <SectionHeading
            eyebrow="Đội ngũ"
            title="Những người đứng sau nền tảng"
            description="Từ sản phẩm đến kỹ thuật và hỗ trợ vận hành — cùng chung mục tiêu: giúp cửa hàng chạy tốt hơn mỗi ngày."
          />
          <div className="text-sm text-white/60">
            Tư vấn gói thuê & triển khai theo nhu cầu
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((m) => {
            const initials = m.name
              .split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={m.name}
                className="rounded-[28px] bg-white/[0.03] ring-1 ring-white/10 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center text-sm font-semibold text-amber-200">
                    {initials}
                  </div>
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-white/60">{m.role}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/70 leading-relaxed">
                  {m.bio}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing CTA (Pricing anchor) */}
      <section id="pricing" className="border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="rounded-[36px] overflow-hidden bg-gradient-to-br from-amber-500/15 via-white/[0.02] to-white/[0.01] ring-1 ring-white/10">
            <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 p-8 md:p-12 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-amber-300/90 uppercase">
                  Website rental packages
                </p>
                <h2 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight">
                  Chọn gói thuê phù hợp cho cửa hàng của bạn
                </h2>
                <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
                  Bắt đầu với gói cơ bản để có website bán hàng chuyên nghiệp,
                  sau đó nâng cấp khi cần thêm tính năng. Chi phí theo gói giúp
                  bạn dễ dự toán và tối ưu hiệu quả.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/portal#pricing"
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-black px-6 py-3 text-sm font-semibold hover:bg-amber-400 transition-colors"
                  >
                    Xem gói thuê <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/portal"
                    className="inline-flex items-center gap-2 rounded-full bg-white/5 text-white px-6 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10 transition-colors"
                  >
                    Về trang Portal
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] bg-black/40 ring-1 ring-white/10 p-6 md:p-7">
                <h3 className="font-semibold">Cam kết dịch vụ</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  {[
                    "Gói thuê minh bạch, dễ nâng cấp",
                    "Bảo trì & cập nhật định kỳ",
                    "Hỗ trợ kỹ thuật khi cần",
                  ].map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300/90" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-white/50 leading-relaxed">
                  Bạn muốn demo theo mô hình cửa hàng? Hãy bắt đầu từ trang
                  Portal và chọn gói thuê phù hợp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
