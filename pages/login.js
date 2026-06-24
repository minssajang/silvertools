import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { saveSession, getUser } from '../lib/useAuth'

const ACCENT = '#10b981'

export default function Login() {
  const router = useRouter()
  const [lang, setLang] = useState('ko')
  const [mode, setMode] = useState('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved) setLang(saved)
    if (getUser()) router.push('/')
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, '')
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7,11)}`
  }

  const handleSubmit = async () => {
    setError('')
    if (!phone || !password) { setError(lang === 'ko' ? '전화번호와 비밀번호를 입력하세요' : 'Enter phone and password'); return }
    if (password.length < 6) { setError(lang === 'ko' ? '비밀번호는 6자리 이상' : 'Min 6 characters'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/silver/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode === 'login' ? 'login' : 'register', phone, password, name })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || (lang === 'ko' ? '오류가 발생했습니다' : 'An error occurred')); setLoading(false); return }

      saveSession(data.user, data.session)
      router.push('/')
    } catch {
      setError(lang === 'ko' ? '서버 오류. 잠시 후 다시 시도하세요' : 'Server error')
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '로그인 — 실버툴즈' : 'Login — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`
        :root { --accent: ${ACCENT}; }
        .login-wrap { max-width: 440px; margin: 40px auto; padding: 24px; }
        .login-card { background: var(--surface); border-radius: 20px; padding: 32px 24px; border: 2px solid var(--border); }
        .login-logo { text-align: center; font-size: 48px; margin-bottom: 8px; }
        .login-title { text-align: center; font-size: 24px; font-weight: 900; margin-bottom: 4px; }
        .login-sub { text-align: center; font-size: 15px; color: var(--text2); margin-bottom: 28px; }
        .mode-tabs { display: flex; margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 2px solid var(--border); }
        .mode-tab { flex: 1; padding: 12px; border: none; background: var(--surface2); color: var(--text2); font-size: 16px; font-weight: 700; cursor: pointer; }
        .mode-tab.active { background: ${ACCENT}; color: #fff; }
        .form-group { margin-bottom: 16px; }
        .form-label { font-size: 15px; font-weight: 700; color: var(--text2); margin-bottom: 8px; display: block; }
        .form-input { width: 100%; padding: 16px 18px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface2); color: var(--text); font-size: 18px; outline: none; }
        .form-input:focus { border-color: ${ACCENT}; }
        .submit-btn { width: 100%; padding: 18px; border-radius: 14px; background: ${ACCENT}; color: #fff; border: none; font-size: 20px; font-weight: 900; cursor: pointer; margin-top: 8px; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .error-msg { background: #ef444422; border: 1px solid #ef444444; border-radius: 10px; padding: 12px 16px; color: #ef4444; font-size: 15px; font-weight: 600; margin-bottom: 16px; text-align: center; }
        .invite-info { background: ${ACCENT}11; border: 1px solid ${ACCENT}33; border-radius: 12px; padding: 14px 16px; margin-top: 20px; font-size: 14px; color: var(--text2); line-height: 1.7; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />
      <main className="login-wrap">
        <div className="login-card">
          <div className="login-logo">🌿</div>
          <div className="login-title">{lang === 'ko' ? '실버툴즈' : 'SilverTools'}</div>
          <div className="login-sub">{lang === 'ko' ? '어르신을 위한 스마트폰 도우미' : 'Smart tools for seniors'}</div>

          <div className="mode-tabs">
            <button className={`mode-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError('') }}>
              {lang === 'ko' ? '로그인' : 'Login'}
            </button>
            <button className={`mode-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setError('') }}>
              {lang === 'ko' ? '회원가입' : 'Register'}
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">{lang === 'ko' ? '이름' : 'Name'}</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ko' ? '홍길동' : 'Your name'} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{lang === 'ko' ? '전화번호' : 'Phone'}</label>
            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" maxLength={13} />
          </div>
          <div className="form-group">
            <label className="form-label">{lang === 'ko' ? '비밀번호 (6자리 이상)' : 'Password (min 6)'}</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="••••••" />
          </div>

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : mode === 'login' ? (lang === 'ko' ? '로그인' : 'Login') : (lang === 'ko' ? '가입하기' : 'Register')}
          </button>

          {mode === 'register' && (
            <div className="invite-info">
              💡 {lang === 'ko' ? '가입 후 6자리 초대코드가 생성됩니다. 자녀에게 코드를 알려주면 복약·건강 기록을 함께 볼 수 있어요.' : 'After registering you\'ll get a 6-digit invite code to share with family.'}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
