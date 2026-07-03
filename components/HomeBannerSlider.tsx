"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
          const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, '') : '';
          const desktopSrc = banner.imageUrl?.startsWith("http")
            ? banner.imageUrl
            : `${cleanBaseUrl}${banner.imageUrl?.startsWith('/') ? '' : '/'}${banner.imageUrl}`;
          const mobileSrc = banner.mobileImageUrl?.startsWith("http")
            ? banner.mobileImageUrl
            : banner.mobileImageUrl ? `${cleanBaseUrl}${banner.mobileImageUrl.startsWith('/') ? '' : '/'}${banner.mobileImageUrl}` : null;

          const pictureEl = (
            <>
              {mobileSrc && (
                <Image
                  src={mobileSrc}
                  alt={banner.title || "Banner"}
                  width={800}
                  height={800}
                  priority={true}
                  unoptimized={true}
                  className="w-full h-auto object-contain md:hidden"
                />
              )}
              <Image
                src={desktopSrc}
                alt={banner.title || "Banner"}
                width={1920}
                height={800}
                priority={true}
                unoptimized={true}
                className={`w-full h-auto object-contain ${mobileSrc ? "hidden md:block" : "block"}`}
              />
            </>
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
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 active:scale-95 transition-all focus:outline-none"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
        </button>
      )}

      {/* Right Arrow Button */}
      {enableAutoplay && (
        <button
          onClick={() => swiperInstance?.slideNext()}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 active:scale-95 transition-all focus:outline-none"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}
