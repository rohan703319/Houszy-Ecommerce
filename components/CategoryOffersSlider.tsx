//components\CategoryOffersSlider.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Tag, ShoppingBag, Gift, Percent, Sparkles, Square } from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";

/* ================= TYPES ================= */
interface Discount {
  id?: string;
  isActive: boolean;
  usePercentage: boolean;
  discountPercentage: number;
  requiresCouponCode: boolean;
  couponCode: string;
  startDate: string;
  endDate: string;
  adminComment?: string;
}


interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  assignedDiscounts: Discount[];
  subCategories?: Category[];
}
const stripHtml = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};
/* ================= HELPERS ================= */
const CategoryImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <div className="relative w-full h-full">
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-contain"
        onError={() => setImgSrc("/placeholder-category.png")}
        loading="lazy"
      />
    </div>
  );
};
/* ================= COMPONENT ================= */

export default function CategoryOffersSlider({
  categories,
  baseUrl,
}: {
  categories: Category[];
  baseUrl: string;
}) {
  const isDiscountValid = (discount: Discount) => {
    if (!discount?.isActive) return false;

    const now = new Date();

    const start = new Date(discount.startDate.endsWith("Z") ? discount.startDate : discount.startDate + "Z");
    const end = new Date(discount.endDate.endsWith("Z") ? discount.endDate : discount.endDate + "Z");

    if (now < start) return false;
    if (now > end) return false;

    return true;
  };

  const flattenCategories = (
    categoryList: Category[]
  ): Category[] => {
    return categoryList.flatMap((category) => [
      category,
      ...flattenCategories(
        category.subCategories || []
      ),
    ]);
  };

  const flattenedCategories =
    flattenCategories(categories);

  // ✅ Remove duplicates
  const uniqueCategories =
    flattenedCategories.filter(
      (cat, index, self) =>
        index ===
        self.findIndex((c) => c.id === cat.id)
    );

  const offerCategories =
    uniqueCategories.filter((c) => {
      if (!c.assignedDiscounts?.length)
        return false;

      const validDiscount =
        c.assignedDiscounts.find((d) =>
          isDiscountValid(d)
        );

      return !!validDiscount;
    });

  if (offerCategories.length === 0) return null;

  /* 🔐 SAFE IMAGE RESOLVER */
  const getImageSrc = (imageUrl?: string | null) => {
    if (!imageUrl) return "/placeholder-category.png";
    return imageUrl.startsWith("http")
      ? imageUrl
      : `${baseUrl}${imageUrl}`;
  };

  return (
    <section className="relative w-full py-4 mt-0 overflow-hidden bg-gray-50">
      <div className="relative max-w-7xl mx-auto px-2">
        {/* ===== HEADER (NO BACKGROUND) ===== */}
        <div className="mb-1 md:mb-3 text-center">
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight">
            <span className="text-[#445D41]">Exclusive</span>{" "}
            <span className="text-[#2C332B]">Category Offers</span>
          </h2>
          <p className="mt-1 text-xs md:text-base text-gray-700">
            Save big on selected categories - limited time only
          </p>
        </div>
      </div>

      {/* ===== FESTIVE BACKGROUND STARTS HERE (FULL WIDTH) ===== */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#445D41] via-[#2f6b3f] to-black pt-4 pb-2">
        {/* SQUARE GRID PATTERN (High Performance) */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* FLOATING ICONS AND SQUARES (Pushed to far edges) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Left Edge Icons */}

          <ShoppingBag className="absolute bottom-[15%] left-[3%] text-white opacity-[0.04] h-24 w-24 transform rotate-6" />
          <Sparkles className="absolute top-[10%] left-[3%] text-white opacity-[0.04] h-24 w-24" />

          {/* Right Edge Icons */}

          <Gift className="absolute bottom-[10%] right-[2%] text-white opacity-[0.03] h-32 w-32 transform rotate-12" />
          <Sparkles className="absolute top-[10%] right-[3%] text-white opacity-[0.05] h-24 w-24" />
        </div>

        {/* SOFT LIGHT BAND */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4">
          {/* ===== SLIDER ===== */}
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            loop={offerCategories.length > 2}
            spaceBetween={12}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 14 },
              768: { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 20 },
            }}
            className="!pb-7"
            style={{ paddingBottom: "1.75rem" }}
          >
            {offerCategories.map((cat) => {
              const validDiscounts = cat.assignedDiscounts.filter((d) =>
                isDiscountValid(d)
              );
              const validDiscount = cat.assignedDiscounts.find((d) =>
                isDiscountValid(d)
              );

              const adminComment = stripHtml(validDiscount?.adminComment);
              const percentageDiscounts = validDiscounts
                .filter((d) => d.usePercentage)
                .map((d) => d.discountPercentage);
              const offerDiscountIds = validDiscounts
                .map((d) => d.id)
                .filter(Boolean)
                .join(",");

              const maxDiscount =
                percentageDiscounts.length > 0
                  ? Math.max(...percentageDiscounts)
                  : null;

              const offerText = maxDiscount
                ? `UP TO ${maxDiscount}% OFF`
                : "SPECIAL OFFER";

              return (
                <SwiperSlide key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}?offer=true${offerDiscountIds
                      ? `&discountIds=${encodeURIComponent(offerDiscountIds)}`
                      : ""
                      }`}
                  >
                    <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 flex flex-col group">
                      {/* OFFER BADGE */}
                      <div className="absolute top-2 left-2 z-10 flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-red-600 text-white rounded-full shadow-md transform -rotate-12 group-hover:scale-110 transition-transform">
                        {maxDiscount ? (
                          <>
                            <span className="text-[8px] md:text-[9px] font-bold leading-none">UP TO</span>
                            <span className="text-[14px] md:text-[16px] font-black leading-none my-0.5">{maxDiscount}%</span>
                            <span className="text-[8px] md:text-[9px] font-bold leading-none">OFF</span>
                          </>
                        ) : (
                          <span className="text-[9px] md:text-[11px] font-black px-1 text-center uppercase leading-tight">SPECIAL OFFER</span>
                        )}
                      </div>

                      {/* IMAGE */}
                      <div className="relative h-[120px] md:h-[170px] w-full flex items-center justify-center bg-gray-50/50 p-2 pt-4 overflow-hidden">
                        <div className="w-full h-full relative transition-transform duration-500 group-hover:scale-105">
                          <CategoryImage
                            src={getImageSrc(cat.imageUrl)}
                            alt={cat.name}
                          />
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="px-3 md:px-4 pt-3 pb-4 flex flex-col items-center text-center w-full bg-white z-10 border-t border-gray-50">
                        <h3 className="text-xs md:text-sm font-bold text-[#445D41] leading-tight line-clamp-1 mb-1">
                          {cat.name}
                        </h3>

                        {adminComment && (
                          <p className="flex items-center justify-center gap-1 text-[10px] md:text-xs font-medium text-gray-600 line-clamp-1 mb-2.5">
                            <Tag className="w-3 h-3 text-[#445D41]/70" />
                            {adminComment}
                          </p>
                        )}
                        <span className="inline-flex items-center justify-center w-full gap-1.5 px-4 py-2 rounded-lg bg-[#2f6b3f] text-white text-[10px] md:text-xs font-bold uppercase tracking-wider group-hover:bg-[#245432] transition-colors shadow-sm">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Shop now
                        </span>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );


}
