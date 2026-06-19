"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;

}

export default function CategorySlider({
  categories,
  baseUrl,
}: {
  categories: Category[];
  baseUrl: string;
}) {
  /* 🔐 SAFE IMAGE RESOLVER */
  const getImageSrc = (imageUrl?: string | null) => {
    if (!imageUrl) return "/placeholder-category.png";
    return imageUrl.startsWith("http")
      ? imageUrl
      : `${baseUrl}${imageUrl}`;
  };

  const showNavigation = categories.length > 4;

  return (
    <div className="relative">
      {/* ===== ARROWS ===== */}
      {showNavigation && (
        <>
          <button
            id="catPrev"
            className="hidden md:block absolute left-[-35px] top-[50%] -translate-y-1/2 z-30
                       bg-white p-2 md:p-3 shadow-md rounded-full border"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
          </button>

          <button
            id="catNext"
            className="hidden md:block absolute right-[-35px] top-[50%] -translate-y-1/2 z-30
                       bg-white p-2 md:p-3 shadow-md rounded-full border"
          >
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </>
      )}

      {/* ===== SLIDER ===== */}
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={
          showNavigation
            ? {
                prevEl: "#catPrev",
                nextEl: "#catNext",
              }
            : false
        }
        loop={categories.length > 2}
        className="category-slider"
      >
        {categories.map((category) => {
          const imageSrc = category.imageUrl
            ? `${baseUrl}${category.imageUrl}`
            : "/images/placeholder.jpg";

          return (
            <SwiperSlide key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="group relative block overflow-hidden rounded-[24px] transition-all duration-300 md:hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
              >
                {/* IMAGE */}
                <div className="relative h-[240px] sm:h-[280px] md:h-[380px] w-full overflow-hidden rounded-[24px]">
                  <Image
                    src={imageSrc}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain object-center"
                  />
                </div>

                {/* BUTTON */}
                <div className="absolute bottom-6 md:bottom-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="bg-[#f39a16] text-black font-bold uppercase tracking-wider text-[11px] md:text-[14px] h-[30px] md:h-[40px] min-w-[115px] md:min-w-[160px] px-4 md:px-5 rounded inline-flex items-center justify-center shadow-sm transition-all duration-300 group-hover:bg-black group-hover:text-white whitespace-nowrap">
                    {category.name}
                  </span>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
