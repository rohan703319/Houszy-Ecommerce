import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.direct-care.co.uk'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.direct-care.co.uk'

async function fetchSlugs<T>(url: string, extract: (item: T) => string): Promise<string[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = await res.json()
    const items: T[] = json?.data?.items ?? json?.data ?? []
    return Array.isArray(items) ? items.map(extract).filter(Boolean) : []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs, blogSlugs, brandSlugs] = await Promise.all([
    fetchSlugs<{ slug: string }>(
      `${API_URL}/api/Products?page=1&pageSize=5000&isPublished=true`,
      (p) => p.slug
    ),
    fetchSlugs<{ slug: string }>(
      `${API_URL}/api/Categories`,
      (c) => c.slug
    ),
    fetchSlugs<{ slug: string }>(
      `${API_URL}/api/BlogPosts?page=1&pageSize=1000`,
      (b) => b.slug
    ),
    fetchSlugs<{ slug: string }>(
      `${API_URL}/api/Brands`,
      (b) => b.slug
    ),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/careers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund-and-return-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${SITE_URL}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
  
  const brandPages: MetadataRoute.Sitemap = brandSlugs.map((slug) => ({
    url: `${SITE_URL}/brands/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

return [...staticPages, ...productPages, ...categoryPages, ...blogPages, ...brandPages]
}