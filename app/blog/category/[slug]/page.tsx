import React from "react";
import Link from "next/link";

const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

function absoluteUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

async function fetchJSON(url: string) {
  const res = await fetch(url, { next: { revalidate: 600 } }); 
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

// ⭐ MUST USE Promise<{ slug }>
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const categoriesUrl = `${API_BASE}/api/BlogCategories?includeInactive=false&includeSubCategories=true`;
    const categoriesResp = await fetchJSON(categoriesUrl);
    const categories = categoriesResp?.data ?? [];
    const category = categories.find((c: any) => c.slug === slug);

    if (!category) {
      return {
        title: "Category not found",
        description: "This blog category does not exist.",
      };
    }

 return {
  title: category.metaTitle || `${category.name} Blog UK | Direct Care`,

  description:
    category.metaDescription ||
    `Explore ${category.name} related health articles, medicine guides, and wellness tips in the UK.`,

  alternates: {
    canonical: `https://www.direct-care.co.uk/blog/category/${category.slug}`,
  },

  openGraph: {
    title: category.metaTitle || `${category.name} Blog UK`,
    description:
      category.metaDescription ||
      `Browse ${category.name} health articles and guides.`,
    url: `https://www.direct-care.co.uk/blog/category/${category.slug}`,
    type: "website",

    images: category.imageUrl
      ? [
          {
            url: absoluteUrl(category.imageUrl),
            width: 1200,
            height: 630,
            alt: category.name,
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
    return {
      title: "Category",
      description: "Blog category page",
    };
  }
}

// ⭐ MUST USE Promise<{ slug }>
export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const postsUrl = `${API_BASE}/api/BlogPosts?includeUnpublished=false&onlyHomePage=false`;
  const categoriesUrl = `${API_BASE}/api/BlogCategories?includeInactive=false&includeSubCategories=true`;

  const [postsResp, categoriesResp] = await Promise.all([
    fetchJSON(postsUrl),
    fetchJSON(categoriesUrl),
  ]);

  const allPosts = postsResp?.data ?? [];
  const categories = categoriesResp?.data ?? [];

  const category = categories.find((c: any) => c.slug === slug);

  if (!category) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.name,
      description:
        category.metaDescription ||
        `Articles related to ${category.name}`,
      url: `https://www.direct-care.co.uk/blog/category/${category.slug}`,
    }),
  }}
/>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold">Category not found</h1>
          <p className="text-gray-600 mt-2">
            This category may have been removed or renamed.
          </p>
          <Link
            href="/blog"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            ← Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  // Filter posts by category
  let filtered = allPosts.filter(
    (p: any) => {
      if (p.categories && Array.isArray(p.categories)) {
        return p.categories.some((c: any) => c.categoryId === category.id);
      }
      return p.blogCategoryId === category.id;
    }
  );

  // Respect publish dates
  const now = new Date();
  filtered = filtered.filter((p: any) => {
    if (!p.isPublished) return false;
    if (p.startDate && new Date(p.startDate) > now) return false;
    if (p.endDate && new Date(p.endDate) < now) return false;
    return true;
  });

  // Sorting
  filtered.sort((a: any, b: any) => {
    const oa = typeof a.displayOrder === "number" ? a.displayOrder : 9999;
    const ob = typeof b.displayOrder === "number" ? b.displayOrder : 9999;
    if (oa !== ob) return oa - ob;
    return (
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
    );
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-sm mb-4 text-gray-500">
          <Link href="/blog" className="hover:underline">
            Blog
          </Link>{" "}
          / <span>{category.name}</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>

        {category.metaDescription && (
          <p className="text-gray-600 max-w-2xl mb-6">
            {category.metaDescription}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((post: any) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition"
            >
              <img
                src={
                  absoluteUrl(post.thumbnailImageUrl) ??
                  absoluteUrl(post.featuredImageUrl) ??
                  "/placeholder-article.png"
                }
               alt={`${post.title} ${category.name} article`}
                className="w-full h-44 object-contain rounded-lg mb-4"
                loading="lazy"
              />

              <h3 className="font-semibold text-lg mb-2">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:underline"
                >
                  {post.title}
                </Link>
              </h3>

              <p className="text-sm text-gray-600 line-clamp-3">
                {post.bodyOverview}
              </p>

              <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
                <span>
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-400">
                  Views: {post.viewCount ?? 0}
                </span>
              </div>

              {post.labels?.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {post.labels.map((l: any) => (
                    <span
                      key={l.name}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: l.color, color: "#fff" }}
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-gray-600 mt-10 text-center text-lg font-medium">
            No articles available in this category.
          </p>
        )}
      </div>
    </main>
  );
}
