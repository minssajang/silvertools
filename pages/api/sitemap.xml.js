const BASE_URL = 'https://www.silvertools.co.kr'

const PAGES = [
  { url: '/',                changefreq: 'daily',   priority: '1.0' },
  { url: '/magnifier-down',  changefreq: 'weekly',  priority: '0.9' },
  { url: '/medicine',        changefreq: 'weekly',  priority: '0.9' },
  { url: '/hospital',        changefreq: 'weekly',  priority: '0.9' },
  { url: '/sos',             changefreq: 'weekly',  priority: '0.9' },
  { url: '/brain-game',      changefreq: 'weekly',  priority: '0.9' },
  { url: '/health-record',   changefreq: 'weekly',  priority: '0.9' },
  { url: '/big-news',        changefreq: 'daily',   priority: '0.8' },
  { url: '/transit',         changefreq: 'weekly',  priority: '0.8' },
  { url: '/screen-share',    changefreq: 'monthly', priority: '0.7' },
  { url: '/family-dashboard',changefreq: 'monthly', priority: '0.7' },
  { url: '/faq',             changefreq: 'monthly', priority: '0.6' },
  { url: '/privacy',         changefreq: 'monthly', priority: '0.5' },
  { url: '/terms',           changefreq: 'monthly', priority: '0.5' },
  { url: '/blog',            changefreq: 'weekly',  priority: '0.7' },
]

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const now = new Date().toISOString().slice(0, 10)
  const urls = PAGES.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.status(200).send(xml)
}
