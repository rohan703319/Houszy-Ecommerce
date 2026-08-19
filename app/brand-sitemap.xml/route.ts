import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://houszy.co.uk'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.houszy.co.uk'

interface SitemapItem {
  slug: string
  lastModified?: string
}

export async function GET() {
  let brands: SitemapItem[] = []
  try {
    const res = await fetch(`${API_URL}/api/Sitemap/brands`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      brands = json?.data ?? []
    }
  } catch (error) {
    console.error('Error fetching brand sitemap data:', error)
  }

  const urls = brands
    .map((b) => {
      const date = b.lastModified ? new Date(b.lastModified).toISOString() : new Date().toISOString()
      return `  <url>
    <loc>${SITE_URL}/brands/${b.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefrequency>weekly</changefrequency>
    <priority>0.6</priority>
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
