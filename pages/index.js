import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { AdSlot, SidebarAd } from '../components/AdSlot'
import { findAdSlot } from '../lib/adSlots'

const TOOLS = [
  {
    href: '/magnifier-down',
    icon: '🔍',
    name: '돋보기',
    desc: { ko: '실시간 확대 · 확대 촬영 · 한자·텍스트 인식', en: 'Live zoom · Capture · OCR & Hanja lookup' },
    color: '#10b981',
    ready: true,
  },
  {
    href: '/medicine',
    icon: '💊',
    name: '복약 관리',
    desc: { ko: '약 복용 시간 알림 · 복약 기록 관리', en: 'Medication reminders & history' },
    color: '#f59e0b',
    ready: true,
  },
  {
    href: '/hospital',
    icon: '🏥',
    name: '병원 찾기',
    desc: { ko: '내 주변 병원·약국 · 진료과목별 검색', en: 'Find nearby hospitals & pharmacies' },
    color: '#3b82f6',
    ready: true,
  },
  {
    href: '/sos',
    icon: '🆘',
    name: '긴급 SOS',
    desc: { ko: '긴급 연락처 등록 · 원터치 SOS 발신', en: 'Emergency contacts · One-touch SOS' },
    color: '#ef4444',
    ready: true,
  },
  {
    href: '/brain-game',
    icon: '🧠',
    name: '두뇌 게임',
    desc: { ko: '치매 예방 · 기억력·집중력 훈련 게임', en: 'Dementia prevention · Brain training games' },
    color: '#8b5cf6',
    ready: true,
  },
  {
    href: '/health-record',
    icon: '🩺',
    name: '건강 기록',
    desc: { ko: '혈압·혈당·체중 기록 · 차트로 확인', en: 'Blood pressure, glucose & weight tracking' },
    color: '#ec4899',
    ready: true,
  },
  {
    href: '/big-news',
    icon: '📰',
    name: '큰글씨 뉴스',
    desc: { ko: '눈에 편한 큰 글씨로 보는 오늘의 뉴스', en: 'Today\'s news in large, easy-to-read text' },
    color: '#06b6d4',
    ready: true,
  },
  {
    href: '/transit',
    icon: '🚌',
    name: '대중교통',
    desc: { ko: '버스·지하철 실시간 도착 · 경로 안내', en: 'Real-time bus & subway arrivals' },
    color: '#f97316',
    ready: true,
  },
]

const I18N = {
  ko: {
    metaTitle: '실버툴즈 (SilverTools) - 어르신을 위한 무료 스마트폰 도우미',
    metaDesc: '돋보기, 복약알림, 병원찾기, 긴급SOS, 두뇌게임, 건강기록, 큰글씨뉴스까지 — 어르신이 스마트폰을 편리하게 사용할 수 있도록 도와주는 무료 도구 모음입니다.',
    badge: '어르신을 위한 · 무료 · 큰 글씨',
    heroTitle: '스마트폰이 더 쉬워지는',
    heroHighlight: '실버툴즈',
    heroSub: '돋보기, 복약알림, 병원찾기, 긴급SOS 등 어르신께 꼭 필요한 도구를 한 곳에서',
    adLabel: '광고',
  },
  en: {
    metaTitle: 'SilverTools - Free Smart Tools for Seniors',
    metaDesc: 'Magnifier, medication reminders, hospital finder, emergency SOS, brain games, health tracking, large-print news — all free tools designed for seniors in one place.',
    badge: 'For Seniors · Free · Large Text',
    heroTitle: 'Smarter Smartphone',
    heroHighlight: 'For Seniors',
    heroSub: 'Magnifier, medication reminders, hospital finder, SOS and more — all the tools seniors need',
    adLabel: 'Ad',
  },
}

export default function Home() {
  const [lang, setLang] = useState('ko')
  const [adsOn, setAdsOn] = useState(true)
  const [adSlots, setAdSlots] = useState([])
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
      if (d.adSlots !== undefined) setAdSlots(d.adSlots)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next)
    localStorage.setItem('dt_lang', next)
  }

  const t = I18N[lang]

  return (
    <>
      <Head>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.metaDesc} />
        <meta property="og:title" content={t.metaTitle} />
        <meta property="og:description" content={t.metaDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTools" />
        <link rel="canonical" href="https://www.silvertools.co.kr/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" siteHref="/" />

      {settingsLoaded && adsOn && (
        <div className="wrap" style={{ marginTop: 24 }}>
          <AdSlot slot={process.env.NEXT_PUBLIC_AD_SLOT_TOP || '1111111111'} slotData={findAdSlot(adSlots, 'home_top')} number={1} label={t.adLabel} />
        </div>
      )}

      <div className="page-layout">
        {settingsLoaded && adsOn && (
          <aside className="sidebar">
            <SidebarAd slot={process.env.NEXT_PUBLIC_AD_SLOT_LEFT || '5555555555'} slotData={findAdSlot(adSlots, 'home_left')} number={2} label={t.adLabel} />
          </aside>
        )}

        <main className="main-content" style={{ padding: '0 20px' }}>
          {/* 히어로 */}
          <section className="hero">
            <div className="hero-badge">{t.badge}</div>
            <h1 className="hero-title">
              {t.heroTitle}<br />
              <span className="highlight">{t.heroHighlight}</span>
            </h1>
            <p className="hero-sub">{t.heroSub}</p>
          </section>

          {/* 툴 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 48,
          }}>
            {TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 24,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  height: '100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: `${tool.color}22`,
                    border: `2px solid ${tool.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, marginBottom: 14,
                  }}>
                    {tool.icon}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                    {tool.name}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                    {tool.desc[lang]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </main>

        {settingsLoaded && adsOn && (
          <aside className="sidebar">
            <SidebarAd slot={process.env.NEXT_PUBLIC_AD_SLOT_RIGHT || '6666666666'} slotData={findAdSlot(adSlots, 'home_right')} number={3} label={t.adLabel} />
          </aside>
        )}
      </div>

      {settingsLoaded && adsOn && (
        <div className="wrap" style={{ marginTop: 24, marginBottom: 24 }}>
          <AdSlot slot={process.env.NEXT_PUBLIC_AD_SLOT_MIDDLE || '3333333333'} slotData={findAdSlot(adSlots, 'home_middle')} number={5} label={t.adLabel} />
        </div>
      )}

      <Footer lang={lang} siteName="SilverTools" adsOn={adsOn} slotData={findAdSlot(adSlots, 'footer')} loaded={settingsLoaded} />
    </>
  )
}
