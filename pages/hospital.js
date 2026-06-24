import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#3b82f6'

const CATEGORIES = [
  { ko: '전체', en: 'All', icon: '🏥', query: '병원' },
  { ko: '내과', en: 'Internal', icon: '🩺', query: '내과' },
  { ko: '정형외과', en: 'Ortho', icon: '🦴', query: '정형외과' },
  { ko: '안과', en: 'Eye', icon: '👁', query: '안과' },
  { ko: '치과', en: 'Dental', icon: '🦷', query: '치과' },
  { ko: '이비인후과', en: 'ENT', icon: '👂', query: '이비인후과' },
  { ko: '피부과', en: 'Derma', icon: '🧴', query: '피부과' },
  { ko: '약국', en: 'Pharmacy', icon: '💊', query: '약국' },
]

export default function Hospital() {
  const [lang, setLang] = useState('ko')
  const [category, setCategory] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(false)
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [searched, setSearched] = useState(false)
  const [manualAddr, setManualAddr] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const getLocation = () => {
    setLoading(true)
    setLocationError(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
        searchNearby(pos.coords.latitude, pos.coords.longitude, category)
      },
      () => { setLocationError(true); setLoading(false) }
    )
  }

  const searchNearby = (lat, lng, catIdx) => {
    const cat = CATEGORIES[catIdx]
    const query = cat.query
    // 카카오맵 검색 URL로 이동 (API 키 없이도 동작)
    const url = `https://map.kakao.com/?q=${encodeURIComponent(query)}&map_type=TYPE_MAP&from=roughmap`
    setResults([{ type: 'redirect', url, query, lat, lng }])
    setSearched(true)
  }

  const openKakaoMap = (catIdx, addr) => {
    const cat = CATEGORIES[catIdx]
    let url
    if (addr) {
      url = `https://map.kakao.com/?q=${encodeURIComponent(addr + ' ' + cat.query)}`
    } else if (userLocation) {
      url = `https://map.kakao.com/?q=${encodeURIComponent(cat.query)}&map_type=TYPE_MAP`
    } else {
      url = `https://map.kakao.com/?q=${encodeURIComponent(cat.query)}`
    }
    window.open(url, '_blank')
  }

  const openNaverMap = (catIdx, addr) => {
    const cat = CATEGORIES[catIdx]
    const q = addr ? `${addr} ${cat.query}` : cat.query
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(q)}`, '_blank')
  }

  const EMERGENCY_NUMS = [
    { ko: '119 응급·소방', en: '119 Emergency', num: '119', color: '#ef4444' },
    { ko: '129 보건복지콜', en: '129 Welfare', num: '129', color: '#10b981' },
    { ko: '1339 응급의료', en: '1339 Medical', num: '1339', color: '#f59e0b' },
    { ko: '120 다산콜', en: '120 Info', num: '120', color: '#8b5cf6' },
  ]

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '병원 찾기 — 실버툴즈' : 'Hospital Finder — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .hosp-wrap { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .section-title { font-size: 18px; font-weight: 800; margin-bottom: 12px; color: var(--text); }
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
        .cat-btn { padding: 12px 6px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; transition: all .2s; }
        .cat-btn .cat-icon { font-size: 22px; display: block; margin-bottom: 4px; }
        .cat-btn.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .map-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .map-btn { padding: 16px; border-radius: 14px; border: none; font-size: 17px; font-weight: 800; cursor: pointer; transition: all .15s; }
        .map-btn-kakao { background: #FEE500; color: #000; }
        .map-btn-naver { background: #03C75A; color: #fff; }
        .location-btn { width: 100%; padding: 16px; border-radius: 14px; border: 2px solid ${ACCENT}; background: ${ACCENT}22; color: ${ACCENT}; font-size: 17px; font-weight: 800; cursor: pointer; margin-bottom: 12px; }
        .addr-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .addr-input { flex: 1; padding: 12px 14px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 16px; outline: none; }
        .addr-input:focus { border-color: ${ACCENT}; }
        .addr-btn { padding: 12px 18px; border-radius: 10px; border: none; background: ${ACCENT}; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .emergency-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .emergency-btn { padding: 16px; border-radius: 14px; border: none; font-size: 20px; font-weight: 900; cursor: pointer; text-align: center; text-decoration: none; display: block; transition: transform .1s; }
        .emergency-btn:active { transform: scale(0.97); }
        .divider { height: 1px; background: var(--border); margin: 20px 0; }
        .info-box { background: var(--surface); border-radius: 14px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--border); font-size: 15px; line-height: 1.7; color: var(--text2); }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="hosp-wrap">

        {/* 진료과목 선택 */}
        <div className="section-title">🏥 {lang === 'ko' ? '진료과목 선택' : 'Select Category'}</div>
        <div className="cat-grid">
          {CATEGORIES.map((cat, i) => (
            <button key={i} className={`cat-btn${category === i ? ' active' : ''}`} onClick={() => setCategory(i)}>
              <span className="cat-icon">{cat.icon}</span>
              {lang === 'ko' ? cat.ko : cat.en}
            </button>
          ))}
        </div>

        {/* 주소 직접 입력 */}
        <div className="section-title">📍 {lang === 'ko' ? '주소로 검색' : 'Search by Address'}</div>
        <div className="addr-row">
          <input
            className="addr-input"
            value={manualAddr}
            onChange={e => setManualAddr(e.target.value)}
            placeholder={lang === 'ko' ? '동네 이름 입력 (예: 강남구)' : 'Enter neighborhood'}
            onKeyDown={e => { if (e.key === 'Enter') openKakaoMap(category, manualAddr) }}
          />
          <button className="addr-btn" onClick={() => openKakaoMap(category, manualAddr)}>
            {lang === 'ko' ? '검색' : 'Search'}
          </button>
        </div>

        {/* 지도 앱으로 열기 */}
        <div className="section-title">🗺 {lang === 'ko' ? '지도 앱으로 찾기' : 'Open in Map App'}</div>
        <div className="map-btns">
          <button className="map-btn map-btn-kakao" onClick={() => openKakaoMap(category, manualAddr)}>
            🟡 {lang === 'ko' ? '카카오맵' : 'Kakao Map'}
          </button>
          <button className="map-btn map-btn-naver" onClick={() => openNaverMap(category, manualAddr)}>
            🟢 {lang === 'ko' ? '네이버지도' : 'Naver Map'}
          </button>
        </div>

        {/* 내 위치로 찾기 */}
        <button className="location-btn" onClick={getLocation} disabled={loading}>
          {loading ? (lang === 'ko' ? '위치 확인 중...' : 'Getting location...') : `📍 ${lang === 'ko' ? '내 위치에서 찾기' : 'Find Near Me'}`}
        </button>
        {locationError && (
          <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
            {lang === 'ko' ? '위치 권한을 허용해 주세요' : 'Please allow location access'}
          </div>
        )}
        {userLocation && (
          <div style={{ color: '#10b981', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
            ✅ {lang === 'ko' ? '위치 확인됨 — 위의 지도 앱 버튼을 눌러주세요' : 'Location found — tap a map button above'}
          </div>
        )}

        <div className="divider" />

        {/* 긴급 전화번호 */}
        <div className="section-title">🚨 {lang === 'ko' ? '긴급 전화번호' : 'Emergency Numbers'}</div>
        <div className="emergency-grid">
          {EMERGENCY_NUMS.map(e => (
            <a key={e.num} href={`tel:${e.num}`} className="emergency-btn" style={{ background: e.color + '22', color: e.color, border: `2px solid ${e.color}44` }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{e.num}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{lang === 'ko' ? e.ko : e.en}</div>
            </a>
          ))}
        </div>

        <div className="divider" />

        {/* 이용 안내 */}
        <div className="info-box">
          {lang === 'ko' ? (
            <>
              💡 <strong>이용 방법</strong><br />
              1. 진료과목을 선택하세요<br />
              2. 동네 이름을 입력하거나 내 위치로 검색하세요<br />
              3. 카카오맵 또는 네이버지도 버튼을 누르면 가까운 병원·약국이 표시됩니다
            </>
          ) : (
            <>
              💡 <strong>How to use</strong><br />
              1. Select a medical category<br />
              2. Enter your neighborhood or use your current location<br />
              3. Tap Kakao Map or Naver Map to see nearby hospitals
            </>
          )}
        </div>
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
