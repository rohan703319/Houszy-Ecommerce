// app/blog/page.tsx… working code hai search bar implement kr rha isliye isko alag save rkhta hu
export const dynamic = "force-dynamic";
import React from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.direct-care.co.uk"),

  title: "Health & Wellness Blog UK | Direct Care",
  description:
    "Explore expert health tips, medicine guides, and wellness advice from Direct Care UK.",

  alternates: {
    canonical: "https://www.direct-care.co.uk/blog",
  },

  openGraph: {
    title: "Direct Care Blog UK",
    description:
      "Health tips, medicine guides, and wellness advice.",
    url: "https://www.direct-care.co.uk/blog",
    locale: "en_GB",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};



const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.json();
}

function absoluteUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // ensure no double slash
  return `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function BlogPage() {
  const postsUrl = `${API_BASE}/api/BlogPosts?includeUnpublished=false&onlyHomePage=false`;
  const categoriesUrl = `${API_BASE}/api/BlogCategories?includeInactive=false&includeSubCategories=true`;

  const [postsResp, categoriesResp] = await Promise.all([
    fetchJSON(postsUrl),
    fetchJSON(categoriesUrl),
  ]);

  const posts = postsResp?.data ?? [];
  const categories = categoriesResp?.data ?? [];

  // server-side filtering using API fields
  const now = new Date();
  const visiblePosts = posts.filter((p: any) => {
    if (!p) return false;
    if (!p.isPublished) return false;
    if (p.startDate && new Date(p.startDate) > now) return false;
    if (p.endDate && new Date(p.endDate) < now) return false;
    return true;
  });

  // Sort: displayOrder asc -> publishedAt desc
  visiblePosts.sort((a: any, b: any) => {
 
    const oa = typeof a.displayOrder === "number" ? a.displayOrder : 9999;
    const ob = typeof b.displayOrder === "number" ? b.displayOrder : 9999;
    if (oa !== ob) return oa - ob;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
   const getPostCount = (catId: number) => {
  return visiblePosts.filter((p: any) => p.blogCategoryId === catId).length;
};
 return (
  <main className="min-h-screen bg-gray-100 pt-[0.5rem] pb-[2.5rem]">
    <h1 className="sr-only">
  Health & Wellness Blog UK - Direct Care
</h1>

    <div className="max-w-7xl mx-auto px-1 space-y-4">

      {/* ===================== CATEGORIES CARD ===================== */}
      <section className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border ">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">Explore Blogs by Categories</h2>

        <div
          className="
            grid 
            grid-cols-2 
            sm:grid-cols-3 
            md:grid-cols-4 
            lg:grid-cols-6 
            xl:grid-cols-8 
            gap-4
          "
        >
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/blog/category/${cat.slug}`}
              className="
                group bg-gray-50 border 
                p-3 rounded-xl 
                hover:bg-white 
                hover:shadow-md 
                transition 
                flex items-center gap-3
              "
            >
              {/* ICON */}
              <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                <img
                  src={absoluteUrl(cat.imageUrl) ?? '/placeholder-category.png'}
                 alt={`${cat.name} blog category`}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>

              {/* TEXT */}
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold text-gray-900 leading-snug break-words group-hover:text-green-900">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-gray-500">
                 {getPostCount(cat.id)} posts
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== LATEST ARTICLES CARD ===================== */}
      <section className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-900">
          Latest Articles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

         {visiblePosts.map((post: any) => (
  <Link
    key={post.id}
    href={`/blog/${post.slug}`}
    className="block"
  >
    <article
      className="bg-gray-50 border rounded-xl shadow-sm hover:shadow-lg transition p-3 flex flex-col h-full hover:-translate-y-1 cursor-pointer"
    >
              {/* IMAGE */}
          <div className="w-full h-28 bg-white rounded-lg overflow-hidden mb-1 flex items-start justify-center pt-0">
  <img
    src={
      absoluteUrl(post.thumbnailImageUrl) ??
      absoluteUrl(post.featuredImageUrl) ??
      '/placeholder-article.png'
    }
    alt={post.title}
    className="w-full h-full object-contain"
  />
</div>


              {/* CATEGORY LABEL */}
              <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded w-fit mb-3">
                {post.blogCategoryName}
              </span>

              {/* TITLE */}
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1 line-clamp-2 leading-snug hover:text-green-900">
  {post.title}
</h3>
              {/* OVERVIEW */}
              <p className="text-[13px] text-gray-600 line-clamp-2 mb-3">
                {post.bodyOverview}
              </p>

              {/* FOOTER META */}
              <div className="mt-auto flex justify-between text-sm text-gray-500">
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                <span className="text-xs">Views: {post.viewCount ?? 0}</span>
              </div>

              {/* LABELS */}
             {/* LABELS (with icons + priority) */}
{post.labels?.length > 0 && (
  <div className="mt-3 flex gap-2 flex-wrap">

    {[...post.labels]
      .sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((l: any) => {

        // Auto icon loader from lucide-react
        const IconComponent =
          (LucideIcons as any)[l.icon] ?? LucideIcons.Sparkles;

        return (
          <span
            key={l.name}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium shadow-sm"
            style={{
              background: l.color || "#ddd",
              color: "#fff",
            }}
          >
            <IconComponent className="h-3 w-3" />
            {l.name}
          </span>
        );
      })}
  </div>
)}

          </article>
</Link>
          ))}

        </div>
      </section>
    </div>
    <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Direct Care Blog",
      url: "https://www.direct-care.co.uk/blog",
      description:
        "Health tips, medicine guides, and wellness articles from Direct Care UK.",
    }),
  }}
/>
  </main>
);


}
