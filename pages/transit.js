import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#f97316'

const TRANSIT_APPS = [
  { name: '카카오맵', url: 'https://map.kakao.com', icon: '🟡', color: '#FEE500', textColor: '#000', desc: { ko: '대중교통 길찾기', en: 'Directions' } },
  { name: '네이버지도', url: 'https://map.naver.com', icon: '🟢', color: '#03C75A', textColor: '#fff', desc: { ko: '버스·지하철 안내', en: 'Bus & Subway' } },
  { name: '카카오T', url: 'https://t.kakao.com', icon: '🚕', color: '#FEE500', textColor: '#000', desc: { ko: '택시 호출', en: 'Taxi Call' } },
  { name: 'T맵', url: 'https://www.tmap.co.kr', icon: '🔵', color: '#2563eb', textColor: '#fff', desc: { ko: '내비게이션', en: 'Navigation' } },
]

const SUBWAY_LINES = [
  { name: '1호선', color: '#0052A4', url: 'https://map.naver.com/v5/search/1호선' },
  { name: '2호선', color: '#00A84D', url: 'https://map.naver.com/v5/search/2호선' },
  { name: '3호선', color: '#EF7C1C', url: 'https://map.naver.com/v5/search/3호선' },
  { name: '4호선', color: '#00A4E3', url: 'https://map.naver.com/v5/search/4호선' },
  { name: '5호선', color: '#996CAC', url: 'https://map.naver.com/v5/search/5호선' },
  { name: '6호선', color: '#CD7C2F', url: 'https://map.naver.com/v5/search/6호선' },
  { name: '7호선', color: '#747F00', url: 'https://map.naver.com/v5/search/7호선' },
  { name: '8호선', color: '#E6186C', url: 'https://map.naver.com/v5/search/8호선' },
  { name: '9호선', color: '#D4A024', url: 'https://map.naver.com/v5/search/9호선' },
  { name: '경의중앙', color: '#77C4A3', url: 'https://map.naver.com/v5/search/경의중앙선' },
  { name: '분당선', color: '#F5A200', url: 'https://map.naver.com/v5/search/분당선' },
  { name: 'GTX-A', color: '#8B4513', url: 'https://map.naver.com/v5/search/GTX-A' },
]

const TIPS = [
  { icon: '💡', ko: '어르신 교통카드(경로우대카드)를 사용하시면 지하철을 무료로 이용하실 수 있어요 (만 65세 이상)', en: 'Seniors (65+) can ride subways for free with a Senior Transit Card' },
  { icon: '🚌', ko: '버스는 앞문으로 타고 뒷문으로 내리세요. 승하차 시 교통카드를 꼭 찍어주세요', en: 'Board at the front, exit at the rear. Always tap your card when boarding/exiting' },
  { icon: '🪑', ko: '지하철의 노란색 칸막이 안쪽 자리가 노약자석입니다. 편하게 앉으세요', en: 'Yellow-bordered seats are priority seats for seniors. Please use them' },
  { icon: '📞', ko: '교통 불편 신고나 분실물은 120(다산콜)로 전화하세요', en: 'For complaints or lost items, call 120' },
  { icon: '🆓', ko: '만 65세 이상이면 전국 지하철 무료 탑승 가능합니다 (경로우대카드 필요)', en: 'Seniors 65+ ride all metropolitan subways for free (with Senior Card)' },
]

export default function Transit() {
  const [lang, setLang] = useState('ko')
  const [tab, setTab] = useState(0) // 0: 길찾기, 1: 지하철, 2: 이용안내
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [recentRoutes, setRecentRoutes] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    const rr = localStorage.getItem('silver_recent_routes')
    if (rr) setRecentRoutes(JSON.parse(rr))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const searchKakao = () => {
    if (!from && !to) { window.open('https://map.kakao.com', '_blank'); return }
    const q = from && to ? `${from} to ${to}` : to || from
    const saved = [{ from, to }, ...recentRoutes.filter(r => !(r.from === from && r.to === to))].slice(0, 5)
    setRecentRoutes(saved); localStorage.setItem('silver_recent_routes', JSON.stringify(saved))
    window.open(`https://map.kakao.com/?q=${encodeURIComponent(to || q)}&from=${encodeURIComponent(from)}`, '_blank')
  }

  const searchNaver = () => {
    if (!from && !to) { window.open('https://map.naver.com', '_blank'); return }
    const saved = [{ from, to }, ...recentRoutes.filter(r => !(r.from === from && r.to === to))].slice(0, 5)
    setRecentRoutes(saved); localStorage.setItem('silver_recent_routes', JSON.stringify(saved))
    window.open(`https://map.naver.com/v5/directions/${encodeURIComponent(from)}/${encodeURIComponent(to)}/-/-/transit`, '_blank')
  }

  const swap = () => { setFrom(to); setTo(from) }

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '대중교통 — 실버툴즈' : 'Public Transit — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .transit-wrap { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .transit-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .transit-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; text-align: center; transition: all .2s; }
        .transit-tab.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .route-form { background: var(--surface); border-radius: 16px; padding: 18px; margin-bottom: 16px; }
        .route-input { width: 100%; padding: 16px 18px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 18px; font-weight: 600; outline: none; margin-bottom: 8px; }
        .route-input:focus { border-color: ${ACCENT}; }
        .route-input::placeholder { color: var(--text3, #64748b); }
        .swap-btn { width: 100%; padding: 10px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 20px; cursor: pointer; margin-bottom: 8px; }
        .search-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
        .search-btn { padding: 16px; border-radius: 12px; border: none; font-size: 16px; font-weight: 800; cursor: pointer; }
        .app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .app-btn { padding: 18px 12px; border-radius: 14px; border: 2px solid var(--border); text-decoration: none; display: flex; align-items: center; gap: 12px; transition: all .2s; cursor: pointer; }
        .app-btn:hover { border-color: ${ACCENT}; }
        .subway-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .subway-btn { padding: 14px 8px; border-radius: 12px; border: none; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer; text-align: center; transition: all .15s; }
        .subway-btn:active { transform: scale(0.97); }
        .tip-card { background: var(--surface); border-radius: 14px; padding: 16px; margin-bottom: 10px; display: flex; gap: 12px; align-items: flex-start; border: 1px solid var(--border); }
        .tip-icon { font-size: 28px; flex-shrink: 0; }
        .tip-text { font-size: 16px; line-height: 1.7; }
        .recent-label { font-size: 14px; color: var(--text2); font-weight: 700; margin-bottom: 8px; }
        .recent-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 99px; background: var(--surface2); border: 1px solid var(--border); font-size: 14px; cursor: pointer; margin: 0 6px 6px 0; }
        .section-title { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
        .free-banner { background: #10b98122; border: 2px solid #10b98144; border-radius: 14px; padding: 16px; margin-bottom: 16px; font-size: 16px; color: #10b981; font-weight: 700; line-height: 1.6; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="transit-wrap">
        <div className="transit-tabs">
          {(lang === 'ko' ? ['🗺 길찾기', '🚇 지하철', '💡 이용안내'] : ['🗺 Directions', '🚇 Subway', '💡 Tips']).map((name, i) => (
            <button key={i} className={`transit-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{name}</button>
          ))}
        </div>

        {/* ===== 탭0: 길찾기 ===== */}
        {tab === 0 && (
          <>
            <div className="free-banner">
              🆓 {lang === 'ko' ? '만 65세 이상 어르신은 전국 지하철 무료!' : 'Seniors 65+ ride subways for free!'}
            </div>

            <div className="route-form">
              <input className="route-input" value={from} onChange={e => setFrom(e.target.value)}
                placeholder={lang === 'ko' ? '출발지 (예: 서울역)' : 'From (e.g. Seoul Station)'} />
              <button className="swap-btn" onClick={swap}>⇅ {lang === 'ko' ? '출발·도착 바꾸기' : 'Swap'}</button>
              <input className="route-input" value={to} onChange={e => setTo(e.target.value)}
                placeholder={lang === 'ko' ? '도착지 (예: 강남역)' : 'To (e.g. Gangnam Station)'} />
              <div className="search-btns">
                <button className="search-btn" style={{ background: '#FEE500', color: '#000' }} onClick={searchKakao}>🟡 카카오맵</button>
                <button className="search-btn" style={{ background: '#03C75A', color: '#fff' }} onClick={searchNaver}>🟢 네이버지도</button>
              </div>
            </div>

            {/* 최근 경로 */}
            {recentRoutes.length > 0 && (
              <div>
                <div className="recent-label">🕐 {lang === 'ko' ? '최근 검색' : 'Recent Searches'}</div>
                {recentRoutes.map((r, i) => (
                  <span key={i} className="recent-chip" onClick={() => { setFrom(r.from); setTo(r.to) }}>
                    {r.from} → {r.to}
                  </span>
                ))}
              </div>
            )}

            <div style={{ height: 16 }} />

            {/* 교통 앱 바로가기 */}
            <div className="section-title">📱 {lang === 'ko' ? '교통 앱 바로가기' : 'Transit Apps'}</div>
            <div className="app-grid">
              {TRANSIT_APPS.map(app => (
                <a key={app.name} href={app.url} target="_blank" rel="noreferrer" className="app-btn">
                  <span style={{ fontSize: 28 }}>{app.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{app.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{app.desc[lang]}</div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* ===== 탭1: 지하철 ===== */}
        {tab === 1 && (
          <>
            <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 14 }}>
              {lang === 'ko' ? '노선을 누르면 네이버지도에서 열차 시간표가 표시됩니다' : 'Tap a line to view timetable in Naver Map'}
            </div>
            <div className="subway-grid">
              {SUBWAY_LINES.map(line => (
                <button key={line.name} className="subway-btn" style={{ background: line.color }}
                  onClick={() => window.open(line.url, '_blank')}>
                  {line.name}
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
            <div className="section-title">🔗 {lang === 'ko' ? '지하철 시간표 바로가기' : 'Subway Timetable'}</div>
            {[
              { name: lang === 'ko' ? '서울 지하철 공식' : 'Seoul Metro', url: 'https://www.seoulmetro.co.kr', icon: '🔵' },
              { name: lang === 'ko' ? '코레일 (기차)' : 'Korail (Train)', url: 'https://www.korail.com', icon: '🚄' },
              { name: lang === 'ko' ? '고속버스 예매' : 'Express Bus', url: 'https://www.kobus.co.kr', icon: '🚌' },
            ].map(link => (
              <a key={link.name} href={link.url} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--surface)', borderRadius: 12, marginBottom: 8, textDecoration: 'none', color: 'var(--text)', border: '2px solid var(--border)', fontSize: 16, fontWeight: 700 }}>
                <span style={{ fontSize: 24 }}>{link.icon}</span>
                {link.name}
                <span style={{ marginLeft: 'auto', color: 'var(--text2)' }}>→</span>
              </a>
            ))}
          </>
        )}

        {/* ===== 탭2: 이용안내 ===== */}
        {tab === 2 && (
          <>
            <div className="free-banner">
              🎉 {lang === 'ko'
                ? '만 65세 이상 어르신께서는 경로우대카드(교통카드)로 서울·수도권·부산 등 전국 도시철도 무료 이용이 가능합니다!'
                : 'Seniors 65+ can ride all metropolitan subway systems for free with a Senior Transit Card!'}
            </div>
            {TIPS.map((tip, i) => (
              <div key={i} className="tip-card">
                <div className="tip-icon">{tip.icon}</div>
                <div className="tip-text">{lang === 'ko' ? tip.ko : tip.en}</div>
              </div>
            ))}
            <div style={{ height: 16 }} />
            <div className="section-title">📞 {lang === 'ko' ? '교통 관련 전화번호' : 'Contact Numbers'}</div>
            {[
              { name: lang === 'ko' ? '120 다산콜 (서울시 교통민원)' : '120 Seoul Info', num: '120' },
              { name: lang === 'ko' ? '1588-5656 코레일 고객센터' : '1588-5656 Korail', num: '15885656' },
              { name: lang === 'ko' ? '1577-1234 서울 지하철 고객센터' : '1577-1234 Seoul Metro', num: '15771234' },
            ].map(c => (
              <a key={c.num} href={`tel:${c.num}`}
                style={{ display: 'flex', alignItems: 'center', justify: 'space-between', padding: '14px 16px', background: 'var(--surface)', borderRadius: 12, marginBottom: 8, textDecoration: 'none', color: 'var(--text)', border: '2px solid var(--border)', fontSize: 16, fontWeight: 700, gap: 12 }}>
                <span style={{ fontSize: 22 }}>📞</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ color: ACCENT }}>{lang === 'ko' ? '전화' : 'Call'}</span>
              </a>
            ))}
          </>
        )}
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
