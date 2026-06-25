import { createClient } from '@supabase/supabase-js'

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

const BASE_URL = 'https://www.silvertools.kr'

const STATIC_PAGES = [
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
  { url: '/blog',            changefreq: 'weekly',  priority: '0.7' },
  { url: '/faq',             changefreq: 'monthly', priority: '0.6' },
  { url: '/privacy',         changefreq: 'monthly', priority: '0.5' },
  { url: '/terms',           changefreq: 'monthly', priority: '0.5' },
]

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const now = nowKST().slice(0, 10)

  // 발행된 블로그 글 slug 동적 조회
  let blogUrls = []
  try {
    const supabase = getSupabase()
    if (supabase) {
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .eq('post_type', 'blog')
        .order('published_at', { ascending: false })
      blogUrls = (data || []).map(p => ({
        url: `/blog/${p.slug}`,
        lastmod: (p.updated_at || p.published_at || now).slice(0, 10),
        changefreq: 'monthly',
        priority: '0.7',
      }))
    }
  } catch {}

  const staticEntries = STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const blogEntries = blogUrls.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${blogEntries}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  res.status(200).send(xml)
}
