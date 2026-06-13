//app\blog\[slug]\page.tsx
export const revalidate = 300;

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import CommentForm from "./CommentForm";
import CommentsList from "./CommentsList";
import * as LucideIcons from "lucide-react";
import TableOfContents from "@/components/blog/TableOfContents";

const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

// ⭐ FIX: params is now Promise in Next.js 15
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const apiURL = `${API_BASE}/api/BlogPosts/slug/${encodeURIComponent(slug)}?includeComments=false`;

  try {
    const res = await fetch(apiURL, { next: { revalidate: 300 } });
    const resp = await res.json();
    const post = resp?.data;

    if (!post) {
      return {
        title: "Blog not found",
        description: "This article may be removed or unpublished.",
      };
    }

    return {
      title: post.metaTitle || post.title,
      description:
        post.metaDescription ||
        post.bodyOverview ||
        "Read the full article for more details.",

      alternates: {
        canonical: `https://www.houszy.co.uk/blog/${post.slug}`,
      },

      openGraph: {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.bodyOverview,
        url: `https://www.houszy.co.uk/blog/${post.slug}`,
        type: "article",
        images: post.featuredImageUrl
          ? [
            {
              url: absoluteUrl(post.featuredImageUrl),
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
          : [],
      },

      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return { title: "Blog not found" };
  }
}

function absoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchJSON(url: string): Promise<any> {
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── SIDEBAR async component (streams separately) ───────────────────────────
async function BlogSidebar({
  slug,
  postBody,
  relatedBlogPostIds,
}: {
  slug: string;
  postBody: string;
  relatedBlogPostIds: string[];
}) {
  const recentURL = `${API_BASE}/api/BlogPosts?includeUnpublished=false&onlyHomePage=false`;

  // Fetch recent posts + related in parallel
  const relatedPromises = relatedBlogPostIds.map((id: string) =>
    fetchJSON(`${API_BASE}/api/BlogPosts/${id}`)
  );

  const [recentResp, ...relatedResults] = await Promise.all([
    fetchJSON(recentURL),
    ...relatedPromises,
  ]);

  const allPosts = recentResp?.data ?? [];
  const now = new Date();

  const recentPosts = allPosts
    .filter((p: any) => {
      if (!p.isPublished) return false;
      if (p.slug === slug) return false;
      const postDate = new Date(p.publishedAt || p.startDate);
      if (postDate > now) return false;
      return true;
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.startDate || b.publishedAt).getTime() -
        new Date(a.startDate || a.publishedAt).getTime()
    )
    .slice(0, 5);

  const relatedBlogs = relatedResults
    .map((r) => r?.data)
    .filter((x) => x && x.isPublished);

  return (
    <div className="w-full">
      {/* TABLE OF CONTENTS */}
      {postBody && (
        <div className="bg-white shadow-xl rounded-2xl p-6 border mb-2">
          <TableOfContents content={postBody} />
        </div>
      )}

      {/* RECENT ARTICLES CARD */}
      <div className="bg-white shadow-xl rounded-2xl p-6 border mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <LucideIcons.Clock3 className="w-4 h-4" />
          Recent Articles
        </h3>
        <div className="space-y-5">
          {recentPosts.map((blog: any) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`} className="flex gap-4 group">
              <div className="relative w-20 h-16 shrink-0">
                <Image
                  src={
                    absoluteUrl(blog.thumbnailImageUrl) ??
                    absoluteUrl(blog.featuredImageUrl) ??
                    "/placeholder-blog.png"
                  }
                  fill
                  className="rounded-lg object-contain shadow-sm group-hover:opacity-90"
                  alt={blog.title || "Blog Article"}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-gray-900 leading-tight group-hover:underline">
                    {blog.title}
                  </h4>
                  {blog.labels?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {[...blog.labels]
                        .sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999))
                        .map((l: any) => {
                          const IconComponent =
                            (LucideIcons as any)[l.icon] ?? LucideIcons.Sparkles;
                          return (
                            <span
                              key={l.name}
                              className="flex items-center gap-1 px-1.5 py-[2px] rounded-full text-[9px] font-medium shadow-sm whitespace-nowrap"
                              style={{ background: l.color || "#ccc", color: "#fff" }}
                            >
                              <IconComponent className="h-3 w-3" />
                              {l.name}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* RELATED ARTICLES CARD */}
      {relatedBlogs.length > 0 && (
        <div className="bg-white shadow-xl rounded-2xl p-6 border mt-[-25px]">
          <h3 className="text-xl font-semibold mb-5">🔗 Related Articles</h3>
          <div className="space-y-5">
            {relatedBlogs.map((blog: any) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="flex gap-4 group">
                <img
                  src={
                    absoluteUrl(blog.thumbnailImageUrl) ??
                    absoluteUrl(blog.featuredImageUrl) ??
                    "/placeholder-blog.png"
                  }
                  className="w-24 h-16 rounded-lg object-cover shadow-sm group-hover:opacity-90"
                  alt={blog.title}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight group-hover:underline">
                      {blog.title}
                    </h4>
                    {blog.labels?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {[...blog.labels]
                          .sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999))
                          .map((l: any) => {
                            const IconComponent =
                              (LucideIcons as any)[l.icon] ?? LucideIcons.Sparkles;
                            return (
                              <span
                                key={l.name}
                                className="flex items-center gap-1 px-1.5 py-[2px] rounded-full text-[9px] font-medium shadow-sm whitespace-nowrap"
                                style={{ background: l.color || "#ccc", color: "#fff" }}
                              >
                                <IconComponent className="h-3 w-3" />
                                {l.name}
                              </span>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(blog.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar skeleton (shown while BlogSidebar streams in) ───────────────────
function SidebarSkeleton() {
  return (
    <div className="w-full self-start pr-2">
      <div className="bg-white shadow-xl rounded-2xl p-6 border mb-8 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-5" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-24 h-16 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white shadow-xl rounded-2xl p-6 border animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-5" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-24 h-16 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const apiURL = `${API_BASE}/api/BlogPosts/slug/${encodeURIComponent(slug)}?includeComments=true`;

  // Only await the main blog post — sidebar streams separately
  const resp = await fetchJSON(apiURL);
  const post = resp?.data ?? null;

  if (!post) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold">Article not found</h1>
          <p className="text-gray-600 mt-2">This article may be removed or unpublished.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white py-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription || post.bodyOverview,
            image: absoluteUrl(post.featuredImageUrl),
            author: { "@type": "Person", name: post.authorName },
            publisher: { "@type": "Organization", name: "Houszy" },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://www.houszy.co.uk/blog/${post.slug}`,
            },
          }),
        }}
      />
      <div className="max-w-full mx-4 grid grid-cols-1 lg:grid-cols-3 gap-4 px-0 md:px-12 items-start">

        {/* LEFT ARTICLE CARD — renders immediately */}
        <div className="lg:col-span-2 ml-0 mr-0 md:ml-[-20px] md:mr-[-40px] lg:ml-[-55px] lg:mr-[-119px]">
          <div className="bg-white shadow-lg rounded-2xl p-4 md:p-8 border min-h-full">

            {/* Breadcrumb */}
            <nav className="hidden md:flex text-xs text-gray-500 mb-2 -mt-5 items-center gap-1">
              <Link href="/" className="hover:underline text-[#f38918]">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:underline text-[#f38918]">Blog</Link>
              <span>/</span>
              {post.blogCategoryName ? (
                <>
                  <Link
                    href={`/blog/category/${post.blogCategorySlug || post.blogCategoryName?.toLowerCase()}`}
                    className="hover:underline text-[#f38918]"
                  >
                    {post.blogCategoryName}
                  </Link>
                  <span>/</span>
                </>
              ) : null}
              <span className="text-gray-700 font-medium line-clamp-1 text-ellipsis overflow-hidden whitespace-nowrap">
                {post.title}
              </span>
            </nav>

            {/* Title */}
            <h1 className="text-lg md:text-2xl font-bold leading-tight text-gray-900">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-1 sm:gap-4 text-gray-600 text-xs md:text-sm">
              <span>✍️ {post.authorName?.trim() || "Houszy"}</span>
              <span>•</span>
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{post.viewCount ?? 0} Views</span>
            </div>

            {/* LABELS */}
            {post.labels?.length > 0 && (
              <div className="mt-5 flex gap-1 flex-wrap">
                {[...post.labels]
                  .sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999))
                  .map((l: any) => {
                    const IconComponent =
                      (LucideIcons as any)[l.icon] ?? LucideIcons.Sparkles;
                    return (
                      <span
                        key={l.name}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                        style={{ background: l.color || "#ccc", color: "#fff" }}
                      >
                        <IconComponent className="h-4 w-4" />
                        {l.name}
                      </span>
                    );
                  })}
              </div>
            )}

            {/* Featured Image */}
            {(post.featuredImageUrl || post.thumbnailImageUrl) && (
              <div className="mt-2 mb-2 w-full rounded-xl overflow-hidden relative aspect-[16/9]">
                <Image
                  src={
                    (post.featuredImageUrl || post.thumbnailImageUrl)?.startsWith("http")
                      ? (post.featuredImageUrl || post.thumbnailImageUrl)
                      : `${process.env.NEXT_PUBLIC_API_URL || ""}${post.featuredImageUrl || post.thumbnailImageUrl}`
                  }
                  alt={post.title || "Blog Image"}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Body */}
            <article
              dangerouslySetInnerHTML={{
                __html: (() => {
                  let headingIndex = 0;
                  return post.body.replace(
                    /<(h2|h3|h4)([^>]*)>(.*?)<\/\1>/gi,
                    (match: string, tag: string, attrs: string, text: string) => {
                      const cleanText = text.replace(/<[^>]+>/g, "").trim();
                      const id =
                        cleanText
                          .toLowerCase()
                          .replace(/[^a-z0-9\s]/g, "")
                          .replace(/\s+/g, "-") +
                        `-${headingIndex++}`;
                      const hasExistingId = /id=["']([^"']+)["']/.test(attrs);
                      return `
  <${tag}
    ${attrs}
    ${hasExistingId ? "" : `id="${id}"`}
    class="scroll-mt-28"
  >
    ${text}
  </${tag}>
`;
                    }
                  );
                })(),
              }}
              className="
    prose max-w-none text-[15px] leading-7
    prose-headings:text-gray-900
    prose-h2:text-2xl
    prose-h2:font-bold
    prose-h2:mt-10
    prose-h2:mb-4
    prose-h3:text-xl
    prose-h3:font-semibold
    prose-h3:mt-8
    prose-h3:mb-3
    prose-p:text-gray-700
    prose-p:leading-7
    prose-li:text-gray-700
  "
            />

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="mt-10 flex gap-2 flex-wrap">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <section className="mt-16">
              <h2 className="text-2xl font-semibold mb-6">
                Comments ({post.commentCount ?? post.comments?.length ?? 0})
              </h2>
              {post.allowComments && (
                <>
                  <CommentForm blogPostId={post.id} />
                  <CommentsList blogPostId={post.id} />
                </>
              )}
            </section>

          </div>
        </div>

        {/* RIGHT SIDEBAR — streams in separately via Suspense */}
        <aside className="lg:col-span-1 mt-10 lg:mt-0 order-last lg:order-none ml-0 mr-0 md:ml-[10px] md:mr-[10px] lg:ml-[118px] lg:mr-[-55px] sticky top-24">
          <Suspense fallback={<SidebarSkeleton />}>
            <BlogSidebar
              slug={slug}
              postBody={post.body}
              relatedBlogPostIds={Array.isArray(post.relatedBlogPostIds) ? post.relatedBlogPostIds : []}
            />
          </Suspense>
        </aside>

      </div>
    </main>
  );
}
