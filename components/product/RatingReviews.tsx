"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/toast/CustomToast";
import { timeFromNow } from "@/lib/date";
import Image from "next/image";
import { Filter, ChevronDown, CheckCircle2, UploadCloud, MessageSquare, MessageSquarePlus, Edit3, ChevronLeft, ChevronRight } from "lucide-react";

// 🔹 SWIPER
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

interface RatingReviewsProps {
  productId: string;
  allowCustomerReviews: boolean;
  highlightReviewId?: string | null; // 🔥 ADD
}

interface ReviewReply {
  id: string;
  reviewId: string;
  comment: string;
  isAdminReply: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  title: string;
  comment: string;
  rating: number;
  isApproved: boolean; // 🔥 ADD THIS
  isVerifiedPurchase: boolean;

  createdAt: string;
  replies: ReviewReply[];
  imageUrls?: string[];
  videoUrls?: string[];

}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function RatingReviews({ productId, allowCustomerReviews, highlightReviewId }: RatingReviewsProps) {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const recentReviews = useMemo(() => {
    return reviews
      .filter((r) => r.isApproved === true) // 🔥 ADD
      .filter((r) => r.comment?.trim().length > 0)
      .slice(0, 3);
  }, [reviews]);


  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState({
    title: "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  // file selection
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [activeMedia, setActiveMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);

  // uploaded urls
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  // upload loading
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);

    if (selected.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setImageFiles(selected);
  };

  const handleVideoSelect = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);

    if (selected.length > 1) {
      toast.error("Only 1 video allowed");
      return;
    }

    setVideoFiles(selected);
  };
  const uploadReviewImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    try {
      setUploadingImages(true);

      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("images", file));

      const res = await fetch(
        `${API_BASE_URL}/api/ProductReviews/upload-images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Image upload failed");
      }

      setImageUrls(json.data);
      return json.data;
    } finally {
      setUploadingImages(false);
    }
  };
  const uploadReviewVideos = async (): Promise<string[]> => {
    if (videoFiles.length === 0) return [];

    try {
      setUploadingVideos(true);

      const formData = new FormData();
      videoFiles.forEach((file) => formData.append("videos", file));

      const res = await fetch(
        `${API_BASE_URL}/api/ProductReviews/upload-videos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Video upload failed");
      }

      setVideoUrls(json.data);
      return json.data;
    } finally {
      setUploadingVideos(false);
    }
  };
  const imagePreviews = useMemo(
    () => imageFiles.map((file) => URL.createObjectURL(file)),
    [imageFiles]
  );

  const videoPreviews = useMemo(
    () => videoFiles.map((file) => URL.createObjectURL(file)),
    [videoFiles]
  );
  useEffect(() => {
    const raw = sessionStorage.getItem("pendingReviewDraft");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      // 🔒 safety: wrong product ka draft ignore
      if (data.productId !== productId) return;

      setRating(data.rating ?? 0);
      setTitle(data.title ?? "");
      setComment(data.comment ?? "");

      // cleanup so it doesn't re-apply
      sessionStorage.removeItem("pendingReviewDraft");

      // auto scroll to review form
      setTimeout(() => {
        const el = document.getElementById("reviews-section");
        el?.scrollIntoView({ behavior: "instant" });
      }, 300);
    } catch {
      sessionStorage.removeItem("pendingReviewDraft");
    }
  }, [productId]);

  // cleanup (IMPORTANT)
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      videoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews, videoPreviews]);

  // Filter UI states
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "high" | "low">("recent");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const { isAuthenticated, accessToken } = useAuth();
  const toast = useToast();
  const validateField = (field: "title" | "comment", value: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]:
        value.trim().length < 5
          ? `${field === "title" ? "Title" : "Comment"} must be at least 5 characters`
          : "",
    }));
  };
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ProductReviews/product/${productId}`, {
        next: { revalidate: 60 },
      });

      const json = await res.json();
      setReviews(json?.data ?? []);
    } catch (err) {
      console.log("Fetch reviews error:", err);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async () => {

    if (!isAuthenticated) {
      // 🔥 SAVE TEXT-ONLY DRAFT
      sessionStorage.setItem(
        "pendingReviewDraft",
        JSON.stringify({
          productId,
          productSlug: window.location.pathname.split("/product/")[1],
          rating,
          title,
          comment,
        })
      );

      toast.info("Please login to submit your review");

      // 🔁 redirect to login with return hint
      window.location.href = `/account?from=review&productId=${productId}`;
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ upload media first
      const [uploadedImages, uploadedVideos] = await Promise.all([
        uploadReviewImages(),
        uploadReviewVideos(),
      ]);

      // 2️⃣ submit review
      const res = await fetch(
        `${API_BASE_URL}/api/ProductReviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId,
            title,
            comment,
            rating,
            imageUrls: uploadedImages,
            videoUrls: uploadedVideos,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.message || "Failed to submit review");
        return;
      }

      toast.success("Review submitted! Pending admin approval.");

      // reset
      setRating(0);
      setTitle("");
      setComment("");
      sessionStorage.removeItem("pendingReviewDraft");

      setImageFiles([]);
      setVideoFiles([]);
      setImageUrls([]);
      setVideoUrls([]);

      fetchReviews();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const resolveMediaUrl = useCallback((url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return `${base}${url}`.replace(/([^:]\/)\/+/g, "$1");
  }, []);

  // FILTERED DATA (no logic changed, only UI view manipulation)
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => r.isApproved === true) // 🔥 ONLY APPROVED
      .filter((r) => r.rating > 0 && r.comment.trim().length > 0)
      .filter((r) => (filterRating ? r.rating === filterRating : true))
      .filter((r) => (showVerifiedOnly ? r.isVerifiedPurchase : true))
      .sort((a, b) => {
        if (sortBy === "recent")
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "high") return b.rating - a.rating;
        return a.rating - b.rating;
      });
  }, [reviews, filterRating, sortBy, showVerifiedOnly]);

  useEffect(() => {
    if (!highlightReviewId) return;

    // 1️⃣ Scroll Swiper to the correct slide
    if (swiperInstance) {
      const index = filteredReviews.findIndex((r) => r.id === highlightReviewId);
      if (index !== -1) {
        swiperInstance.slideTo(index);
      }
    }
    // 2️⃣ Scroll page to the element
    const el = document.getElementById(`review-${highlightReviewId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    el.classList.add(
      "ring-2",
      "ring-[#445D41]",
      "bg-green-50"
    );

    const timeout = setTimeout(() => {
      el.classList.remove(
        "ring-2",
        "ring-[#445D41]",
        "bg-green-50"
      );
    }, 2500);

    return () => clearTimeout(timeout);
  }, [highlightReviewId, swiperInstance, filteredReviews]);

  return (
    <>
      <section id="reviews-section" className="mt-6 md:mt-10 bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 overflow-x-hidden w-full">
        <h2 className="text-lg md:text-2xl font-bold mb-3 text-gray-900">Ratings & Reviews</h2>
        {/* FILTER PANEL */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 md:gap-3 mb-4 p-3 bg-gray-50 rounded-lg border w-full overflow-x-hidden">
          <div className="flex items-center gap-1.5 font-semibold text-gray-700 text-sm">
            <Filter className="h-4 w-4" /> Filter
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setFilterRating(filterRating === s ? null : s)}
                className={`px-2 py-1 rounded-md border text-xs font-medium transition ${filterRating === s ? "bg-[#445D41] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {s} ★
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-md px-2 py-1 text-xs bg-white"
          >
            <option value="recent">Most Recent</option>
            <option value="high">Highest Rated</option>
            <option value="low">Lowest Rated</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={showVerifiedOnly}
              onChange={() => setShowVerifiedOnly(!showVerifiedOnly)}
            />
            Verified only
          </label>
        </div>

        {/* WRITE REVIEW FORM */}
        {allowCustomerReviews && (
          <div className="mb-6 p-4 md:p-5 border rounded-xl bg-gray-50 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-base mb-4 text-gray-900">
              Write a Review
              <Edit3 className="w-4 h-4 text-black" />
            </h3>

            {/* RATING */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`cursor-pointer text-2xl transition-transform duration-150 ${rating >= s ? "text-yellow-500 scale-110" : "text-gray-300"
                        }`}
                      onClick={() => setRating(s)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {rating === 0 && <p className="text-xs text-gray-500">Please select a rating</p>}
            </div>

            {/* TITLE */}
            <input
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                setTitle(value);
                validateField("title", value);
              }}
              placeholder="Review title*"
              className="w-full border rounded-lg p-2.5 text-sm mb-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#445D41]/40"
            />
            {errors.title && <p className="text-xs text-red-500 mb-2">{errors.title}</p>}

            {/* COMMENT */}
            <textarea
              value={comment}
              onChange={(e) => {
                const value = e.target.value;
                setComment(value);
                validateField("comment", value);
              }}
              rows={3}
              placeholder="Share your experience..."
              className="w-full border rounded-lg p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#445D41]/40"
            />
            {errors.comment && <p className="text-xs text-red-500 mt-1">{errors.comment}</p>}

            {/* IMAGE UPLOAD */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Upload Images (optional)</p>
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#445D41] hover:bg-white transition text-sm">
                <UploadCloud className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Add Images</span>
                <span className="text-gray-400 text-xs">Click to upload review images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>

            {/* IMAGE PREVIEW */}
            {imagePreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={`preview-image-${i}`} className="relative w-[90px] h-[90px]">
                    <div className="w-[90px] h-[90px] overflow-hidden rounded-lg border bg-gray-50">
                      <img src={src} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* VIDEO */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Upload Video (optional)</p>
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#445D41] hover:bg-white transition text-sm">
                <UploadCloud className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Upload Review Video</span>
                <span className="text-gray-400 text-xs">Click to upload review video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>

            {/* VIDEO PREVIEW */}
            {videoPreviews.length > 0 && (
              <div className="mt-3">
                {videoPreviews.map((src, i) => (
                  <div key={`preview-video-${i}`} className="relative w-32 sm:w-36">
                    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
                      <video src={src} muted preload="metadata" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoFiles([])}
                      className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0 || comment.trim().length < 5 || loading}
              className="mt-4 w-full bg-[#445D41] hover:bg-black text-white rounded-xl py-2.5 font-medium text-sm transition"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        )}

        {/* REVIEWS LIST - SWIPER UI */}
        <h3 className="text-base md:text-lg font-bold mb-4 text-gray-900 px-1">Customer Reviews</h3>

        {filteredReviews.length === 0 ? (
          <p className="text-gray-500 italic text-sm px-1">No reviews matching filters.</p>
        ) : (
          <div className="relative group px-4 md:px-10">
            <button
              id="prev-btn"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border bg-white shadow-md hover:bg-gray-50 transition cursor-pointer disabled:opacity-0 hidden md:flex items-center justify-center border-gray-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              id="next-btn"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border bg-white shadow-md hover:bg-gray-50 transition cursor-pointer disabled:opacity-0 hidden md:flex items-center justify-center border-gray-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>

            <Swiper
              onSwiper={setSwiperInstance}
              modules={[Navigation, FreeMode]}
              navigation={{
                prevEl: '#prev-btn',
                nextEl: '#next-btn',
              }}
              spaceBetween={12}
              slidesPerView={1}
              slidesPerGroup={1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 16 },
                1024: { slidesPerView: 3, spaceBetween: 16 },
                1280: { slidesPerView: 4, spaceBetween: 16 },
              }}
              className="!pb-10 h-full"
            >
              {filteredReviews.map((r) => (
                <SwiperSlide key={r.id} className="!h-auto">
                  <div
                    id={`review-${r.id}`}
                    className="h-full p-4 md:p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-[#445D41]/10 flex-shrink-0 flex items-center justify-center text-[#445D41] font-bold text-[10px] uppercase">
                            {r.customerName.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {r.customerName}
                          </span>
                        </div>
                        {r.isVerifiedPurchase && (
                          <span className="flex-shrink-0 flex items-center gap-1 text-[8px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                            <CheckCircle2 className="h-2 w-2" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 text-yellow-500 text-lg mb-1">
                        {"★".repeat(r.rating)}
                        <span className="text-gray-200">{"★".repeat(5 - r.rating)}</span>
                      </div>

                      <h4 className="font-extrabold text-sm text-gray-900 mb-1 line-clamp-1">{r.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{r.comment}</p>

                      {/* Media Section - Optimized for Performance */}
                      {((r.imageUrls?.length ?? 0) > 0 || (r.videoUrls?.length ?? 0) > 0) && (
                        <div className="mt-3 -mx-1">
                          {(r.imageUrls?.length ?? 0) + (r.videoUrls?.length ?? 0) <= 3 ? (
                            // 🚀 Grid Layout for 1-3 items (Ensures they fit without cutting)
                            <div className="grid grid-cols-3 gap-1 px-1">
                              {r.imageUrls?.map((url, i) => (
                                <div
                                  key={`${r.id}-img-${i}`}
                                  onClick={() => setActiveMedia({ type: "image", url: resolveMediaUrl(url) })}
                                  className="w-full aspect-square rounded-lg border border-gray-100 overflow-hidden cursor-pointer bg-gray-50 flex items-center justify-center transition-transform md:hover:scale-105"
                                >
                                  <Image
                                    src={resolveMediaUrl(url)}
                                    alt="Review"
                                    width={100}
                                    height={100}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                              {r.videoUrls?.map((url, i) => (
                                <div
                                  key={`${r.id}-vid-${i}`}
                                  onClick={() => setActiveMedia({ type: "video", url: resolveMediaUrl(url) })}
                                  className="w-full aspect-square rounded-lg border bg-black relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                                >
                                  <span className="text-white text-xs">▶</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // 🎡 Swiper only for 4+ items
                            <Swiper
                              nested={true}
                              slidesPerView={3}
                              spaceBetween={5}
                              freeMode={true}
                              modules={[FreeMode]}
                              className="px-1 w-full"
                            >
                              {r.imageUrls?.map((url, i) => (
                                <SwiperSlide key={`${r.id}-img-${i}`}>
                                  <div
                                    onClick={() => setActiveMedia({ type: "image", url: resolveMediaUrl(url) })}
                                    className="w-full aspect-square rounded-lg border border-gray-100 overflow-hidden cursor-grab active:cursor-grabbing bg-gray-50 flex items-center justify-center transition-transform md:hover:scale-105"
                                  >
                                    <Image
                                      src={resolveMediaUrl(url)}
                                      alt="Review"
                                      width={100}
                                      height={100}
                                      className="w-full h-full object-cover pointer-events-none"
                                      loading="lazy"
                                    />
                                  </div>
                                </SwiperSlide>
                              ))}
                              {r.videoUrls?.map((url, i) => (
                                <SwiperSlide key={`${r.id}-vid-${i}`}>
                                  <div
                                    onClick={() => setActiveMedia({ type: "video", url: resolveMediaUrl(url) })}
                                    className="w-full aspect-square rounded-lg border bg-black relative flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform md:hover:scale-105"
                                  >
                                    <span className="text-white text-xs pointer-events-none">▶</span>
                                  </div>
                                </SwiperSlide>
                              ))}
                            </Swiper>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <p className="text-[10px] font-medium text-gray-400">{timeFromNow(r.createdAt)}</p>
                      {r.replies && r.replies.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#445D41] uppercase">
                          <MessageSquare className="w-3 h-3" /> {r.replies.length} Reply
                        </div>
                      )}
                    </div>

                    {r.replies && r.replies.length > 0 && (
                      <div className="mt-3">
                        {r.replies.slice(0, 1).map((reply) => (
                          <div key={reply.id} className="bg-gray-50 rounded-xl p-2.5 text-[11px] border border-gray-100">
                            <p className="text-gray-700 line-clamp-2"><span className="font-bold text-[#445D41]">Response:</span> {reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>

      {/* MEDIA MODAL */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setActiveMedia(null)}>
          <div className="relative max-w-4xl w-full bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveMedia(null)} className="absolute top-3 right-3 z-10 bg-black/70 text-white rounded-full h-8 w-8 flex items-center justify-center">✕</button>
            {activeMedia.type === "image" ? (
              <img src={activeMedia.url} alt="Full" className="w-full max-h-[80vh] object-contain" />
            ) : (
              <video src={activeMedia.url} controls autoPlay className="w-full max-h-[80vh]" />
            )}
          </div>
        </div>
      )}
    </>
  );
}


// 🔹 PDP tooltip ke liye reusable helper
export function getRecentApprovedReviews(reviews: Review[]) {
  return reviews
    .filter((r) => r.isApproved === true)
    .filter((r) => r.comment?.trim().length > 0)
    .slice(0, 3);
}

