import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#ec4899'

const TYPES = [
  { key: 'bp', ko: '혈압', en: 'Blood Pressure', icon: '❤️', unit: 'mmHg', color: '#ef4444', fields: ['수축기', '이완기'] },
  { key: 'sugar', ko: '혈당', en: 'Blood Glucose', icon: '🩸', unit: 'mg/dL', color: '#f59e0b', fields: ['혈당'] },
  { key: 'weight', ko: '체중', en: 'Weight', icon: '⚖️', unit: 'kg', color: '#10b981', fields: ['체중'] },
  { key: 'temp', ko: '체온', en: 'Temperature', icon: '🌡️', unit: '°C', color: '#8b5cf6', fields: ['체온'] },
]

// 정상 범위
const NORMAL = {
  bp: { sys: [90, 120], dia: [60, 80] },
  sugar: { val: [70, 140] },
  weight: null,
  temp: { val: [36.1, 37.2] },
}

function getBPStatus(sys, dia) {
  if (sys < 90 || dia < 60) return { ko: '저혈압', en: 'Low', color: '#3b82f6' }
  if (sys <= 120 && dia <= 80) return { ko: '정상', en: 'Normal', color: '#10b981' }
  if (sys <= 139 || dia <= 89) return { ko: '주의', en: 'Elevated', color: '#f59e0b' }
  return { ko: '고혈압', en: 'High', color: '#ef4444' }
}

function getSugarStatus(val) {
  if (val < 70) return { ko: '저혈당', en: 'Low', color: '#3b82f6' }
  if (val <= 140) return { ko: '정상', en: 'Normal', color: '#10b981' }
  if (val <= 199) return { ko: '주의', en: 'Elevated', color: '#f59e0b' }
  return { ko: '고혈당', en: 'High', color: '#ef4444' }
}

function getTempStatus(val) {
  if (val < 36.1) return { ko: '저체온', en: 'Low', color: '#3b82f6' }
  if (val <= 37.2) return { ko: '정상', en: 'Normal', color: '#10b981' }
  if (val <= 38.0) return { ko: '미열', en: 'Mild fever', color: '#f59e0b' }
  return { ko: '발열', en: 'Fever', color: '#ef4444' }
}

export default function HealthRecord() {
  const [lang, setLang] = useState('ko')
  const [tab, setTab] = useState(0) // 0:혈압 1:혈당 2:체중 3:체온
  const [records, setRecords] = useState({ bp: [], sugar: [], weight: [], temp: [] })
  const [form, setForm] = useState({ v1: '', v2: '', memo: '', datetime: new Date().toISOString().slice(0, 16) })
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const t = TYPES[tab]

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    const r = localStorage.getItem('silver_health_records')
    if (r) setRecords(JSON.parse(r))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const saveRecords = (data) => { setRecords(data); localStorage.setItem('silver_health_records', JSON.stringify(data)) }

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const handleAdd = () => {
    if (!form.v1) return
    const entry = { v1: Number(form.v1), v2: form.v2 ? Number(form.v2) : null, memo: form.memo, datetime: form.datetime, id: Date.now() }
    const next = { ...records, [t.key]: [entry, ...records[t.key]].slice(0, 100) }
    saveRecords(next)
    setForm(f => ({ ...f, v1: '', v2: '', memo: '' }))
  }

  const handleDelete = (id) => {
    const next = { ...records, [t.key]: records[t.key].filter(r => r.id !== id) }
    saveRecords(next)
  }

  const getStatus = (rec) => {
    if (t.key === 'bp') return getBPStatus(rec.v1, rec.v2)
    if (t.key === 'sugar') return getSugarStatus(rec.v1)
    if (t.key === 'temp') return getTempStatus(rec.v1)
    return null
  }

  const list = records[t.key] || []

  // 최근 7개 평균
  const recent = list.slice(0, 7)
  const avg = recent.length > 0 ? (recent.reduce((a, r) => a + r.v1, 0) / recent.length).toFixed(1) : '-'

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '건강 기록 — 실버툴즈' : 'Health Record — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .hr-wrap { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .hr-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
        .hr-tab { padding: 10px 4px; border-radius: 12px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; transition: all .2s; }
        .hr-tab.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .input-card { background: var(--surface); border-radius: 16px; padding: 18px; margin-bottom: 16px; border: 2px solid var(--border); }
        .input-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
        .input-field { flex: 1; padding: 14px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 20px; text-align: center; outline: none; font-weight: 700; }
        .input-field:focus { border-color: ${ACCENT}; }
        .input-unit { font-size: 14px; color: var(--text2); font-weight: 600; min-width: 40px; }
        .add-btn { width: 100%; padding: 14px; border-radius: 12px; background: ${ACCENT}; color: #fff; border: none; font-size: 17px; font-weight: 800; cursor: pointer; }
        .stat-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .stat-box { flex: 1; background: var(--surface); border-radius: 12px; padding: 12px; text-align: center; }
        .stat-num { font-size: 24px; font-weight: 900; }
        .stat-label { font-size: 12px; color: var(--text2); margin-top: 2px; }
        .rec-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); gap: 10px; }
        .rec-val { font-size: 22px; font-weight: 900; flex: 1; }
        .rec-time { font-size: 13px; color: var(--text2); }
        .rec-status { font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 99px; }
        .del-btn { background: none; border: none; color: #ef444466; font-size: 18px; cursor: pointer; padding: 4px 8px; }
        .del-btn:hover { color: #ef4444; }
        .memo-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 15px; outline: none; margin-bottom: 10px; }
        .datetime-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 15px; outline: none; margin-bottom: 10px; }
        .ref-box { background: var(--surface); border-radius: 14px; padding: 14px; margin-top: 16px; font-size: 14px; color: var(--text2); line-height: 1.8; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="hr-wrap">
        <div className="hr-tabs">
          {TYPES.map((type, i) => (
            <button key={i} className={`hr-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
              <div style={{ fontSize: 20 }}>{type.icon}</div>
              <div>{lang === 'ko' ? type.ko : type.en}</div>
            </button>
          ))}
        </div>

        {/* 통계 */}
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-num" style={{ color: t.color }}>{list.length}</div>
            <div className="stat-label">{lang === 'ko' ? '기록 수' : 'Records'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" style={{ color: t.color }}>{avg}</div>
            <div className="stat-label">{lang === 'ko' ? '최근 7회 평균' : '7-record avg'}</div>
          </div>
          {list.length > 0 && (
            <div className="stat-box">
              <div className="stat-num" style={{ fontSize: 18, color: t.color }}>{list[0].v1}{t.key === 'bp' && list[0].v2 ? `/${list[0].v2}` : ''}</div>
              <div className="stat-label">{lang === 'ko' ? '최근 측정' : 'Latest'}</div>
            </div>
          )}
        </div>

        {/* 입력 */}
        <div className="input-card">
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            {t.icon} {lang === 'ko' ? `${t.ko} 입력` : `Enter ${t.en}`}
          </div>
          <div className="input-row">
            <input type="number" className="input-field" value={form.v1} onChange={e => setForm(f => ({...f, v1: e.target.value}))}
              placeholder={t.key === 'bp' ? '120' : t.key === 'sugar' ? '100' : t.key === 'weight' ? '65' : '36.5'} />
            {t.key === 'bp' && (
              <>
                <span className="input-unit" style={{ textAlign: 'center' }}>/</span>
                <input type="number" className="input-field" value={form.v2} onChange={e => setForm(f => ({...f, v2: e.target.value}))} placeholder="80" />
              </>
            )}
            <span className="input-unit">{t.unit}</span>
          </div>
          <input type="datetime-local" className="datetime-input" value={form.datetime} onChange={e => setForm(f => ({...f, datetime: e.target.value}))} />
          <input className="memo-input" value={form.memo} onChange={e => setForm(f => ({...f, memo: e.target.value}))}
            placeholder={lang === 'ko' ? '메모 (선택)' : 'Note (optional)'} />
          <button className="add-btn" onClick={handleAdd}>
            + {lang === 'ko' ? '기록하기' : 'Add Record'}
          </button>
        </div>

        {/* 기록 목록 */}
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
          📋 {lang === 'ko' ? '기록 목록' : 'History'}
        </div>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text2)', fontSize: 16 }}>
            <div style={{ fontSize: 40 }}>{t.icon}</div>
            <div style={{ marginTop: 10 }}>{lang === 'ko' ? '기록이 없습니다' : 'No records yet'}</div>
          </div>
        ) : (
          list.slice(0, 30).map(rec => {
            const status = getStatus(rec)
            return (
              <div key={rec.id} className="rec-row">
                <div style={{ flex: 1 }}>
                  <div className="rec-val" style={{ color: t.color }}>
                    {rec.v1}{t.key === 'bp' && rec.v2 ? `/${rec.v2}` : ''} <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 400 }}>{t.unit}</span>
                  </div>
                  <div className="rec-time">{rec.datetime?.replace('T', ' ')}</div>
                  {rec.memo && <div style={{ fontSize: 13, color: 'var(--text2)' }}>📝 {rec.memo}</div>}
                </div>
                {status && (
                  <div className="rec-status" style={{ background: status.color + '22', color: status.color }}>
                    {lang === 'ko' ? status.ko : status.en}
                  </div>
                )}
                <button className="del-btn" onClick={() => handleDelete(rec.id)}>✕</button>
              </div>
            )
          })
        )}

        {/* 참고 정상 범위 */}
        <div className="ref-box">
          {lang === 'ko' ? (
            <>
              📊 <strong>참고 정상 범위</strong><br />
              {t.key === 'bp' && '혈압: 수축기 90~120 / 이완기 60~80 mmHg'}
              {t.key === 'sugar' && '혈당: 공복 70~100 mg/dL, 식후 2시간 70~140 mg/dL'}
              {t.key === 'weight' && '체중: BMI 18.5~22.9 (정상)'}
              {t.key === 'temp' && '체온: 36.1~37.2°C'}
              <br /><span style={{ fontSize: 12 }}>※ 의료진 상담을 대체하지 않습니다</span>
            </>
          ) : (
            <>
              📊 <strong>Normal Reference Ranges</strong><br />
              {t.key === 'bp' && 'Blood Pressure: Systolic 90~120 / Diastolic 60~80 mmHg'}
              {t.key === 'sugar' && 'Blood Glucose: Fasting 70~100, Post-meal 70~140 mg/dL'}
              {t.key === 'weight' && 'Weight: BMI 18.5~22.9 (Normal)'}
              {t.key === 'temp' && 'Temperature: 36.1~37.2°C'}
              <br /><span style={{ fontSize: 12 }}>※ Does not replace medical consultation</span>
            </>
          )}
        </div>
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
