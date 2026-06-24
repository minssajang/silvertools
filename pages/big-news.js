import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#06b6d4'

const NEWS_SOURCES = [
  { ko: '종합', en: 'All', query: '오늘 뉴스' },
  { ko: '사회', en: 'Society', query: '사회 뉴스' },
  { ko: '건강', en: 'Health', query: '건강 의료 뉴스' },
  { ko: '날씨', en: 'Weather', query: '오늘 날씨 예보' },
  { ko: '경제', en: 'Economy', query: '경제 뉴스' },
  { ko: '지역', en: 'Local', query: '지역 뉴스' },
]

// 주요 뉴스 포털 링크
const NEWS_PORTALS = [
  { name: '네이버 뉴스', url: 'https://news.naver.com', icon: '🟢', color: '#03C75A' },
  { name: '다음 뉴스', url: 'https://news.daum.net', icon: '🔵', color: '#006FF9' },
  { name: 'KBS 뉴스', url: 'https://news.kbs.co.kr', icon: '🔴', color: '#e63946' },
  { name: 'MBC 뉴스', url: 'https://imnews.imbc.com', icon: '🟤', color: '#8b5cf6' },
  { name: 'SBS 뉴스', url: 'https://news.sbs.co.kr', icon: '🟡', color: '#f59e0b' },
  { name: '연합뉴스', url: 'https://www.yna.co.kr', icon: '⚫', color: '#374151' },
]

export default function BigNews() {
  const [lang, setLang] = useState('ko')
  const [fontSize, setFontSize] = useState(22)
  const [category, setCategory] = useState(0)
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNews, setSelectedNews] = useState(null)
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    const fs = localStorage.getItem('silver_news_fontsize')
    if (fs) setFontSize(Number(fs))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
    fetchNews(0)
  }, [])

  const fetchNews = async (catIdx) => {
    setLoading(true)
    setSelectedNews(null)
    try {
      const src = NEWS_SOURCES[catIdx]
      const res = await fetch(`https://api.anthropic.com/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `오늘 날짜 기준으로 ${src.query} 주요 기사 5개를 검색해서, 다음 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만:
{"articles":[{"title":"제목","summary":"2~3줄 요약. 어르신이 이해하기 쉬운 쉬운 말로.","category":"${src.ko}","url":""}]}`
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.filter(c => c.type === 'text').map(c => c.text).join('')
      const clean = text?.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setNews(parsed.articles || [])
    } catch (e) {
      // Claude API 없으면 샘플 뉴스 표시
      setNews([
        { title: '오늘의 날씨 — 전국 맑음, 낮 최고 기온 25도', summary: '오늘은 전국적으로 맑은 날씨가 예상됩니다. 낮 최고 기온은 25도 안팎으로 따뜻한 봄 날씨가 이어지겠습니다.', category: '날씨' },
        { title: '독감 예방접종 이달 말까지 무료 — 65세 이상 대상', summary: '보건복지부는 65세 이상 어르신을 대상으로 독감 예방접종을 이달 말까지 무료로 실시한다고 밝혔습니다. 가까운 보건소나 지정 의원을 방문하시면 됩니다.', category: '건강' },
        { title: '기초연금 수급 기준 완화 — 더 많은 분들이 혜택 받으실 수 있어', summary: '정부가 기초연금 수급 기준을 완화해 더 많은 어르신이 혜택을 받을 수 있게 됩니다. 신청은 주민센터에서 가능합니다.', category: '사회' },
        { title: '버스 경로 안내 앱, 어르신 큰 글씨 모드 추가', summary: '주요 대중교통 앱들이 어르신을 위한 큰 글씨 모드를 추가했습니다. 설정 메뉴에서 글씨 크기를 조절할 수 있습니다.', category: '사회' },
        { title: '치매 예방에 좋은 생활 습관 5가지', summary: '규칙적인 운동, 균형 잡힌 식사, 사회활동, 두뇌 자극, 충분한 수면이 치매 예방에 도움이 된다고 전문가들이 밝혔습니다.', category: '건강' },
      ])
    }
    setLoading(false)
  }

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const changeFontSize = (delta) => {
    const next = Math.max(16, Math.min(36, fontSize + delta))
    setFontSize(next); localStorage.setItem('silver_news_fontsize', next)
  }

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '큰글씨 뉴스 — 실버툴즈' : 'Large Print News — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .news-wrap { max-width: 700px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .news-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; background: var(--surface); border-radius: 14px; padding: 12px 16px; }
        .font-controls { display: flex; align-items: center; gap: 10px; }
        .font-btn { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; }
        .font-size-label { font-size: 15px; font-weight: 700; min-width: 36px; text-align: center; }
        .cat-scroll { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 14px; padding-bottom: 4px; }
        .cat-scroll::-webkit-scrollbar { height: 0; }
        .cat-btn { padding: 10px 18px; border-radius: 99px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all .2s; }
        .cat-btn.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .news-card { background: var(--surface); border-radius: 16px; padding: 20px; margin-bottom: 12px; border: 2px solid var(--border); cursor: pointer; transition: all .2s; }
        .news-card:hover { border-color: ${ACCENT}; }
        .news-category { display: inline-block; font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: ${ACCENT}22; color: ${ACCENT}; margin-bottom: 8px; }
        .news-title { font-weight: 800; line-height: 1.5; margin-bottom: 8px; }
        .news-summary { color: var(--text2); line-height: 1.8; }
        .portal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 20px; }
        .portal-btn { padding: 14px 8px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface); text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: var(--text); cursor: pointer; transition: all .2s; }
        .portal-btn:hover { border-color: ${ACCENT}; }
        .loading { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 16px; color: var(--text2); }
        .spinner { width: 36px; height: 36px; border: 4px solid var(--border); border-top-color: ${ACCENT}; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .news-detail { background: var(--surface); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .back-btn { padding: 12px 20px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 14px; }
        .divider { height: 1px; background: var(--border); margin: 20px 0; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="news-wrap">

        {/* 글씨 크기 / 새로고침 컨트롤 */}
        <div className="news-controls">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>
            🔤 {lang === 'ko' ? '글씨 크기' : 'Font Size'}
          </div>
          <div className="font-controls">
            <button className="font-btn" onClick={() => changeFontSize(-2)}>－</button>
            <span className="font-size-label">{fontSize}</span>
            <button className="font-btn" onClick={() => changeFontSize(+2)}>＋</button>
          </div>
          <button onClick={() => fetchNews(category)} style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${ACCENT}`, background: ACCENT + '22', color: ACCENT, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🔄 {lang === 'ko' ? '새로고침' : 'Refresh'}
          </button>
        </div>

        {/* 카테고리 */}
        <div className="cat-scroll">
          {NEWS_SOURCES.map((src, i) => (
            <button key={i} className={`cat-btn${category === i ? ' active' : ''}`} onClick={() => { setCategory(i); fetchNews(i) }}>
              {lang === 'ko' ? src.ko : src.en}
            </button>
          ))}
        </div>

        {/* 뉴스 목록 */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <div style={{ fontSize: 16 }}>{lang === 'ko' ? '뉴스를 불러오는 중...' : 'Loading news...'}</div>
          </div>
        ) : selectedNews ? (
          <>
            <button className="back-btn" onClick={() => setSelectedNews(null)}>← {lang === 'ko' ? '목록으로' : 'Back'}</button>
            <div className="news-detail">
              <div className="news-category">{selectedNews.category}</div>
              <div className="news-title" style={{ fontSize: fontSize + 4 }}>{selectedNews.title}</div>
              <div className="news-summary" style={{ fontSize: fontSize }}>{selectedNews.summary}</div>
              {selectedNews.url && (
                <a href={selectedNews.url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', borderRadius: 10, background: ACCENT, color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
                  🔗 {lang === 'ko' ? '원문 보기' : 'Read Original'}
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            {news.map((item, i) => (
              <div key={i} className="news-card" onClick={() => setSelectedNews(item)}>
                <div className="news-category">{item.category}</div>
                <div className="news-title" style={{ fontSize: fontSize }}>{item.title}</div>
                <div className="news-summary" style={{ fontSize: fontSize - 2 }}>
                  {item.summary?.slice(0, 80)}...
                </div>
              </div>
            ))}

            <div className="divider" />

            {/* 뉴스 포털 바로가기 */}
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
              📱 {lang === 'ko' ? '뉴스 포털 바로가기' : 'News Portals'}
            </div>
            <div className="portal-grid">
              {NEWS_PORTALS.map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="portal-btn"
                  style={{ '--portal-color': p.color }}>
                  <span style={{ fontSize: 24 }}>{p.icon}</span>
                  <span>{p.name}</span>
                </a>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
