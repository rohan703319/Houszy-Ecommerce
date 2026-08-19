import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://houszy.co.uk'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.houszy.co.uk'

interface SitemapItem {
  slug: string
  lastModified?: string
}

export async function GET() {
  let products: SitemapItem[] = []
  try {
    const res = await fetch(`${API_URL}/api/Sitemap/products`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      products = json?.data ?? []
    }
  } catch (error) {
    console.error('Error fetching product sitemap data:', error)
  }

  const urls = products
    .map((p) => {
      const date = p.lastModified ? new Date(p.lastModified).toISOString() : new Date().toISOString()
      return `  <url>
    <loc>${SITE_URL}/product/${p.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefrequency>daily</changefrequency>
    <priority>0.9</priority>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=18000',
    },
  })
}
