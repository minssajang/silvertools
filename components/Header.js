import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const PAGE_ACCENTS = {
  '/':                    '#10b981',
  '/magnifier-down':      '#10b981',
  '/medicine':            '#f59e0b',
  '/hospital':            '#3b82f6',
  '/sos':                 '#ef4444',
  '/brain-game':          '#8b5cf6',
  '/health-record':       '#ec4899',
  '/big-news':            '#06b6d4',
  '/transit':             '#f97316',
  '/screen-share':        '#8b5cf6',
  '/screen-view':         '#8b5cf6',
  '/family-dashboard':    '#10b981',
  '/login':               '#10b981',
}

const LOGO_ICONS = {
  'SilverTools': '🌿',
}

const TOOLS = [
  { href: '/',               ko: '🏠 홈',        en: '🏠 Home' },
  { href: '/magnifier-down', ko: '🔍 돋보기',     en: '🔍 Magnifier' },
  { href: '/medicine',       ko: '💊 복약관리',   en: '💊 Medicine' },
  { href: '/hospital',       ko: '🏥 병원찾기',   en: '🏥 Hospital' },
  { href: '/sos',            ko: '🆘 긴급SOS',    en: '🆘 SOS' },
  { href: '/brain-game',     ko: '🧠 두뇌게임',   en: '🧠 Brain' },
  { href: '/health-record',  ko: '🩺 건강기록',   en: '🩺 Health' },
  { href: '/big-news',       ko: '📰 큰글씨뉴스', en: '📰 News' },
  { href: '/transit',        ko: '🚌 대중교통',   en: '🚌 Transit' },
  { href: '/screen-share',   ko: '📺 화면공유',   en: '📺 Share' },
  { href: '/family-dashboard', ko: '👨‍👩‍👧 가족',    en: '👨‍👩‍👧 Family' },
  { href: '/login',          ko: '👤 로그인',     en: '👤 Login' },
]

export default function Header({ lang, onToggleLang, siteName = 'SilverTools', siteHref = '/' }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const accent = Object.entries(PAGE_ACCENTS)
    .filter(([path]) => path !== '/')
    .find(([path]) => router.pathname.startsWith(path))?.[1]
    || PAGE_ACCENTS['/']

  const icon = LOGO_ICONS[siteName] || '🌿'

  const allLinks = [
    ...TOOLS,
    { href: '/blog', ko: '📝 블로그', en: '📝 Blog' },
  ]

  return (
    <>
      <style>{`
        :root { --accent: ${accent}; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: var(--text); font-size: 22px; line-height: 1; }
        .mobile-menu { display: none; }
        @media (max-width: 768px) {
          .header-nav { display: none !important; }
          .hamburger { display: flex; align-items: center; justify-content: center; }
          .mobile-menu {
            display: ${menuOpen ? 'flex' : 'none'};
            flex-direction: column;
            position: fixed;
            top: 56px;
            left: 0; right: 0;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            padding: 12px 16px;
            gap: 6px;
            z-index: 999;
            max-height: calc(100vh - 56px);
            overflow-y: auto;
          }
          .mobile-menu a {
            display: block;
            padding: 10px 14px;
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            font-size: 16px;
            font-weight: 600;
          }
          .mobile-menu a:hover, .mobile-menu a.active {
            background: var(--surface2);
            color: var(--accent);
          }
        }
      `}</style>

      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">{icon}</div>
            <span className="logo-text">{siteName}</span>
          </Link>
          <div className="header-right">
            <nav className="header-nav">
              {allLinks.map(t => {
                const isActive = t.href === '/'
                  ? router.pathname === '/'
                  : router.pathname.startsWith(t.href)
                const color = PAGE_ACCENTS[t.href] || accent
                return (
                  <Link key={t.href} href={t.href}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    style={isActive ? { color, background: `${color}18`, borderColor: `${color}44` } : {}}>
                    {lang === 'en' ? t.en : t.ko}
                  </Link>
                )
              })}
            </nav>
            {onToggleLang && (
              <button className="lang-btn" onClick={onToggleLang}>
                {lang === 'ko' ? '🇺🇸 EN' : '🇰🇷 KR'}
              </button>
            )}
            <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="메뉴">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <div className="mobile-menu">
        {allLinks.map(t => {
          const isActive = t.href === '/'
            ? router.pathname === '/'
            : router.pathname.startsWith(t.href)
          return (
            <Link key={t.href} href={t.href}
              className={isActive ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              {lang === 'en' ? t.en : t.ko}
            </Link>
          )
        })}
      </div>
    </>
  )
}
