"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  showOnHomepage?: boolean;
}

interface TopBrandsSliderProps {
  brands: Brand[];
  baseUrl: string;
}

export default function TopBrandsSlider({
  brands,
  baseUrl,
}: TopBrandsSliderProps) {
  /**
   * 🔥 PERFORMANCE CRITICAL
   * - Filter once
   * - Prevent unnecessary Swiper re-renders
   */
  const homepageBrands = useMemo(
    () => brands.filter((b) => b.showOnHomepage === true),
    [brands]
  );

  /**
   * 🛡️ SAFETY GUARD
   * - If no brands to show → don't mount Swiper
   */
  if (homepageBrands.length === 0) {
    return null;
  }
  return (
    <div className="relative">

      {/* Arrows */}
      <button
        id="brandPrev"
        className="hidden md:block absolute left-[-15px] top-[40%] -translate-y-1/2 z-30 bg-white p-2 md:p-3 shadow-md rounded-full border hover:bg-gray-100"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        id="brandNext"
        className="hidden md:block absolute right-[-15px] top-[40%] -translate-y-1/2 z-30 bg-white p-2 md:p-3 shadow-md rounded-full border hover:bg-gray-100"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 5 },
        }}
        autoplay={{ delay: 2200, disableOnInteraction: false, pauseOnMouseEnter: true, }}
        navigation={{ prevEl: "#brandPrev", nextEl: "#brandNext" }}
        pagination={{ clickable: true, dynamicBullets: true }}
        loop={true}
        className="pb-12"
      >
        {brands.map((brand: Brand) => (
          <SwiperSlide key={brand.id}>
          <Link href={`/brands/${brand.slug}`}>

<Card
  className="group w-full h-[130px] md:h-[150px] lg:h-[170px]
             bg-white rounded-xl border border-gray-200
             flex items-center justify-center
             transition-all duration-300
             hover:shadow-md hover:-translate-y-1"
>
  <CardContent className="p-0 flex items-center justify-center w-full h-full">

    <div className="w-full h-full flex items-center justify-center px-2">
      <img
        src={
          brand.logoUrl
            ? brand.logoUrl.startsWith("http")
              ? brand.logoUrl
              : `${baseUrl}${brand.logoUrl}`
            : "/placeholder.jpg"
        }
        alt={brand.name}
        className="max-h-[75%] w-auto object-contain
                   transition-transform duration-300
                   md:group-hover:scale-105"
      />
    </div>

  </CardContent>
</Card>


            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
