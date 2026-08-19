import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://houszy.co.uk'

export async function GET() {
  const currentDate = new Date().toISOString()

  const staticPages = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/blog`, priority: '0.8', changefreq: 'daily' },
    { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/faq`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/careers`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${SITE_URL}/privacy-policy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE_URL}/refund-and-return-policy`, priority: '0.3', changefreq: 'yearly' }
  ]

  const urls = staticPages
    .map((p) => {
      return `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefrequency>${p.changefreq}</changefrequency>
    <priority>${p.priority}</priority>
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
