import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#8b5cf6'

export default function ScreenView() {
  const router = useRouter()
  const [lang, setLang] = useState('ko')
  const [step, setStep] = useState('input')  // input | connecting | viewing | ended
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const videoRef = useRef(null)
  const pcRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved) setLang(saved)
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
    return () => stopAll()
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const stopAll = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (pcRef.current) pcRef.current.close()
  }

  const connect = async () => {
    if (code.length !== 6) { setError(lang === 'ko' ? '6자리 코드를 입력하세요' : 'Enter a 6-digit code'); return }
    setError('')
    setStep('connecting')

    try {
      // 1. 세션 조회
      const res = await fetch('/api/silver/signal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', share_code: code })
      })
      const data = await res.json()
      if (!res.ok || !data.session) throw new Error(lang === 'ko' ? '코드를 찾을 수 없습니다' : 'Code not found')
      if (data.session.status === 'ended') throw new Error(lang === 'ko' ? '이미 종료된 세션입니다' : 'Session already ended')
      if (!data.session.offer) throw new Error(lang === 'ko' ? '아직 준비 중입니다. 잠시 후 다시 시도하세요' : 'Not ready yet, please retry')

      // 2. PeerConnection 생성
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      })
      pcRef.current = pc

      // 3. 원격 스트림 수신 → video에 표시
      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0]
          setStep('viewing')
        }
      }

      // 4. ICE candidate 수집 → 서버에 저장
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return
        await fetch('/api/silver/signal', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_ice', share_code: code, candidate: e.candidate, role: 'guest' })
        })
      }

      // 5. offer 수락 → answer 생성 → 서버에 저장
      await pc.setRemoteDescription(JSON.parse(data.session.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await fetch('/api/silver/signal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_answer', share_code: code, answer: JSON.stringify(answer) })
      })

      // 6. host ICE candidates 수신 폴링
      let addedHostIce = 0
      pollRef.current = setInterval(async () => {
        const r = await fetch('/api/silver/signal', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', share_code: code })
        })
        const d = await r.json()
        const sess = d.session
        if (!sess) return

        // 새 host ICE 추가
        if (sess.host_ice?.length > addedHostIce) {
          const newCandidates = sess.host_ice.slice(addedHostIce)
          for (const candidate of newCandidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
          }
          addedHostIce = sess.host_ice.length
        }

        if (sess.status === 'ended') {
          clearInterval(pollRef.current)
          setStep('ended')
        }
      }, 2000)

    } catch (e) {
      setError(e.message)
      setStep('input')
    }
  }

  const disconnect = async () => {
    stopAll()
    setStep('ended')
  }

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '화면보기 — 실버툴즈' : 'Screen View — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .view-wrap { max-width: 700px; margin: 0 auto; padding: 20px; padding-bottom: 80px; }
        .view-card { background: var(--surface); border-radius: 20px; padding: 32px 24px; border: 2px solid var(--border); text-align: center; }
        .view-icon { font-size: 64px; margin-bottom: 16px; }
        .view-title { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
        .view-sub { font-size: 16px; color: var(--text2); margin-bottom: 28px; line-height: 1.6; }
        .code-inputs { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
        .code-full-input { font-size: 36px; font-weight: 900; letter-spacing: 12px; text-align: center; padding: 16px 20px; border-radius: 14px; border: 3px solid var(--border); background: var(--surface2); color: var(--text); width: 100%; max-width: 280px; outline: none; font-family: monospace; }
        .code-full-input:focus { border-color: ${ACCENT}; }
        .connect-btn { padding: 18px 48px; border-radius: 14px; background: ${ACCENT}; color: #fff; border: none; font-size: 20px; font-weight: 900; cursor: pointer; }
        .error-msg { background: #ef444422; border: 1px solid #ef444444; border-radius: 10px; padding: 12px; color: #ef4444; font-size: 15px; margin-bottom: 16px; }
        .video-container { width: 100%; background: #000; border-radius: 16px; overflow: hidden; margin-bottom: 16px; position: relative; }
        .screen-video { width: 100%; display: block; max-height: 70vh; object-fit: contain; }
        .viewing-controls { display: flex; gap: 10px; justify-content: center; }
        .end-btn { padding: 14px 32px; border-radius: 12px; background: #ef4444; color: #fff; border: none; font-size: 17px; font-weight: 800; cursor: pointer; }
        .fullscreen-btn { padding: 14px 24px; border-radius: 12px; background: var(--surface2); color: var(--text); border: none; font-size: 17px; font-weight: 700; cursor: pointer; }
        .connecting-anim { font-size: 48px; animation: pulse 1.2s infinite; margin-bottom: 16px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .live-badge { position: absolute; top: 12px; left: 12px; background: #ef4444; color: #fff; padding: 4px 12px; border-radius: 99px; font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #fff; animation: pulse 1s infinite; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="view-wrap">

        {step === 'input' && (
          <div className="view-card">
            <div className="view-icon">👀</div>
            <div className="view-title">{lang === 'ko' ? '부모님 화면 보기' : 'View Parent Screen'}</div>
            <div className="view-sub">
              {lang === 'ko'
                ? '부모님이 알려주신 6자리 코드를 입력하세요'
                : 'Enter the 6-digit code from your parent'}
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="code-inputs">
              <input
                className="code-full-input"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && connect()}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            <button className="connect-btn" onClick={connect} disabled={code.length !== 6}>
              {lang === 'ko' ? '연결하기' : 'Connect'}
            </button>
          </div>
        )}

        {step === 'connecting' && (
          <div className="view-card">
            <div className="connecting-anim">📡</div>
            <div className="view-title">{lang === 'ko' ? '연결 중...' : 'Connecting...'}</div>
            <div className="view-sub">{lang === 'ko' ? '잠시만 기다려 주세요' : 'Please wait a moment'}</div>
          </div>
        )}

        {step === 'viewing' && (
          <>
            <div className="video-container">
              <video
                ref={videoRef}
                className="screen-video"
                autoPlay
                playsInline
              />
              <div className="live-badge">
                <div className="live-dot" />
                LIVE
              </div>
            </div>
            <div className="viewing-controls">
              <button className="fullscreen-btn" onClick={() => videoRef.current?.requestFullscreen()}>
                ⛶ {lang === 'ko' ? '전체화면' : 'Fullscreen'}
              </button>
              <button className="end-btn" onClick={disconnect}>
                ⏹ {lang === 'ko' ? '종료' : 'End'}
              </button>
            </div>
          </>
        )}

        {step === 'ended' && (
          <div className="view-card">
            <div className="view-icon">✅</div>
            <div className="view-title">{lang === 'ko' ? '연결이 종료됐습니다' : 'Connection ended'}</div>
            <button className="connect-btn" style={{ marginTop: 20 }} onClick={() => { setStep('input'); setCode('') }}>
              {lang === 'ko' ? '다시 연결' : 'Reconnect'}
            </button>
          </div>
        )}

      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
