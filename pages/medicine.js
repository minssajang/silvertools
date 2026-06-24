import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#f59e0b'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_MEDS = []

export default function Medicine() {
  const [lang, setLang] = useState('ko')
  const [meds, setMeds] = useState([])
  const [logs, setLogs] = useState([]) // { medId, date, time, taken }
  const [tab, setTab] = useState(0) // 0: 오늘, 1: 내 약 목록, 2: 기록
  const [showAdd, setShowAdd] = useState(false)
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // 새 약 입력 폼
  const [form, setForm] = useState({
    name: '', dose: '', times: ['08:00'], days: [0,1,2,3,4,5,6], color: ACCENT, memo: '',
  })
  const [editId, setEditId] = useState(null)

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const todayDay = today.getDay()

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    const m = localStorage.getItem('silver_meds')
    const l = localStorage.getItem('silver_med_logs')
    if (m) setMeds(JSON.parse(m))
    if (l) setLogs(JSON.parse(l))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const saveMeds = (data) => { setMeds(data); localStorage.setItem('silver_meds', JSON.stringify(data)) }
  const saveLogs = (data) => { setLogs(data); localStorage.setItem('silver_med_logs', JSON.stringify(data)) }

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  // 오늘 복용 목록 (복용 요일에 해당하는 약)
  const todayMeds = meds.filter(m => m.days.includes(todayDay))

  // 복용 체크
  const isTaken = (medId, time) => logs.some(l => l.medId === medId && l.date === todayStr && l.time === time && l.taken)

  const toggleTaken = (medId, time) => {
    const exists = logs.findIndex(l => l.medId === medId && l.date === todayStr && l.time === time)
    if (exists >= 0) {
      const next = [...logs]
      next[exists] = { ...next[exists], taken: !next[exists].taken }
      saveLogs(next)
    } else {
      saveLogs([...logs, { medId, date: todayStr, time, taken: true }])
    }
  }

  // 약 추가/수정
  const handleSave = () => {
    if (!form.name.trim()) return
    if (editId) {
      saveMeds(meds.map(m => m.id === editId ? { ...form, id: editId } : m))
      setEditId(null)
    } else {
      saveMeds([...meds, { ...form, id: Date.now().toString() }])
    }
    setForm({ name: '', dose: '', times: ['08:00'], days: [0,1,2,3,4,5,6], color: ACCENT, memo: '' })
    setShowAdd(false)
  }

  const handleEdit = (med) => {
    setForm({ name: med.name, dose: med.dose, times: med.times, days: med.days, color: med.color, memo: med.memo || '' })
    setEditId(med.id)
    setShowAdd(true)
  }

  const handleDelete = (id) => {
    if (!confirm(lang === 'ko' ? '삭제할까요?' : 'Delete this medication?')) return
    saveMeds(meds.filter(m => m.id !== id))
  }

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d].sort()
    }))
  }

  const addTime = () => setForm(f => ({ ...f, times: [...f.times, '12:00'] }))
  const removeTime = (i) => setForm(f => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }))
  const updateTime = (i, v) => setForm(f => ({ ...f, times: f.times.map((t, idx) => idx === i ? v : t) }))

  // 최근 7일 기록
  const recentDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })

  const COLORS = ['#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4']

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '복약 관리 — 실버툴즈' : 'Medicine Manager — SilverTools'}</title>
        <meta name="description" content={lang === 'ko' ? '약 복용 시간 알림과 복약 기록을 관리하세요.' : 'Manage medication reminders and history.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .med-wrap { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .med-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .med-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; text-align: center; transition: all .2s; }
        .med-tab.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .med-card { background: var(--surface); border-radius: 16px; padding: 18px; margin-bottom: 12px; border: 2px solid var(--border); }
        .med-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .med-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
        .med-name { font-size: 20px; font-weight: 800; }
        .med-dose { font-size: 14px; color: var(--text2); }
        .time-pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
        .time-pill { padding: 8px 16px; border-radius: 99px; border: 2px solid var(--border); background: var(--surface2); font-size: 16px; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 8px; }
        .time-pill.taken { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .time-pill .check { font-size: 18px; }
        .btn { padding: 12px 20px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; transition: all .15s; }
        .btn-primary { background: ${ACCENT}; color: #fff; width: 100%; margin-top: 8px; font-size: 18px; padding: 16px; }
        .btn-sm { padding: 8px 14px; font-size: 14px; border-radius: 8px; }
        .btn-ghost { background: var(--surface2); color: var(--text); }
        .btn-danger { background: #ef444422; color: #ef4444; }
        .form-panel { background: var(--surface); border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 2px solid ${ACCENT}; }
        .form-label { font-size: 14px; font-weight: 700; color: var(--text2); margin-bottom: 6px; margin-top: 14px; display: block; }
        .form-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 16px; outline: none; }
        .form-input:focus { border-color: ${ACCENT}; }
        .day-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .day-btn { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; }
        .day-btn.on { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
        .color-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .color-btn { width: 32px; height: 32px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: transform .15s; }
        .color-btn.on { border-color: var(--text); transform: scale(1.15); }
        .empty { text-align: center; padding: 40px 20px; color: var(--text2); font-size: 16px; }
        .log-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 15px; }
        .log-date { font-weight: 700; color: ${ACCENT}; margin: 14px 0 6px; font-size: 15px; }
        .stat-row { display: flex; gap: 12px; margin-bottom: 16px; }
        .stat-box { flex: 1; background: var(--surface); border-radius: 12px; padding: 14px; text-align: center; }
        .stat-num { font-size: 28px; font-weight: 900; color: ${ACCENT}; }
        .stat-label { font-size: 13px; color: var(--text2); margin-top: 4px; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="med-wrap">
        <div className="med-tabs">
          {(lang === 'ko' ? ['오늘 복약', '내 약 목록', '복약 기록'] : ['Today', 'My Meds', 'History']).map((name, i) => (
            <button key={i} className={`med-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{name}</button>
          ))}
        </div>

        {/* ===== 탭0: 오늘 복약 ===== */}
        {tab === 0 && (
          <>
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-num">{todayMeds.length}</div>
                <div className="stat-label">{lang === 'ko' ? '오늘 복용할 약' : 'Meds today'}</div>
              </div>
              <div className="stat-box">
                <div className="stat-num" style={{ color: '#10b981' }}>
                  {todayMeds.reduce((acc, m) => acc + m.times.filter(t => isTaken(m.id, t)).length, 0)}
                </div>
                <div className="stat-label">{lang === 'ko' ? '복용 완료' : 'Taken'}</div>
              </div>
              <div className="stat-box">
                <div className="stat-num" style={{ color: '#ef4444' }}>
                  {todayMeds.reduce((acc, m) => acc + m.times.filter(t => !isTaken(m.id, t)).length, 0)}
                </div>
                <div className="stat-label">{lang === 'ko' ? '미복용' : 'Remaining'}</div>
              </div>
            </div>

            {todayMeds.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize: 48 }}>💊</div>
                <div style={{ marginTop: 12 }}>{lang === 'ko' ? '오늘 복용할 약이 없습니다' : 'No medications for today'}</div>
                <div style={{ fontSize: 14, marginTop: 8, color: 'var(--text2)' }}>
                  {lang === 'ko' ? '내 약 목록 탭에서 약을 추가하세요' : 'Add medications in the My Meds tab'}
                </div>
              </div>
            ) : (
              todayMeds.map(med => (
                <div key={med.id} className="med-card">
                  <div className="med-card-header">
                    <div className="med-dot" style={{ background: med.color }} />
                    <div>
                      <div className="med-name">{med.name}</div>
                      {med.dose && <div className="med-dose">{med.dose}</div>}
                    </div>
                  </div>
                  <div className="time-pills">
                    {med.times.map((time, i) => (
                      <button key={i} className={`time-pill${isTaken(med.id, time) ? ' taken' : ''}`} onClick={() => toggleTaken(med.id, time)}>
                        <span className="check">{isTaken(med.id, time) ? '✅' : '⬜'}</span>
                        <span>{time}</span>
                      </button>
                    ))}
                  </div>
                  {med.memo && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>📝 {med.memo}</div>}
                </div>
              ))
            )}
          </>
        )}

        {/* ===== 탭1: 내 약 목록 ===== */}
        {tab === 1 && (
          <>
            {showAdd && (
              <div className="form-panel">
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                  {editId ? (lang === 'ko' ? '약 수정' : 'Edit Medication') : (lang === 'ko' ? '새 약 추가' : 'Add Medication')}
                </div>
                <label className="form-label">{lang === 'ko' ? '약 이름 *' : 'Medication Name *'}</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder={lang === 'ko' ? '예: 혈압약, 당뇨약' : 'e.g. Blood pressure pill'} />
                <label className="form-label">{lang === 'ko' ? '용량/메모' : 'Dose / Note'}</label>
                <input className="form-input" value={form.dose} onChange={e => setForm(f => ({...f, dose: e.target.value}))} placeholder={lang === 'ko' ? '예: 1정, 식후 30분' : 'e.g. 1 tablet after meal'} />
                <label className="form-label">{lang === 'ko' ? '복용 시간' : 'Times'}</label>
                {form.times.map((time, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="time" className="form-input" style={{ flex: 1 }} value={time} onChange={e => updateTime(i, e.target.value)} />
                    {form.times.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => removeTime(i)}>✕</button>}
                  </div>
                ))}
                <button className="btn btn-sm btn-ghost" onClick={addTime} style={{ marginBottom: 8 }}>+ {lang === 'ko' ? '시간 추가' : 'Add time'}</button>
                <label className="form-label">{lang === 'ko' ? '복용 요일' : 'Days'}</label>
                <div className="day-btns">
                  {(lang === 'ko' ? DAYS : DAYS_EN).map((d, i) => (
                    <button key={i} className={`day-btn${form.days.includes(i) ? ' on' : ''}`} onClick={() => toggleDay(i)}>{d}</button>
                  ))}
                </div>
                <label className="form-label">{lang === 'ko' ? '색상' : 'Color'}</label>
                <div className="color-btns">
                  {COLORS.map(c => (
                    <button key={c} className={`color-btn${form.color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setForm(f => ({...f, color: c}))} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAdd(false); setEditId(null) }}>
                    {lang === 'ko' ? '취소' : 'Cancel'}
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2, marginTop: 0, fontSize: 16, padding: 12 }} onClick={handleSave}>
                    {lang === 'ko' ? '저장' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {!showAdd && (
              <button className="btn btn-primary" onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', dose: '', times: ['08:00'], days: [0,1,2,3,4,5,6], color: ACCENT, memo: '' }) }}>
                + {lang === 'ko' ? '새 약 추가' : 'Add Medication'}
              </button>
            )}

            <div style={{ marginTop: 16 }}>
              {meds.length === 0 ? (
                <div className="empty"><div style={{ fontSize: 48 }}>💊</div><div style={{ marginTop: 12 }}>{lang === 'ko' ? '등록된 약이 없습니다' : 'No medications registered'}</div></div>
              ) : (
                meds.map(med => (
                  <div key={med.id} className="med-card">
                    <div className="med-card-header">
                      <div className="med-dot" style={{ background: med.color }} />
                      <div style={{ flex: 1 }}>
                        <div className="med-name">{med.name}</div>
                        {med.dose && <div className="med-dose">{med.dose}</div>}
                      </div>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(med)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(med.id)}>🗑️</button>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text2)' }}>
                      🕐 {med.times.join(', ')} &nbsp;|&nbsp;
                      📅 {med.days.map(d => (lang === 'ko' ? DAYS : DAYS_EN)[d]).join(' ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ===== 탭2: 복약 기록 ===== */}
        {tab === 2 && (
          <>
            {recentDates.map(date => {
              const dayLogs = logs.filter(l => l.date === date)
              if (dayLogs.length === 0) return null
              return (
                <div key={date}>
                  <div className="log-date">{date} ({(lang === 'ko' ? DAYS : DAYS_EN)[new Date(date + 'T00:00:00').getDay()]})</div>
                  {dayLogs.map((log, i) => {
                    const med = meds.find(m => m.id === log.medId)
                    return (
                      <div key={i} className="log-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {med && <div className="med-dot" style={{ background: med.color }} />}
                          <span>{med?.name || (lang === 'ko' ? '삭제된 약' : 'Deleted')}</span>
                          <span style={{ color: 'var(--text2)', fontSize: 14 }}>{log.time}</span>
                        </div>
                        <span style={{ color: log.taken ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {log.taken ? (lang === 'ko' ? '✅ 복용' : '✅ Taken') : (lang === 'ko' ? '❌ 미복용' : '❌ Missed')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            {logs.length === 0 && (
              <div className="empty"><div style={{ fontSize: 48 }}>📋</div><div style={{ marginTop: 12 }}>{lang === 'ko' ? '복약 기록이 없습니다' : 'No medication history'}</div></div>
            )}
          </>
        )}
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
