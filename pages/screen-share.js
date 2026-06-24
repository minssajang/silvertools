import { useState, useEffect, useRef } from 'react'
import { getUser, authFetch } from '../lib/useAuth'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#8b5cf6'

export default function ScreenShare() {
  const router = useRouter()
  const [lang, setLang] = useState('ko')
  const [user, setUser] = useState(null)
  const [step, setStep] = useState('idle')  // idle | creating | sharing | ended
  const [shareCode, setShareCode] = useState('')
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const pcRef = useRef(null)
  const streamRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved) setLang(saved)
    const u = localStorage.getItem('silver_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))

    return () => {
      stopAll()
    }
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const stopAll = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (pcRef.current) pcRef.current.close()
  }

  const startShare = async () => {
    if (!user) return
    setStep('creating')
    setError('')

    try {
      // 1. 방 생성 → 코드 받기
      const res = await authFetch('/api/silver/signal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', host_id: user.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const code = data.session.share_code
      setShareCode(code)
      setSession(data.session)
      setStep('sharing')

      // 2. 화면 캡처 시작
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' }, audio: false
      })
      streamRef.current = stream

      // 화면 공유 중단 시 처리
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        endShare(code)
      })

      // 3. WebRTC PeerConnection 생성
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      })
      pcRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // 4. ICE candidate 수집 → 서버에 저장
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return
        await authFetch('/api/silver/signal', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_ice', share_code: code, candidate: e.candidate, role: 'host' })
        })
      }

      // 5. offer 생성 → 서버에 저장
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await authFetch('/api/silver/signal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_offer', share_code: code, offer: JSON.stringify(offer) })
      })

      // 6. 자녀가 answer 보낼 때까지 폴링
      pollRef.current = setInterval(async () => {
        const r = await authFetch('/api/silver/signal', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', share_code: code })
        })
        const d = await r.json()
        const sess = d.session

        // answer 수신
        if (sess?.answer && !pc.remoteDescription) {
          await pc.setRemoteDescription(JSON.parse(sess.answer))
        }

        // guest ICE candidates 수신
        if (sess?.guest_ice?.length > 0) {
          for (const candidate of sess.guest_ice) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
          }
        }

        if (sess?.status === 'ended') {
          clearInterval(pollRef.current)
          setStep('ended')
        }
      }, 2000)

    } catch (e) {
      setError(e.message || (lang === 'ko' ? '화면공유를 시작할 수 없습니다' : 'Cannot start screen share'))
      setStep('idle')
    }
  }

  const endShare = async (code) => {
    const c = code || shareCode
    if (c) {
      await authFetch('/api/silver/signal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', share_code: c })
      })
    }
    stopAll()
    setStep('ended')
  }

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '화면공유 — 실버툴즈' : 'Screen Share — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .share-wrap { max-width: 500px; margin: 0 auto; padding: 20px; padding-bottom: 80px; text-align: center; }
        .share-card { background: var(--surface); border-radius: 20px; padding: 32px 24px; border: 2px solid var(--border); }
        .share-icon { font-size: 64px; margin-bottom: 16px; }
        .share-title { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
        .share-sub { font-size: 16px; color: var(--text2); margin-bottom: 28px; line-height: 1.6; }
        .code-box { background: ${ACCENT}11; border: 3px solid ${ACCENT}44; border-radius: 16px; padding: 24px; margin: 20px 0; }
        .code-label { font-size: 15px; color: var(--text2); font-weight: 700; margin-bottom: 10px; }
        .code-number { font-size: 52px; font-weight: 900; letter-spacing: 10px; color: ${ACCENT}; font-family: monospace; }
        .code-hint { font-size: 14px; color: var(--text2); margin-top: 10px; }
        .start-btn { width: 100%; padding: 20px; border-radius: 16px; background: ${ACCENT}; color: #fff; border: none; font-size: 22px; font-weight: 900; cursor: pointer; }
        .end-btn { width: 100%; padding: 16px; border-radius: 14px; background: #ef4444; color: #fff; border: none; font-size: 18px; font-weight: 800; cursor: pointer; margin-top: 16px; }
        .error-msg { background: #ef444422; border: 1px solid #ef444444; border-radius: 10px; padding: 12px; color: #ef4444; font-size: 15px; margin-bottom: 16px; }
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; }
        .step-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); }
        .step-dot.active { background: ${ACCENT}; }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .sharing-status { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; background: #10b98122; border-radius: 12px; margin-bottom: 16px; color: #10b981; font-size: 16px; font-weight: 700; }
        .how-to { background: var(--surface2); border-radius: 14px; padding: 18px; margin-top: 20px; text-align: left; }
        .how-to-title { font-size: 15px; font-weight: 800; margin-bottom: 10px; }
        .how-to-step { display: flex; gap: 10px; margin-bottom: 10px; font-size: 15px; line-height: 1.5; }
        .step-num { width: 26px; height: 26px; border-radius: 50%; background: ${ACCENT}; color: #fff; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="share-wrap">
        <div className="share-card">

          {step === 'idle' && (
            <>
              <div className="share-icon">📱</div>
              <div className="share-title">{lang === 'ko' ? '화면공유' : 'Screen Share'}</div>
              <div className="share-sub">
                {lang === 'ko'
                  ? '자녀에게 내 화면을 보여주고\n도움을 받을 수 있어요'
                  : 'Share your screen with family\nto get help navigating'}
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button className="start-btn" onClick={startShare}>
                📺 {lang === 'ko' ? '화면공유 시작' : 'Start Screen Share'}
              </button>

              <div className="how-to">
                <div className="how-to-title">📖 {lang === 'ko' ? '사용 방법' : 'How to use'}</div>
                {(lang === 'ko' ? [
                  '화면공유 시작 버튼을 누르세요',
                  '6자리 코드가 나타납니다',
                  '자녀에게 코드를 알려주세요',
                  '자녀가 코드를 입력하면 화면이 보입니다',
                ] : [
                  'Tap Start Screen Share',
                  'A 6-digit code will appear',
                  'Tell the code to your family member',
                  'They enter the code to see your screen',
                ]).map((s, i) => (
                  <div key={i} className="how-to-step">
                    <div className="step-num">{i + 1}</div>
                    <div>{s}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'creating' && (
            <>
              <div className="share-icon pulse">⏳</div>
              <div className="share-title">{lang === 'ko' ? '준비 중...' : 'Preparing...'}</div>
            </>
          )}

          {step === 'sharing' && (
            <>
              <div className="share-icon">📺</div>
              <div className="share-title">{lang === 'ko' ? '화면공유 중' : 'Sharing Screen'}</div>

              <div className="sharing-status">
                <span className="pulse">🟢</span>
                {lang === 'ko' ? '자녀의 접속을 기다리는 중...' : 'Waiting for family to connect...'}
              </div>

              <div className="code-box">
                <div className="code-label">{lang === 'ko' ? '자녀에게 이 번호를 알려주세요' : 'Share this code with your family'}</div>
                <div className="code-number">{shareCode}</div>
                <div className="code-hint">{lang === 'ko' ? '1시간 동안 유효합니다' : 'Valid for 1 hour'}</div>
              </div>

              <button className="end-btn" onClick={() => endShare()}>
                ⏹ {lang === 'ko' ? '공유 종료' : 'Stop Sharing'}
              </button>
            </>
          )}

          {step === 'ended' && (
            <>
              <div className="share-icon">✅</div>
              <div className="share-title">{lang === 'ko' ? '공유가 종료됐습니다' : 'Screen sharing ended'}</div>
              <button className="start-btn" style={{ marginTop: 20 }} onClick={() => setStep('idle')}>
                {lang === 'ko' ? '다시 시작' : 'Start Again'}
              </button>
            </>
          )}

        </div>
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
