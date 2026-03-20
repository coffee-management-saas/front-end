"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Coffee,
  CupSoda,
  Facebook,
  GlassWater,
  Instagram,
  Mail,
  MapPin,
  Milk,
  Music2,
  Phone,
  Play,
  type LucideIcon,
} from "lucide-react";

type FooterLinkGroup = {
  title: string;
  items: {
    label: string;
    href: string;
  }[];
};

type ContactItem = {
  icon: LucideIcon;
  text: string;
  highlight?: boolean;
};

type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type PatternItem = {
  icon: LucideIcon;
  className: string;
};

const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "LIÊN KẾT NHANH",
    items: [
      { label: "Trang chủ", href: "/" },
      { label: "Giới thiệu", href: "/about" },
      { label: "Sản phẩm", href: "/menu" },
      { label: "Liên hệ", href: "/about" },
    ],
  },
];

const contactItems: ContactItem[] = [
  {
    icon: MapPin,
    text: "17 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  },
  {
    icon: Phone,
    text: "Hotline: 1800 6779",
    highlight: true,
  },
  {
    icon: Mail,
    text: "hello@teacoffee.vn",
    highlight: true,
  },
];

const companyItems: ContactItem[] = [
  {
    icon: MapPin,
    text: "Công ty Cổ phần Tea Coffee, 38 Trịnh Đình Trọng, Phú Trung, Tân Phú, TP. Hồ Chí Minh",
  },
  {
    icon: Phone,
    text: "Hotline doanh nghiệp: 1900 2345 18",
    highlight: true,
  },
  {
    icon: Mail,
    text: "business@teacoffee.vn",
    highlight: true,
  },
];

const socialLinks: SocialLink[] = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "YouTube", href: "#", icon: Play },
  { label: "TikTok", href: "#", icon: Music2 },
];

const patternItems: PatternItem[] = [
  { icon: Coffee, className: "left-[4%] top-8 h-20 w-20 rotate-[-15deg]" },
  { icon: CupSoda, className: "left-[16%] top-24 h-24 w-24 rotate-[12deg]" },
  {
    icon: GlassWater,
    className: "left-[28%] top-10 h-18 w-18 rotate-[-10deg]",
  },
  { icon: Milk, className: "left-[38%] top-24 h-24 w-24 rotate-[16deg]" },
  { icon: Coffee, className: "left-[52%] top-8 h-20 w-20 rotate-[14deg]" },
  { icon: CupSoda, className: "left-[64%] top-20 h-24 w-24 rotate-[-14deg]" },
  { icon: GlassWater, className: "left-[76%] top-8 h-18 w-18 rotate-[10deg]" },
  { icon: Milk, className: "left-[88%] top-24 h-20 w-20 rotate-[-12deg]" },
  { icon: CupSoda, className: "left-[8%] bottom-12 h-22 w-22 rotate-[10deg]" },
  { icon: Coffee, className: "left-[22%] bottom-20 h-20 w-20 rotate-[-10deg]" },
  { icon: Milk, className: "left-[34%] bottom-8 h-20 w-20 rotate-[8deg]" },
  {
    icon: GlassWater,
    className: "left-[48%] bottom-18 h-18 w-18 rotate-[-14deg]",
  },
  { icon: CupSoda, className: "left-[60%] bottom-8 h-24 w-24 rotate-[14deg]" },
  { icon: Coffee, className: "left-[74%] bottom-18 h-20 w-20 rotate-[-10deg]" },
  { icon: Milk, className: "left-[86%] bottom-6 h-22 w-22 rotate-[12deg]" },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden border-t border-[#e6d3c5] bg-[#baaca0] text-[#4f2d1d]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(110,75,49,0.08),transparent_26%)]" />
        {patternItems.map(({ icon: Icon, className }, index) => (
          <div
            key={`${Icon.displayName ?? "icon"}-${index}`}
            className={`absolute hidden text-[#7a5b47]/8 md:block ${className}`}
          >
            <Icon className="h-full w-full" strokeWidth={1.15} />
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-[1680px] px-6 py-14 sm:px-10 lg:px-16 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.8fr_0.95fr_1fr] lg:gap-10">
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-flex transition-opacity duration-200 hover:opacity-90"
              aria-label="EXE Coffee"
            >
              <Image
                src="/images/logo-01.png"
                alt="Tea Coffee"
                width={380}
                height={260}
                className="h-auto w-[230px] object-contain sm:w-[280px] lg:w-[320px]"
                priority={false}
              />
            </Link>

            <div className="flex flex-wrap items-center gap-4">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center text-[#5a3827] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#7a4a2a]"
                >
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </Link>
              ))}
            </div>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.title} className="space-y-6">
              <h3 className="text-2xl font-bold uppercase tracking-[0.03em] text-[#4a2516]">
                {group.title}
              </h3>
              <ul className="space-y-4">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[1.15rem] font-medium italic text-[#5b4335] transition-colors duration-200 hover:text-[#7a4a2a]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-6">
            <h3 className="text-2xl font-bold uppercase tracking-[0.03em] text-[#4a2516]">
              THÔNG TIN LIÊN HỆ
            </h3>
            <ul className="space-y-4">
              {contactItems.map(({ icon: Icon, text, highlight }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-[#7a4a2a]" />
                  <span
                    className={`text-[1.12rem] leading-8 ${
                      highlight ? "text-[#6a3715]" : "text-[#5b4335]/90"
                    }`}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold uppercase tracking-[0.03em] text-[#4a2516]">
              ĐỊA CHỈ CÔNG TY
            </h3>
            <ul className="space-y-4">
              {companyItems.map(({ icon: Icon, text, highlight }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-[#7a4a2a]" />
                  <span
                    className={`text-[1.12rem] leading-8 ${
                      highlight ? "text-[#6a3715]" : "text-[#5b4335]/90"
                    }`}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
