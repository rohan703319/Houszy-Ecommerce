"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import RelatedProductCard from "@/components/product/RelatedProductCard";
import { getRecentlyViewed } from "@/app/hooks/useRecentlyViewed";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function RecentlyViewedSlider({
  getImageUrl,
  currentProductId,
}: {
  getImageUrl: any;
  currentProductId: string;
}) {
  const [products, setProducts] = useState<any[]>([]);
const shouldShowNavigation = products.length > 5;
  useEffect(() => {
    if (!currentProductId) return;

    const ids = getRecentlyViewed().filter((id) => id !== currentProductId);
    if (!ids.length) return;

    Promise.all(
      ids.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Products/${id}`, {
          cache: "no-store",
        }).then((res) => res.json())
      )
    ).then((res) => {
      const valid = res.filter((r) => r.success).map((r) => r.data);
      setProducts(valid);
    });
  }, [currentProductId]);

  if (!products.length) return null;

  return (
    <section className="mt-10 relative">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-5">
        Recently Viewed Products
      </h2>
{shouldShowNavigation && (
  <>
    <button
      id="recent-prev"
      className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20"
    >
      <ChevronLeft className="w-7 h-7 text-gray-700" />
    </button>

    <button
      id="recent-next"
      className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20"
    >
      <ChevronRight className="w-7 h-7 text-gray-700" />
    </button>
  </>
)}
     <Swiper
  modules={[Autoplay, Pagination, Navigation]}
  navigation={
  shouldShowNavigation
    ? { prevEl: "#recent-prev", nextEl: "#recent-next" }
    : false
}
  pagination={{ clickable: true, dynamicBullets: true }}
  autoplay={{ delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true }}
  loop
  spaceBetween={12}
  slidesPerView={2}
  breakpoints={{
    640:  { slidesPerView: 2, spaceBetween: 12 },
    768:  { slidesPerView: 3, spaceBetween: 16 },
    1024: { slidesPerView: 4, spaceBetween: 20 },
    1280: { slidesPerView: 5, spaceBetween: 22 },
  }}
  className="pb-10 px-1"
>
        {products.map((p) => (
          <SwiperSlide key={p.id}>
            <RelatedProductCard product={p} getImageUrl={getImageUrl} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
