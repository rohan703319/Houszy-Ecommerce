'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface BlogPost {
  id: string;
  title: string;
  bodyOverview: string;
  slug: string;
  publishedAt: string;
  thumbnailImageUrl?: string;
  featuredImageUrl?: string;
}

interface LatestBlogsProps {
  blogs: BlogPost[];
}

// Format date to "Apr 13, 2026"
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LatestBlogs({ blogs }: LatestBlogsProps) {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!blogs || blogs.length === 0) return null;

  return (
    <div className="w-full -mt-8">
      <h2 className="text-[15px] md:text-[22px] font-bold text-center mb-8 md:mb-10 text-black tracking-tight">
        Our Latest Blogs
      </h2>

      <div className="relative">
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={24}
          slidesPerView={1}
          loop={blogs.length > 3}
          watchOverflow={true}
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-4"
        >
          {blogs.map((blog, index) => {
            const imgSrc =
              blog.thumbnailImageUrl ||
              blog.featuredImageUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.title)}&background=f39a16&color=fff&size=600`;

            return (
              <SwiperSlide key={blog.id} className="h-auto">
                <article className="flex flex-col h-full bg-white">
                  {/* Image — clickable */}
                  <Link
                    href={`/blog/${blog.slug}`}
                    aria-label={`Read blog: ${blog.title}`}
                    className="block w-full aspect-[16/9] relative overflow-hidden bg-gray-100 rounded"
                  >
                    <img
                      src={imgSrc}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      width={600}
                      height={338}
                    />
                  </Link>

                  {/* Content */}
                  <div className="pt-4 flex flex-col flex-1">
                    <time
                      dateTime={blog.publishedAt}
                      className="text-[13px] text-gray-500 font-medium"
                    >
                      in {formatDate(blog.publishedAt)}
                    </time>
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className="text-[15px] md:text-base font-bold mt-2 leading-snug line-clamp-2 hover:text-[#f38918]">
                        {blog.title}
                      </h3>
                    </Link>
                    <p className="text-[14px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {blog.bodyOverview || 'Read the full article to learn more...'}
                    </p>

                    <div className="mt-2">
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="text-[15px] font-bold text-black hover:text-[#f39a16] transition-colors"
                        aria-label={`Read more about ${blog.title}`}
                      >
                        Read more
                      </Link>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-row items-center justify-center sm:justify-between mt-3 sm:mt-4 pt-1 sm:pt-2 gap-3 sm:gap-4 w-full">
        {/* Custom Navigation */}
        {blogs.length > 1 && (
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 rounded-md px-1 sm:px-2 py-1 shadow-sm border border-gray-100">
            <button
              onClick={() => swiperInstance?.slidePrev()}
              aria-label="Previous blog"
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white hover:shadow rounded text-gray-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1 sm:px-2">
              {blogs.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => swiperInstance?.slideToLoop(i)}
                  className={`rounded-full transition-all duration-300 ${i === activeIndex
                    ? 'w-4 h-2 bg-[#f39a16]'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                />
              ))}
            </div>

            <button
              onClick={() => swiperInstance?.slideNext()}
              aria-label="Next blog"
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white hover:shadow rounded text-gray-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View All Button */}
        <Link
          href="/blog"
          className="bg-[#f39a16] text-black font-bold px-4 py-1.5 sm:px-6 sm:py-2 rounded hover:bg-orange-500 transition-colors flex items-center gap-1 sm:gap-2 text-[12px] sm:text-[14px] whitespace-nowrap"
        >
          View All Blogs <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
