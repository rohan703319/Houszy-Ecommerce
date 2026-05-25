// app/blog/page.tsx… working code hai search bar implement kr rha isliye isko alag save rkhta hu
export const revalidate = 3600;
import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://houszy.co.uk"),

  title: "Health & Wellness Blog UK | Houszy",
  description:
    "Explore expert health tips, medicine guides, and wellness advice from Houszy UK.",

  alternates: {
    canonical: "https://houszy.co.uk/blog",
  },

  openGraph: {
    title: "Houszy Blog UK",
    description:
      "Health tips, medicine guides, and wellness advice.",
    url: "https://houszy.co.uk/blog",
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
  const res = await fetch(url, { next: { revalidate: 3600 } });

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
  const getPostCount = (catId: string) => {
    return visiblePosts.filter((p: any) => {
      if (p.categories && Array.isArray(p.categories)) {
        return p.categories.some((c: any) => c.categoryId === catId);
      }
      return p.blogCategoryId === catId;
    }).length;
  };
  return (
    <main className="min-h-screen bg-white pt-4 pb-16">
      <div className="max-w-8xl mx-auto px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-800 transition-colors">Home</Link>
          <span>&gt;</span>
          <span className="text-gray-800 font-medium">Blog</span>
        </nav>

        {/* Categories Horizontal Menu */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <Link href="/blog" className="px-5 py-2 rounded bg-black text-white text-sm font-semibold transition-colors shadow-sm">
            Home
          </Link>
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/blog/category/${cat.slug}`} className="px-5 py-2 rounded bg-gray-100 text-gray-700 hover:bg-[#f38918] hover:text-white text-sm font-medium transition-colors border border-gray-200 hover:border-[#f38918] shadow-sm">
              {cat.name}
            </Link>
          ))}
        </div>

        {/* CATEGORY BASED BLOG ROWS */}
        {categories.map((cat: any) => {
          // get posts for this category
          const catPosts = visiblePosts.filter((p: any) => {
            if (p.categories && Array.isArray(p.categories)) {
              return p.categories.some((c: any) => c.categoryId === cat.id);
            }
            return p.blogCategoryId === cat.id;
          });

          if (catPosts.length === 0) return null;

          return (
            <div key={cat.id} className="mb-16">
              {/* Category Title */}
              <h2 className="text-4xl font-black text-black mb-8">{cat.name}</h2>

              {/* Posts Grid for Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {catPosts.slice(0, 3).map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col">
                    <article className="flex flex-col h-full">
                      {/* IMAGE */}
                      <div className="w-full aspect-[16/10] bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100 relative">
                        <Image
                          src={
                            absoluteUrl(post.thumbnailImageUrl) ??
                            absoluteUrl(post.featuredImageUrl) ??
                            '/placeholder-article.png'
                          }
                          alt={post.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      </div>

                      {/* TITLE */}
                      <h2 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#f38918] transition-colors mb-2">
                        {post.title}
                      </h2>

                      {/* OVERVIEW */}
                      {post.bodyOverview && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {post.bodyOverview}
                        </p>
                      )}

                      {/* DATE & VIEWS */}
                      <div className="text-[13px] text-gray-500 mb-3">
                        in {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="ml-2">• {post.viewCount ?? 0} Views</span>
                      </div>

                      {/* TAGS */}
                      <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                        {post.categories && Array.isArray(post.categories) && post.categories.length > 0 ? (
                          post.categories.map((c: any) => (
                            <span key={c.categoryId} className="text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md">
                              {c.categoryName}
                            </span>
                          ))
                        ) : post.blogCategoryName ? (
                          <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md">
                            {post.blogCategoryName}
                          </span>
                        ) : null}

                        {post.labels?.length > 0 && (
                          post.labels.sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999)).map((l: any) => (
                            <span key={l.name} className="text-xs border border-gray-200 text-gray-700 font-medium px-2.5 py-1 rounded-md">
                              {l.name}
                            </span>
                          ))
                        )}
                      </div>

                      {/* READ MORE */}
                      <div className="text-sm text-gray-600 font-medium group-hover:text-[#f38918] transition-colors">
                        Read more
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* LOAD MORE BUTTON */}
              {catPosts.length > 3 && (
                <div className="mt-12">
                  <Link href={`/blog/category/${cat.slug}`}>
                    <button className="bg-[#f38918] hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition-colors">
                      Load more &gt;
                    </button>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Houszy Blog",
            url: "https://houszy.co.uk/blog",
            description: "Expert tips, guides, and advice from Houszy.",
          }),
        }}
      />
    </main>
  );


}
