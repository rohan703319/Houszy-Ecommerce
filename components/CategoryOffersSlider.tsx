//components\CategoryOffersSlider.tsx
"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

/* ================= TYPES ================= */
interface Discount {
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
}
const stripHtml = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
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

const offerCategories = categories.filter((c) => {
  if (!c.assignedDiscounts?.length) return false;

  const validDiscount = c.assignedDiscounts.find((d) =>
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
      <div className="mb-3 md:mb-6 text-center">
        <h2 className="text-xl md:text-4xl font-extrabold tracking-tight text-black">
          Big Festive Sale
        </h2>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-700">
          Save big on selected categories - limited time only
        </p>
      </div>
    </div>

    {/* ===== FESTIVE BACKGROUND STARTS HERE (FULL WIDTH) ===== */}
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#445D41] via-[#2f6b3f] to-black pt-4 pb-2">
      {/* STAR DUST / CONFETTI */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 3px, transparent 6px),
            radial-gradient(circle at 68% 22%, rgba(255,255,255,0.8) 2.5px, transparent 6px),
            radial-gradient(circle at 38% 72%, rgba(255,255,255,0.85) 3.5px, transparent 7px),
            radial-gradient(circle at 82% 58%, rgba(255,255,255,0.75) 2.8px, transparent 6px),
            radial-gradient(circle at 50% 40%, rgba(255,255,255,0.8) 2.2px, transparent 5px)
          `,
          backgroundSize: "160px 160px",
          opacity: 0.25,
        }}
      />

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


            const maxDiscount =
              percentageDiscounts.length > 0
                ? Math.max(...percentageDiscounts)
                : null;

            const offerText = maxDiscount
              ? `UP TO ${maxDiscount}% OFF`
              : "SPECIAL OFFER";

            return (
              <SwiperSlide key={cat.id}>
                <Link href={`/category/${cat.slug}?offer=true`}>
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
                    {/* OFFER BADGE */}
                    <div className="absolute top-2 left-2 z-10 flex items-center justify-center text-center w-[52px] h-[52px] md:w-[70px] md:h-[70px] bg-gradient-to-br from-red-500 to-red-700 text-white text-[9px] md:text-[10px] font-extrabold leading-tight rounded-full shadow-lg ring-2 ring-white/70">
                      <span className="px-1">{offerText}</span>
                    </div>

                    {/* IMAGE */}
                    <div className="h-[110px] md:h-[172px] flex items-center justify-center p-2 pt-4">
                      <img
                        src={getImageSrc(cat.imageUrl)}
                        alt={cat.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* CONTENT */}
                    <div className="px-1 md:px-4 pt-2 pb-3 flex flex-col items-center text-center">
                     <h3 className="text-xs md:text-sm font-bold text-[#445D41] leading-tight line-clamp-1">
  {cat.name}
</h3>

{adminComment && (
  <p className="text-xs md:text-sm font-semibold text-black line-clamp-2 mb-2">
    {adminComment}
  </p>
)}
                      <span className="block w-full text-center bg-[#2f6b3f] text-white text-xs md:text-sm font-semibold py-1.5 md:py-2.5 rounded-md hover:bg-[#245432] transition">
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
