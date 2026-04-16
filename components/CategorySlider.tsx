"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="relative">
      {/* ===== ARROWS ===== */}
      <button
        id="catPrev"
        className="hidden md:block absolute left-[-15px] top-[40%] -translate-y-1/2 z-30
                   bg-white p-2 md:p-3 shadow-md rounded-full border"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        id="catNext"
        className="hidden md:block absolute right-[-15px] top-[40%] -translate-y-1/2 z-30
                   bg-white p-2 md:p-3 shadow-md rounded-full border"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* ===== SLIDER ===== */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
          1280: { slidesPerView: 5 },
        }}
        autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{
          prevEl: "#catPrev",
          nextEl: "#catNext",
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        loop
        className="pb-12"
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id}>
            <Link href={`/category/${category.slug}`}>
              <Card
                className="w-full h-[160px] md:h-[200px] lg:h-[230px] bg-white rounded-2xl
                           shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                           hover:shadow-[0_6px_25px_rgba(0,0,0,0.12)]
                           transition-all duration-300
                           flex flex-col items-center justify-between py-3 md:py-6"
              >
                <CardContent className="p-0 w-full flex flex-col items-center justify-between h-full">
                  {/* ===== IMAGE ===== */}
                  <div
                    className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
                               flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={getImageSrc(category.imageUrl)}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-auto object-contain"
                      style={{ objectPosition: "center" }}
                    />
                  </div>

                  {/* ===== TITLE ===== */}
                  <h3 className="font-semibold text-gray-900 text-xs md:text-sm text-center pb-1 md:pb-2 px-1 line-clamp-2">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
