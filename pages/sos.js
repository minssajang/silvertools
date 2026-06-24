import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#ef4444'

export default function SOS() {
  const [lang, setLang] = useState('ko')
  const [contacts, setContacts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relation: '', memo: '' })
  const [editIdx, setEditIdx] = useState(null)
  const [sosPressing, setSosPressing] = useState(false)
  const [sosTimer, setSosTimer] = useState(null)
  const [sosCountdown, setSosCountdown] = useState(0)
  const [tab, setTab] = useState(0)
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [myInfo, setMyInfo] = useState({ name: '', birth: '', bloodType: '', disease: '', allergy: '', address: '' })
  const [editMyInfo, setEditMyInfo] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    const c = localStorage.getItem('silver_sos_contacts')
    const m = localStorage.getItem('silver_my_info')
    if (c) setContacts(JSON.parse(c))
    if (m) setMyInfo(JSON.parse(m))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const saveContacts = (data) => { setContacts(data); localStorage.setItem('silver_sos_contacts', JSON.stringify(data)) }
  const saveMyInfo = (data) => { setMyInfo(data); localStorage.setItem('silver_my_info', JSON.stringify(data)) }

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) return
    if (editIdx !== null) {
      const next = [...contacts]; next[editIdx] = form; saveContacts(next); setEditIdx(null)
    } else {
      saveContacts([...contacts, form])
    }
    setForm({ name: '', phone: '', relation: '', memo: '' })
    setShowAdd(false)
  }

  const handleEdit = (i) => { setForm(contacts[i]); setEditIdx(i); setShowAdd(true) }
  const handleDelete = (i) => {
    if (!confirm(lang === 'ko' ? '삭제할까요?' : 'Delete?')) return
    saveContacts(contacts.filter((_, idx) => idx !== i))
  }

  // SOS 버튼 길게 누르기 (3초)
  const startSOS = () => {
    setSosPressing(true)
    let count = 3
    setSosCountdown(count)
    const interval = setInterval(() => {
      count--
      setSosCountdown(count)
      if (count <= 0) {
        clearInterval(interval)
        setSosPressing(false)
        triggerSOS()
      }
    }, 1000)
    setSosTimer(interval)
  }

  const cancelSOS = () => {
    if (sosTimer) clearInterval(sosTimer)
    setSosPressing(false)
    setSosCountdown(0)
  }

  const triggerSOS = () => {
    if (contacts.length > 0) {
      window.location.href = `tel:${contacts[0].phone}`
    } else {
      window.location.href = 'tel:119'
    }
  }

  const RELATIONS = ['배우자', '자녀', '형제', '부모', '친척', '친구', '이웃', '기타']
  const RELATIONS_EN = ['Spouse', 'Child', 'Sibling', 'Parent', 'Relative', 'Friend', 'Neighbor', 'Other']
  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', lang === 'ko' ? '모름' : 'Unknown']

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '긴급 SOS — 실버툴즈' : 'Emergency SOS — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .sos-wrap { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .sos-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .sos-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 15px; font-weight: 700; cursor: pointer; text-align: center; transition: all .2s; }
        .sos-tab.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }

        /* SOS 버튼 */
        .sos-btn-area { display: flex; flex-direction: column; align-items: center; margin: 24px 0; }
        .sos-big-btn {
          width: 200px; height: 200px; border-radius: 50%;
          background: ${ACCENT}; color: #fff;
          border: 8px solid #fff;
          box-shadow: 0 0 0 6px ${ACCENT}44, 0 8px 32px ${ACCENT}88;
          font-size: 48px; font-weight: 900;
          cursor: pointer; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          transition: all .15s; user-select: none; -webkit-user-select: none;
          gap: 4px;
        }
        .sos-big-btn:active, .sos-big-btn.pressing {
          transform: scale(0.95);
          box-shadow: 0 0 0 10px ${ACCENT}33, 0 4px 16px ${ACCENT}66;
        }
        .sos-countdown { font-size: 20px; font-weight: 700; margin-top: 16px; color: ${ACCENT}; }
        .sos-hint { font-size: 14px; color: var(--text2); margin-top: 8px; text-align: center; }

        /* 연락처 */
        .contact-card { background: var(--surface); border-radius: 16px; padding: 16px; margin-bottom: 10px; border: 2px solid var(--border); display: flex; align-items: center; gap: 12px; }
        .contact-avatar { width: 48px; height: 48px; border-radius: 50%; background: ${ACCENT}22; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
        .contact-name { font-size: 18px; font-weight: 800; }
        .contact-phone { font-size: 16px; color: ${ACCENT}; font-weight: 700; }
        .contact-rel { font-size: 13px; color: var(--text2); }
        .contact-actions { display: flex; gap: 6px; margin-left: auto; }
        .call-btn { padding: 10px 16px; border-radius: 10px; background: #10b981; color: #fff; border: none; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; display: flex; align-items: center; }

        .form-panel { background: var(--surface); border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 2px solid ${ACCENT}; }
        .form-label { font-size: 14px; font-weight: 700; color: var(--text2); margin-bottom: 6px; margin-top: 14px; display: block; }
        .form-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 16px; outline: none; }
        .form-input:focus { border-color: ${ACCENT}; }
        .btn { padding: 12px 20px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; transition: all .15s; }
        .btn-primary { background: ${ACCENT}; color: #fff; }
        .btn-ghost { background: var(--surface2); color: var(--text); }
        .btn-danger { background: #ef444422; color: #ef4444; border: none; border-radius: 8px; padding: 8px 12px; font-size: 14px; cursor: pointer; }
        .btn-add { width: 100%; padding: 16px; border-radius: 14px; border: 2px dashed ${ACCENT}66; background: ${ACCENT}11; color: ${ACCENT}; font-size: 17px; font-weight: 700; cursor: pointer; margin-bottom: 12px; }
        .myinfo-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 16px; }
        .myinfo-key { color: var(--text2); font-weight: 600; }
        .myinfo-val { font-weight: 700; }
        .emergency-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .eq-btn { padding: 14px; border-radius: 12px; border: none; font-size: 18px; font-weight: 800; cursor: pointer; text-align: center; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="sos-wrap">
        <div className="sos-tabs">
          {(lang === 'ko' ? ['SOS 발신', '연락처', '내 정보'] : ['SOS Call', 'Contacts', 'My Info']).map((name, i) => (
            <button key={i} className={`sos-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{name}</button>
          ))}
        </div>

        {/* ===== 탭0: SOS 발신 ===== */}
        {tab === 0 && (
          <>
            <div className="sos-btn-area">
              <button
                className={`sos-big-btn${sosPressing ? ' pressing' : ''}`}
                onMouseDown={startSOS} onMouseUp={cancelSOS} onMouseLeave={cancelSOS}
                onTouchStart={startSOS} onTouchEnd={cancelSOS}
              >
                <span>🆘</span>
                <span style={{ fontSize: 28 }}>SOS</span>
              </button>
              {sosPressing && (
                <div className="sos-countdown">
                  {sosCountdown}초 후 발신...
                </div>
              )}
              <div className="sos-hint">
                {lang === 'ko' ? '버튼을 3초간 길게 누르면 긴급 전화가 발신됩니다' : 'Hold for 3 seconds to make an emergency call'}
              </div>
              {contacts.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 15, color: ACCENT, fontWeight: 700 }}>
                  📞 {lang === 'ko' ? `발신 대상: ${contacts[0].name} (${contacts[0].phone})` : `Will call: ${contacts[0].name} (${contacts[0].phone})`}
                </div>
              )}
              {contacts.length === 0 && (
                <div style={{ marginTop: 12, fontSize: 14, color: '#f59e0b', fontWeight: 700 }}>
                  ⚠️ {lang === 'ko' ? '연락처 미등록 시 119로 발신됩니다' : 'Will call 119 if no contact registered'}
                </div>
              )}
            </div>

            {/* 긴급 직통 버튼 */}
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>📞 {lang === 'ko' ? '긴급 직통 전화' : 'Direct Emergency Calls'}</div>
            <div className="emergency-quick">
              {[
                { num: '119', label: lang === 'ko' ? '119 소방·응급' : '119 Fire & EMS', color: '#ef4444' },
                { num: '112', label: lang === 'ko' ? '112 경찰' : '112 Police', color: '#3b82f6' },
                { num: '1339', label: lang === 'ko' ? '1339 응급의료' : '1339 Medical', color: '#f59e0b' },
                { num: '129', label: lang === 'ko' ? '129 복지콜' : '129 Welfare', color: '#10b981' },
              ].map(e => (
                <a key={e.num} href={`tel:${e.num}`} className="eq-btn" style={{ background: e.color + '22', color: e.color, border: `2px solid ${e.color}44` }}>
                  <span style={{ fontSize: 28, fontWeight: 900 }}>{e.num}</span>
                  <span style={{ fontSize: 13 }}>{e.label}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* ===== 탭1: 연락처 ===== */}
        {tab === 1 && (
          <>
            {showAdd && (
              <div className="form-panel">
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  {editIdx !== null ? (lang === 'ko' ? '연락처 수정' : 'Edit Contact') : (lang === 'ko' ? '연락처 추가' : 'Add Contact')}
                </div>
                <label className="form-label">{lang === 'ko' ? '이름 *' : 'Name *'}</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder={lang === 'ko' ? '이름' : 'Name'} />
                <label className="form-label">{lang === 'ko' ? '전화번호 *' : 'Phone *'}</label>
                <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="010-0000-0000" />
                <label className="form-label">{lang === 'ko' ? '관계' : 'Relation'}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {(lang === 'ko' ? RELATIONS : RELATIONS_EN).map((r, i) => (
                    <button key={i} onClick={() => setForm(f => ({...f, relation: r}))}
                      style={{ padding: '8px 14px', borderRadius: 99, border: '2px solid', borderColor: form.relation === r ? ACCENT : 'var(--border)', background: form.relation === r ? ACCENT + '22' : 'var(--surface2)', color: form.relation === r ? ACCENT : 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      {r}
                    </button>
                  ))}
                </div>
                <label className="form-label">{lang === 'ko' ? '메모' : 'Note'}</label>
                <input className="form-input" value={form.memo} onChange={e => setForm(f => ({...f, memo: e.target.value}))} placeholder={lang === 'ko' ? '예: 첫째 아들' : 'e.g. Eldest son'} />
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAdd(false); setEditIdx(null) }}>{lang === 'ko' ? '취소' : 'Cancel'}</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>{lang === 'ko' ? '저장' : 'Save'}</button>
                </div>
              </div>
            )}
            {!showAdd && (
              <button className="btn-add" onClick={() => { setShowAdd(true); setEditIdx(null); setForm({ name: '', phone: '', relation: '', memo: '' }) }}>
                + {lang === 'ko' ? '연락처 추가' : 'Add Contact'}
              </button>
            )}
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)', fontSize: 16 }}>
                <div style={{ fontSize: 48 }}>📞</div>
                <div style={{ marginTop: 12 }}>{lang === 'ko' ? '등록된 연락처가 없습니다' : 'No contacts registered'}</div>
              </div>
            ) : (
              contacts.map((c, i) => (
                <div key={i} className="contact-card">
                  <div className="contact-avatar">{i === 0 ? '⭐' : '👤'}</div>
                  <div style={{ flex: 1 }}>
                    <div className="contact-name">{c.name} {c.relation && <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 400 }}>({c.relation})</span>}</div>
                    <div className="contact-phone">{c.phone}</div>
                    {c.memo && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{c.memo}</div>}
                  </div>
                  <div className="contact-actions">
                    <a href={`tel:${c.phone}`} className="call-btn">📞</a>
                    <button className="btn btn-ghost" style={{ padding: '10px 12px', fontSize: 14, borderRadius: 8 }} onClick={() => handleEdit(i)}>✏️</button>
                    <button className="btn-danger" onClick={() => handleDelete(i)}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ===== 탭2: 내 정보 (응급 시 참고) ===== */}
        {tab === 2 && (
          <>
            <div style={{ background: '#ef444422', border: '2px solid #ef444444', borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 14, color: '#ef4444', fontWeight: 600 }}>
              🚨 {lang === 'ko' ? '응급 상황 시 구조대원에게 보여주세요' : 'Show this to emergency responders'}
            </div>
            {editMyInfo ? (
              <div className="form-panel">
                {[
                  { key: 'name', label: lang === 'ko' ? '이름' : 'Name', placeholder: '홍길동' },
                  { key: 'birth', label: lang === 'ko' ? '생년월일' : 'Date of Birth', placeholder: '1950-01-01' },
                  { key: 'disease', label: lang === 'ko' ? '기저질환' : 'Medical Conditions', placeholder: lang === 'ko' ? '고혈압, 당뇨 등' : 'Hypertension, Diabetes...' },
                  { key: 'allergy', label: lang === 'ko' ? '알레르기' : 'Allergies', placeholder: lang === 'ko' ? '페니실린 등' : 'Penicillin...' },
                  { key: 'address', label: lang === 'ko' ? '주소' : 'Address', placeholder: lang === 'ko' ? '서울시...' : 'Address...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" value={myInfo[f.key]} onChange={e => setMyInfo(m => ({...m, [f.key]: e.target.value}))} placeholder={f.placeholder} />
                  </div>
                ))}
                <label className="form-label">{lang === 'ko' ? '혈액형' : 'Blood Type'}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {BLOOD_TYPES.map(bt => (
                    <button key={bt} onClick={() => setMyInfo(m => ({...m, bloodType: bt}))}
                      style={{ padding: '8px 14px', borderRadius: 99, border: '2px solid', borderColor: myInfo.bloodType === bt ? ACCENT : 'var(--border)', background: myInfo.bloodType === bt ? ACCENT + '22' : 'var(--surface2)', color: myInfo.bloodType === bt ? ACCENT : 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      {bt}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditMyInfo(false)}>{lang === 'ko' ? '취소' : 'Cancel'}</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { saveMyInfo(myInfo); setEditMyInfo(false) }}>{lang === 'ko' ? '저장' : 'Save'}</button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                {[
                  { key: 'name', label: lang === 'ko' ? '이름' : 'Name' },
                  { key: 'birth', label: lang === 'ko' ? '생년월일' : 'Birth' },
                  { key: 'bloodType', label: lang === 'ko' ? '혈액형' : 'Blood Type' },
                  { key: 'disease', label: lang === 'ko' ? '기저질환' : 'Conditions' },
                  { key: 'allergy', label: lang === 'ko' ? '알레르기' : 'Allergies' },
                  { key: 'address', label: lang === 'ko' ? '주소' : 'Address' },
                ].map(f => (
                  <div key={f.key} className="myinfo-row">
                    <span className="myinfo-key">{f.label}</span>
                    <span className="myinfo-val">{myInfo[f.key] || (lang === 'ko' ? '미입력' : 'Not set')}</span>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }} onClick={() => setEditMyInfo(true)}>
                  ✏️ {lang === 'ko' ? '정보 수정' : 'Edit Info'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
