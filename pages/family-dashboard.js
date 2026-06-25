import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getUser, authFetch } from '../lib/useAuth'

const ACCENT = '#10b981'

export default function FamilyDashboard() {
  const router = useRouter()
  const [lang, setLang] = useState('ko')
  const [user, setUser] = useState(null)
  const [seniors, setSeniors] = useState([])
  const [selectedSenior, setSelectedSenior] = useState(null)
  const [tab, setTab] = useState(0)
  const [inviteInput, setInviteInput] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [medData, setMedData] = useState({ meds: [], logs: [] })
  const [healthData, setHealthData] = useState([])
  const [healthType, setHealthType] = useState('bp')
  const [sosData, setSosData] = useState({ contacts: [], myInfo: {} })
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved) setLang(saved)
    const u = getUser()
    if (!u) { router.push('/login'); return }
    setUser(u)
    loadLinkedSeniors()
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const loadLinkedSeniors = async () => {
    const res = await authFetch('/api/silver/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'get_linked_seniors' })
    })
    if (!res) return
    const data = await res.json()
    setSeniors(data.seniors || [])
    if (data.seniors?.length > 0) selectSenior(data.seniors[0])
  }

  const selectSenior = (senior) => {
    setSelectedSenior(senior)
    loadMedData(senior.id)
  }

  const loadMedData = async (senior_id) => {
    const res = await authFetch(`/api/silver/medicine?view_as=${senior_id}`)
    if (!res) return
    const data = await res.json()
    setMedData(data)
  }

  const loadHealthData = async (senior_id, type) => {
    const res = await authFetch(`/api/silver/health?view_as=${senior_id}&type=${type}`)
    if (!res) return
    const data = await res.json()
    setHealthData(data.records || [])
  }

  const loadSosData = async (senior_id) => {
    const res = await authFetch(`/api/silver/health?view_as=${senior_id}`)
    if (!res) return
    const data = await res.json()
    setSosData(data)
  }

  useEffect(() => {
    if (!selectedSenior) return
    if (tab === 0) loadMedData(selectedSenior.id)
    if (tab === 1) loadHealthData(selectedSenior.id, healthType)
    if (tab === 2) loadSosData(selectedSenior.id)
  }, [tab, selectedSenior, healthType])

  const handleLink = async () => {
    if (!inviteInput.trim()) return
    setLinkLoading(true); setLinkError('')
    const res = await authFetch('/api/silver/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'link_family', invite_code: inviteInput.trim() })
    })
    if (!res) return
    const data = await res.json()
    if (!res.ok) { setLinkError(data.error); setLinkLoading(false); return }
    setInviteInput('')
    loadLinkedSeniors()
    setLinkLoading(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayDay = new Date().getDay()
  const todayMeds = medData.meds.filter(m => m.days.includes(todayDay))
  const isTaken = (medId, time) => medData.logs.some(l => l.med_id === medId && l.date === today && l.time === time && l.taken)
  const totalDoses = todayMeds.reduce((a, m) => a + m.times.length, 0)
  const takenDoses = todayMeds.reduce((a, m) => a + m.times.filter(t => isTaken(m.id, t)).length, 0)

  const HEALTH_TYPES = [
    { key: 'bp', ko: '혈압', en: 'BP', icon: '❤️', unit: 'mmHg' },
    { key: 'sugar', ko: '혈당', en: 'Glucose', icon: '🩸', unit: 'mg/dL' },
    { key: 'weight', ko: '체중', en: 'Weight', icon: '⚖️', unit: 'kg' },
    { key: 'temp', ko: '체온', en: 'Temp', icon: '🌡️', unit: '°C' },
  ]

  return (
    <>
      <Head>
        <link rel="canonical" href="https://www.silvertools.kr/family-dashboard/" />
        <title>{lang === 'ko' ? '가족 대시보드 — 실버툴즈' : 'Family Dashboard — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`
        :root { --accent: ${ACCENT}; }
        .dash-wrap { max-width: 700px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .invite-row { display: flex; gap: 8px; margin-bottom: 20px; }
        .invite-input { flex: 1; padding: 12px 16px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 18px; font-weight: 700; letter-spacing: 4px; outline: none; text-transform: uppercase; }
        .invite-input:focus { border-color: ${ACCENT}; }
        .invite-btn { padding: 12px 20px; border-radius: 10px; background: ${ACCENT}; color: #fff; border: none; font-size: 15px; font-weight: 700; cursor: pointer; }
        .senior-selector { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
        .senior-chip { padding: 10px 18px; border-radius: 99px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; }
        .senior-chip.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .dash-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .dash-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; text-align: center; }
        .dash-tab.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .stat-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .stat-box { flex: 1; background: var(--surface); border-radius: 14px; padding: 16px; text-align: center; }
        .stat-num { font-size: 32px; font-weight: 900; }
        .stat-label { font-size: 13px; color: var(--text2); margin-top: 4px; }
        .med-card { background: var(--surface); border-radius: 14px; padding: 16px; margin-bottom: 10px; }
        .time-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .time-badge { padding: 6px 14px; border-radius: 99px; font-size: 15px; font-weight: 700; border: 2px solid; }
        .taken { background: #10b98122; border-color: #10b981; color: #10b981; }
        .not-taken { background: #ef444422; border-color: #ef4444; color: #ef4444; }
        .alert-box { background: #f59e0b22; border: 2px solid #f59e0b44; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; font-size: 15px; color: #f59e0b; font-weight: 700; }
        .health-type-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 14px; }
        .health-type-btn { padding: 10px 4px; border-radius: 10px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; }
        .health-type-btn.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .rec-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .rec-val { font-size: 20px; font-weight: 900; flex: 1; color: ${ACCENT}; }
        .rec-time { font-size: 13px; color: var(--text2); }
        .contact-row { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--surface); border-radius: 12px; margin-bottom: 8px; }
        .call-btn { padding: 10px 16px; border-radius: 10px; background: #10b981; color: #fff; text-decoration: none; font-size: 16px; font-weight: 700; }
        .myinfo-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 16px; }
        .screen-share-btn { width: 100%; padding: 16px; border-radius: 14px; background: #8b5cf6; color: #fff; border: none; font-size: 18px; font-weight: 800; cursor: pointer; margin-bottom: 12px; }
        .empty { text-align: center; padding: 40px 20px; color: var(--text2); font-size: 16px; }
        .no-senior { background: var(--surface); border-radius: 16px; padding: 32px; text-align: center; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />
      <main className="dash-wrap">
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>
          👨‍👩‍👧 {lang === 'ko' ? '가족 대시보드' : 'Family Dashboard'}
        </div>

        <button className="screen-share-btn" onClick={() => router.push('/screen-view')}>
          📱 {lang === 'ko' ? '부모님 화면 보기 (화면공유)' : 'View Parent Screen'}
        </button>

        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
          🔗 {lang === 'ko' ? '초대코드로 부모님 연동' : 'Link with Invite Code'}
        </div>
        <div className="invite-row">
          <input className="invite-input" value={inviteInput}
            onChange={e => setInviteInput(e.target.value.toUpperCase())}
            placeholder="ABC123" maxLength={6} />
          <button className="invite-btn" onClick={handleLink} disabled={linkLoading}>
            {linkLoading ? '...' : (lang === 'ko' ? '연동' : 'Link')}
          </button>
        </div>
        {linkError && <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{linkError}</div>}

        {seniors.length > 0 && (
          <div className="senior-selector">
            {seniors.map(s => (
              <button key={s.id} className={`senior-chip${selectedSenior?.id === s.id ? ' active' : ''}`}
                onClick={() => selectSenior(s)}>
                {s.name || s.phone}
              </button>
            ))}
          </div>
        )}

        {!selectedSenior ? (
          <div className="no-senior">
            <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {lang === 'ko' ? '연동된 부모님이 없습니다' : 'No linked senior'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>
              {lang === 'ko' ? '부모님께 초대코드를 받아 위에 입력하세요' : 'Ask your parent for their invite code'}
            </div>
          </div>
        ) : (
          <>
            {tab === 0 && totalDoses > 0 && takenDoses < totalDoses && (
              <div className="alert-box">
                ⚠️ {lang === 'ko'
                  ? `${selectedSenior.name}님 오늘 ${totalDoses - takenDoses}회 미복약`
                  : `${selectedSenior.name} missed ${totalDoses - takenDoses} dose(s) today`}
              </div>
            )}
            <div className="dash-tabs">
              {(lang === 'ko' ? ['💊 복약', '🩺 건강', '🆘 SOS'] : ['💊 Meds', '🩺 Health', '🆘 SOS']).map((name, i) => (
                <button key={i} className={`dash-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{name}</button>
              ))}
            </div>

            {tab === 0 && (
              <>
                <div className="stat-row">
                  <div className="stat-box"><div className="stat-num">{totalDoses}</div><div className="stat-label">{lang === 'ko' ? '예정' : 'Scheduled'}</div></div>
                  <div className="stat-box"><div className="stat-num" style={{ color: '#10b981' }}>{takenDoses}</div><div className="stat-label">{lang === 'ko' ? '완료' : 'Taken'}</div></div>
                  <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{totalDoses - takenDoses}</div><div className="stat-label">{lang === 'ko' ? '미복용' : 'Missed'}</div></div>
                </div>
                {todayMeds.length === 0 ? (
                  <div className="empty"><div style={{ fontSize: 40 }}>💊</div><div style={{ marginTop: 10 }}>{lang === 'ko' ? '오늘 복약 없음' : 'No meds today'}</div></div>
                ) : todayMeds.map(med => (
                  <div key={med.id} className="med-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: med.color }} />
                      <span style={{ fontSize: 18, fontWeight: 800 }}>{med.name}</span>
                      {med.dose && <span style={{ fontSize: 13, color: 'var(--text2)' }}>{med.dose}</span>}
                    </div>
                    <div className="time-row">
                      {med.times.map((time, i) => (
                        <span key={i} className={`time-badge ${isTaken(med.id, time) ? 'taken' : 'not-taken'}`}>
                          {isTaken(med.id, time) ? '✅' : '❌'} {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 1 && (
              <>
                <div className="health-type-row">
                  {HEALTH_TYPES.map(ht => (
                    <button key={ht.key} className={`health-type-btn${healthType === ht.key ? ' active' : ''}`} onClick={() => setHealthType(ht.key)}>
                      <div style={{ fontSize: 18 }}>{ht.icon}</div><div>{lang === 'ko' ? ht.ko : ht.en}</div>
                    </button>
                  ))}
                </div>
                {healthData.length === 0 ? (
                  <div className="empty"><div style={{ fontSize: 40 }}>🩺</div><div style={{ marginTop: 10 }}>{lang === 'ko' ? '기록 없음' : 'No records'}</div></div>
                ) : healthData.slice(0, 20).map(rec => (
                  <div key={rec.id} className="rec-row">
                    <div className="rec-val">{rec.v1}{rec.v2 ? `/${rec.v2}` : ''} <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>{HEALTH_TYPES.find(h => h.key === healthType)?.unit}</span></div>
                    <div className="rec-time">{rec.recorded_at?.slice(0, 16).replace('T', ' ')}</div>
                  </div>
                ))}
              </>
            )}

            {tab === 2 && (
              <>
                {sosData.contacts.map((c, i) => (
                  <div key={i} className="contact-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{c.name} {c.relation && <span style={{ fontSize: 13, color: 'var(--text2)' }}>({c.relation})</span>}</div>
                      <div style={{ fontSize: 15, color: ACCENT, fontWeight: 700 }}>{c.phone}</div>
                    </div>
                    <a href={`tel:${c.phone}`} className="call-btn">📞</a>
                  </div>
                ))}
                {sosData.contacts.length === 0 && <div className="empty"><div style={{ fontSize: 40 }}>📞</div><div style={{ marginTop: 10 }}>{lang === 'ko' ? '등록된 연락처 없음' : 'No contacts'}</div></div>}
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 16, marginTop: 16 }}>
                  {[
                    { key: 'name', ko: '이름', en: 'Name' },
                    { key: 'birth', ko: '생년월일', en: 'Date of Birth' },
                    { key: 'blood_type', ko: '혈액형', en: 'Blood Type' },
                    { key: 'disease', ko: '기저질환', en: 'Conditions' },
                    { key: 'allergy', ko: '알레르기', en: 'Allergies' },
                  ].map(f => (
                    <div key={f.key} className="myinfo-row">
                      <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{lang === 'ko' ? f.ko : f.en}</span>
                      <span style={{ fontWeight: 700 }}>{sosData.myInfo[f.key] || (lang === 'ko' ? '미입력' : 'Not set')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
