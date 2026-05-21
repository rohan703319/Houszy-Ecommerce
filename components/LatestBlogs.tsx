'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

interface BlogPost {
  id: string;
  title: string;
  bodyOverview: string;
  slug: string;
  publishedAt: string;
  thumbnailImageUrl?: string;
  featuredImageUrl?: string;
}

export default function LatestBlogs() {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://testapi.knowledgemarkg.com/api/BlogPosts');

        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }

        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          // Filter out unpublished or inactive if needed, and take the first 7
          setBlogs(json.data.slice(0, 7));
        } else {
          throw new Error(json.message || 'Invalid API response format');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching blogs.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Format date to "Apr 13, 2026"
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full py-10 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f39a16]"></div>
        <p className="text-gray-500 mt-4 text-sm font-medium">Loading latest blogs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-10 flex flex-col items-center justify-center">
        <p className="text-red-500 font-medium">Failed to load blogs</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  if (blogs.length === 0) {
    return null; // Don't show the section if there are no blogs
  }

  return (
    <div className="w-full">
      <h2 className="text-[15px] md:text-[22px] font-bold text-center mb-8 md:mb-12">
        Our Latest Blogs
      </h2>

      <div className="relative">
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          onSwiper={setSwiperInstance}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="pb-4"
        >
          {blogs.map((blog) => (
            <SwiperSlide key={blog.id} className="h-auto">
              <div className="flex flex-col h-full bg-white group cursor-pointer">
                {/* Image */}
                <div className="w-full aspect-[16/10] relative overflow-hidden bg-gray-100 rounded-sm">
                  {/* Fallback to placeholder if image is missing */}
                  <img
                    src={blog.thumbnailImageUrl || blog.featuredImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.title)}&background=random&size=600`}
                    alt={blog.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="pt-4 flex flex-col flex-1">
                  <span className="text-[13px] text-gray-500 font-medium">in {formatDate(blog.publishedAt)}</span>
                  <Link href={`/blog/${blog.slug}`}>
                    <h3 className="text-[16px] md:text-[18px] font-bold mt-2 leading-snug group-hover:text-[#f39a16] transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                  </Link>
                  <p className="text-[14px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {blog.bodyOverview || 'Read the full article to learn more...'}
                  </p>

                  <div className="mt-4 mt-auto">
                    <Link href={`/blog/${blog.slug}`} className="text-[15px] font-bold text-black hover:text-[#f39a16] transition-colors">
                      Read more
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-4 gap-4">
        {/* Custom Pagination / Navigation */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1 shadow-sm border border-gray-100">
          <button
            onClick={() => swiperInstance?.slidePrev()}
            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow rounded text-gray-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span className="w-2 h-2 rounded-full bg-[#f39a16]"></span>
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
          </div>

          <button
            onClick={() => swiperInstance?.slideNext()}
            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow rounded text-gray-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Read More Button */}
        <Link href="/blog" className="bg-[#f39a16] text-black font-bold px-6 py-2.5 rounded hover:bg-orange-500 transition-colors flex items-center gap-2 text-[15px]">
          Read More <span>→</span>
        </Link>
      </div>
    </div>
  );
}
