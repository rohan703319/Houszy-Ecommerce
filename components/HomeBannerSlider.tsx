"use client";

import { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";

interface HomeBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  link?: string;
  title?: string;
}

interface HomeBannerSliderProps {
  banners: HomeBanner[];
  baseUrl: string;
}

export default function HomeBannerSlider({
  banners,
  baseUrl,
}: HomeBannerSliderProps) {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  if (!banners || banners.length === 0) return null;

  const enableLoop = banners.length > 2;
  const enableAutoplay = banners.length > 1;

  return (
    <div className="relative w-full group">
      <Swiper
        onSwiper={setSwiperInstance}
        modules={[Autoplay]}
        slidesPerView={1}
        loop={enableLoop}
        autoplay={
          enableAutoplay
            ? {
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
            : false
        }
        className="w-full"
      >
        {banners.map((banner) => {
          // If imageUrl is relative (starts with /), use it directly — Next.js rewrites will proxy it
          // If absolute (starts with http), use as-is
          const desktopSrc = banner.imageUrl?.startsWith("http")
            ? banner.imageUrl
            : banner.imageUrl; // relative path, e.g. /images/banners/x.jpg → proxied by next.config rewrites
          const mobileSrc = banner.mobileImageUrl
            ? banner.mobileImageUrl  // also relative, proxied the same way
            : null;

          const pictureEl = (
            <picture className="block w-full">
              {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
              <img
                src={desktopSrc}
                alt={banner.title || "Banner"}
                className="w-full h-auto object-cover md:object-contain"
              />
            </picture>
          );

          return (
            <SwiperSlide key={banner.id}>
              {banner.link ? (
                <Link href={banner.link} className="block w-full cursor-pointer">
                  {pictureEl}
                </Link>
              ) : (
                <div className="block w-full">{pictureEl}</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Left Arrow Button */}
      {enableAutoplay && (
        <button
          onClick={() => swiperInstance?.slidePrev()}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 active:scale-95 transition-all focus:outline-none"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Right Arrow Button */}
      {enableAutoplay && (
        <button
          onClick={() => swiperInstance?.slideNext()}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 active:scale-95 transition-all focus:outline-none"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}
