"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/app/lib/getImageUrl";

/* =====================
   Interfaces
===================== */

interface Discount {
  usePercentage: boolean;
  discountPercentage: number;
  requiresCouponCode: boolean;
  couponCode: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentCategoryId?: string | null;
  assignedDiscounts?: Discount[];
  subCategories?: Category[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
}

interface MegaMenuProps {
  activeMainCategory: Category;
}

/* =====================
   Banner Themes
===================== */

const bannerThemes = [
  {
    name: "olive",
    bg: "from-[#4A5D3A] via-[#3D4F2F] to-[#2D3B23]",
    badge: "bg-red-500 text-white",
  },
  {
    name: "burgundy",
    bg: "from-[#6B3A3A] via-[#5A2D2D] to-[#4A2323]",
    badge: "bg-amber-400 text-gray-900",
  },
  {
    name: "navy",
    bg: "from-[#2D3A5A] via-[#1E2A4A] to-[#151D33]",
    badge: "bg-cyan-400 text-gray-900",
  },
  {
    name: "bronze",
    bg: "from-[#5A4A3A] via-[#4A3D2D] to-[#3A2F23]",
    badge: "bg-amber-300 text-gray-900",
  },
  {
    name: "plum",
    bg: "from-[#4A3A5A] via-[#3D2D4A] to-[#2D233A]",
    badge: "bg-pink-400 text-gray-900",
  },
  {
    name: "teal",
    bg: "from-[#2D4A4A] via-[#1E3A3A] to-[#152D2D]",
    badge: "bg-emerald-400 text-gray-900",
  },
  {
    name: "charcoal",
    bg: "from-[#3A3A3A] via-[#2D2D2D] to-[#1A1A1A]",
    badge: "bg-yellow-400 text-gray-900",
  },
  {
    name: "forest",
    bg: "from-[#2D4A3A] via-[#1E3A2D] to-[#152D23]",
    badge: "bg-lime-400 text-gray-900",
  },
];

/* =====================
   Dot Grid Background
===================== */

const DotGridPattern = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.3) 1.5px, transparent 1.5px)",
        backgroundSize: "16px 16px",
      }}
    />
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    />
  </div>
);

/* =====================
   MegaMenu Component
===================== */

const MegaMenu: React.FC<MegaMenuProps> = ({ activeMainCategory }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeSubCategory, setActiveSubCategory] =
    useState<Category | null>(null);

  const brandScrollRef = useRef<HTMLDivElement>(null);
const [canScroll, setCanScroll] = useState(false);

  /* =====================
     Fetch Brands
  ===================== */

  useEffect(() => {
    if (!activeMainCategory?.id) return;

    const loadBrandsByCategory = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Brands/by-category/${activeMainCategory.id}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        setBrands(json.success ? json.data : []);
      } catch (error) {
        console.error("Failed to load category brands:", error);
        setBrands([]);
      }
    };

    loadBrandsByCategory();
  }, [activeMainCategory?.id]);

  /* =====================
     Helpers
  ===================== */
useEffect(() => {
  const el = brandScrollRef.current;
  if (!el) return;

  const checkScroll = () => {
    // +1 buffer to avoid pixel rounding bugs
    const isScrollable = el.scrollWidth > el.clientWidth + 1;
    setCanScroll(isScrollable);
  };

  checkScroll();

  // ResizeObserver → more reliable than window resize
  const observer = new ResizeObserver(checkScroll);
  observer.observe(el);

  return () => observer.disconnect();
}, [brands.length]);

  const getMaxDiscount = (cat: Category | null) => {
    if (!cat?.assignedDiscounts?.length) return null;

    const percentages = cat.assignedDiscounts
      .filter((d) => d.usePercentage)
      .map((d) => d.discountPercentage);

    return percentages.length ? Math.max(...percentages) : null;
  };

  const getThemeIndex = (slug: string) =>
    slug
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    bannerThemes.length;

  const scrollBrands = (direction: "left" | "right") => {
    if (!brandScrollRef.current) return;

    brandScrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  /* =====================
     Effects
  ===================== */

  useEffect(() => {
    const subs = activeMainCategory?.subCategories;
    setActiveSubCategory(subs?.length ? subs[0] : null);
  }, [activeMainCategory]);

  const bannerCategory = activeSubCategory || activeMainCategory;
  const maxDiscount = getMaxDiscount(activeMainCategory);

const theme =
  bannerThemes[getThemeIndex(activeMainCategory.slug)];


  return (
   <div className="absolute left-20 top-full z-50">
    <div className="w-[clamp(780px,75vw,1100px)] bg-white shadow-lg rounded-b-md overflow-hidden">
        <div className="flex min-h-[300px]">
          {/* LEFT COLUMN */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto scrollbar-hide">
            {activeMainCategory?.subCategories?.length ? (
              activeMainCategory.subCategories.map((sub) => {
                const hasChildren =
                  Array.isArray(sub.subCategories) &&
                  sub.subCategories.length > 0;

                return (
                 <Link
  key={sub.id}
  href={`/category/${sub.slug}`}
  onMouseEnter={() => setActiveSubCategory(sub)}
  className={`flex items-center justify-between p-2 transition cursor-pointer hover:bg-white hover:font-semibold ${
    activeSubCategory?.id === sub.id
      ? "bg-white font-semibold text-[#445D41]"
      : "text-gray-800"
  }`}
>

                    <span>{sub.name}</span>
                    {hasChildren && (
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          activeSubCategory?.id === sub.id
                            ? "translate-x-1 text-[#445D41]"
                            : "text-gray-400"
                        }`}
                      />
                    )}
                  </Link>
                );
              })
            ) : (
              <div className="p-4 text-gray-400 italic">
                No subcategories
              </div>
            )}
          </div>

          {/* MIDDLE COLUMN */}
          <div className="w-1/3 bg-white border-r border-gray-200 p-4">
            {activeSubCategory?.subCategories?.length ? (
              <div className="max-h-[260px] overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                {activeSubCategory.subCategories.map((child) => (
                 <Link
  key={child.id}
  href={`/category/${child.slug}`}
  className="block text-base text-gray-700 hover:text-[#445D41] hover:font-medium transition"
>

                    {child.name ?? "Unnamed"}
                  </Link>
                ))}
              </div>
           ) : (
  <div className="flex flex-col items-center justify-center h-full text-center px-6">
    
    <p className="text-sm text-gray-500">
      No further categories
    </p>
<Link href={`/category/${activeSubCategory?.slug}`}>
    <p className="text-base font-semibold text-[#445D41] mt-1">
      Explore {activeSubCategory?.name}
    </p>

    <span className="mt-3 text-xs text-gray-400">
      Browse products in this section →
    </span>
</Link>
  </div>
)}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-1/3 p-4">
            {maxDiscount ? (
              <Link
                href={`/category/${activeMainCategory.slug}?offer=true`}
              >
                <div
                  className={`relative h-full min-h-[260px] rounded-2xl overflow-hidden bg-gradient-to-br ${theme.bg} shadow-xl p-5 flex flex-col justify-between text-white transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl`}
                >
                  <DotGridPattern />

                  <div className="relative z-10">
                    <span
                      className={`inline-block ${theme.badge} text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wide shadow-md`}
                    >
                      Limited Offer
                    </span>
                    
                  </div>
                 <div className="relative z-10">
  <p className="text-xl font-semibold text-white/90">
    UP TO {maxDiscount}% OFF
  </p>
  <div className="mt-1">
  <span className="inline-block bg-white/90 text-gray-900 text-lg font-semibold px-3 py-1 rounded-md shadow backdrop-blur">
  {activeMainCategory.name}
</span>

  </div>
</div>
                  <div className="relative z-10">
                    <span className="inline-block bg-white text-gray-900 text-sm font-semibold px-3 py-1 rounded shadow-md hover:bg-gray-100 transition">
                      Shop Now →
                    </span>
                  </div>
                </div>
              </Link>
         ) : (
  <div className="relative h-full min-h-[260px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#f8faf7] to-[#eef5ec] p-5 flex flex-col justify-between shadow-md">
    
    {/* Subtle Pattern */}
    <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#445D41_1px,transparent_1px)] [background-size:16px_16px]" />

    {/* Top Badge */}
    <div className="relative z-10">
      <span className="inline-block text-[10px] font-semibold px-3 py-1 rounded bg-[#445D41]/10 text-[#445D41] uppercase tracking-wide">
        Currently
      </span>
    </div>

    {/* Center Content */}
    <div className="relative z-10 text-center">
      <p className="text-lg font-semibold text-gray-700">
        No Offers Available
      </p>
      <p className="text-sm text-gray-500 mt-1">
        in {activeMainCategory.name}
      </p>
    </div>

    {/* Bottom Hint */}
    <div className="relative z-10 text-center">
      <span className="text-xs text-gray-400">
        New deals coming soon 🚀
      </span>
    </div>
  </div>
)}
          </div>
        </div>
        {/* BRAND ROW */}
<div className="relative border-t border-gray-200 bg-white px-8 py-1 group">
       {canScroll && (
  <button
    onClick={() => scrollBrands("left")}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  >
    <ChevronLeft className="h-5 w-5 text-gray-700" />
  </button>
)}
          <div
            ref={brandScrollRef}
            className="flex gap-16 overflow-x-auto px-6 scrollbar-hide"
          >
            {brands.map((brand) => (
              <Link href={`/brands/${brand.slug}`} key={brand.id}>
                <div className="w-20 h-20 relative flex-shrink-0 hover:scale-105 transition">
                  <Image
                    src={getImageUrl(
                      brand.logoUrl,
                      "/images/placeholder.jpg"
                    )}
                    alt={brand.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
            ))}
          </div>
        {canScroll && (
  <button
    onClick={() => scrollBrands("right")}
    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  >
    <ChevronRight className="h-5 w-5 text-gray-700" />
  </button>
)}
        </div>
      </div>
    </div>
  );
};
export default MegaMenu;
