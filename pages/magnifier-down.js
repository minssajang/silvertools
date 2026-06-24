import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#10b981'  // 에메랄드 그린 (노인 앱 느낌)

const LANGS = {
  ko: {
    metaTitle: 'Magnifier-Down — 무료 스마트폰 돋보기 | 확대·OCR·한자풀이',
    metaDesc: '카메라로 글씨를 실시간 확대하고, 사진 촬영 후 OCR로 텍스트 인식, 한자 풀이까지 지원하는 무료 돋보기 앱.',
    tabs: ['돋보기', '텍스트 인식'],
    tabIcons: ['🔍', '📖'],
    zoomLabel: '확대 배율',
    flashOn: '조명 켜기',
    flashOff: '조명 끄기',
    capture: '📷 촬영',
    retake: '🔄 다시 찍기',
    rotate: '↻ 회전',
    brightness: '밝기',
    contrast: '대비',
    freeze: '화면 고정',
    unfreeze: '고정 해제',
    ocrBtn: '📖 텍스트 읽기',
    ocrLoading: '텍스트 인식 중...',
    ocrResult: '인식된 텍스트',
    hanjaBtn: '한자 풀이',
    translateBtn: '번역',
    copyBtn: '복사',
    copyDone: '복사됨!',
    noCamera: '카메라 권한이 필요합니다',
    noCameraDesc: '브라우저에서 카메라 접근을 허용해 주세요',
    noText: '인식된 텍스트가 없습니다',
    capturedImg: '촬영된 사진',
    ocrNote: '* 텍스트 인식은 Claude AI를 사용합니다',
    saveImg: '💾 이미지 저장',
    apiKeyLabel: 'API 키 (선택)',
    apiKeyPlaceholder: 'Claude API 키 입력 (없으면 무료 제한)',
    fontSize: '글자 크기',
    adLabel: '광고',
  },
  en: {
    metaTitle: 'Magnifier-Down — Free Magnifier App | Zoom · OCR · Character Lookup',
    metaDesc: 'Real-time camera zoom magnifier with photo capture, OCR text recognition, and Chinese character (Hanja) lookup.',
    tabs: ['Magnifier', 'Text Reader'],
    tabIcons: ['🔍', '📖'],
    zoomLabel: 'Zoom Level',
    flashOn: 'Light On',
    flashOff: 'Light Off',
    capture: '📷 Capture',
    retake: '🔄 Retake',
    rotate: '↻ Rotate',
    brightness: 'Brightness',
    contrast: 'Contrast',
    freeze: 'Freeze',
    unfreeze: 'Unfreeze',
    ocrBtn: '📖 Read Text',
    ocrLoading: 'Recognizing text...',
    ocrResult: 'Recognized Text',
    hanjaBtn: 'Hanja Lookup',
    translateBtn: 'Translate',
    copyBtn: 'Copy',
    copyDone: 'Copied!',
    noCamera: 'Camera permission required',
    noCameraDesc: 'Please allow camera access in your browser',
    noText: 'No text recognized',
    capturedImg: 'Captured Photo',
    ocrNote: '* Text recognition uses Claude AI',
    saveImg: '💾 Save Image',
    apiKeyLabel: 'API Key (optional)',
    apiKeyPlaceholder: 'Enter Claude API key',
    fontSize: 'Font Size',
    adLabel: 'Ad',
  },
}

export default function MagnifierDown() {
  const [lang, setLang] = useState('ko')
  const [tab, setTab] = useState(0)
  const [zoom, setZoom] = useState(2)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [frozen, setFrozen] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [captured, setCaptured] = useState(null)  // base64
  const [rotation, setRotation] = useState(0)
  const [cameraError, setCameraError] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [fontSize, setFontSize] = useState(20)
  const [copied, setCopied] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const t = LANGS[lang]

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraError(false)
    } catch (e) {
      setCameraError(true)
    }
  }, [facingMode])

  useEffect(() => {
    if (tab === 0 && !captured) {
      startCamera()
    }
    return () => {
      if (streamRef.current && tab !== 0) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [tab, captured, startCamera])

  // 토치(플래시) 제어
  useEffect(() => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    const caps = track.getCapabilities?.()
    if (caps?.torch) {
      track.applyConstraints({ advanced: [{ torch: flashOn }] }).catch(() => {})
    }
  }, [flashOn])

  const handleCapture = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setCaptured(dataUrl)
    // 카메라 끄기
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  const handleRetake = () => {
    setCaptured(null)
    setOcrText('')
    setTab(0)
    startCamera()
  }

  const handleRotate = () => {
    setRotation(r => (r + 90) % 360)
  }

  const handleSaveImage = () => {
    if (!captured) return
    const a = document.createElement('a')
    a.href = captured
    a.download = `magnifier_${Date.now()}.jpg`
    a.click()
  }

  const handleOCR = async () => {
    if (!captured) return
    setOcrLoading(true)
    setOcrText('')
    try {
      const base64 = captured.split(',')[1]
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
              },
              {
                type: 'text',
                text: lang === 'ko'
                  ? '이 이미지에서 텍스트를 인식해 주세요. 한자가 있으면 한자(한국어 발음 [한국어 뜻]) 형식으로 풀이해 주세요. 인식된 원문과 풀이를 구분해서 보여주세요.'
                  : 'Please read all text from this image. If there are Chinese characters (Hanja), provide readings with meanings. Show original text and explanation separately.'
              }
            ]
          }]
        })
      })
      const data = await res.json()
      if (data.content?.[0]?.text) {
        setOcrText(data.content[0].text)
        setTab(1)
      } else {
        setOcrText(t.noText)
      }
    } catch (e) {
      setOcrText('오류가 발생했습니다. 다시 시도해 주세요.')
    }
    setOcrLoading(false)
  }

  const handleCopy = () => {
    if (!ocrText) return
    navigator.clipboard.writeText(ocrText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next)
    localStorage.setItem('dt_lang', next)
  }

  const toggleCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment')
  }

  return (
    <>
      <Head>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: var(--bg, #0f172a); color: var(--text, #f1f5f9); font-family: 'Pretendard', 'Noto Sans KR', sans-serif; }

        .mag-wrap {
          max-width: 600px;
          margin: 0 auto;
          padding: 16px;
          padding-bottom: 80px;
        }

        /* 탭 */
        .mag-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .mag-tab {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: 2px solid transparent;
          background: var(--surface, #1e293b);
          color: var(--text, #f1f5f9);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s;
          text-align: center;
        }
        .mag-tab.active {
          background: ${ACCENT}22;
          border-color: ${ACCENT};
          color: ${ACCENT};
        }

        /* 카메라 뷰 */
        .camera-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform-origin: center center;
        }
        .camera-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        /* 중앙 십자선 */
        .crosshair {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 40px; height: 40px;
          opacity: 0.6;
        }
        .crosshair::before, .crosshair::after {
          content: '';
          position: absolute;
          background: ${ACCENT};
          border-radius: 2px;
        }
        .crosshair::before { width: 2px; height: 100%; left: 50%; transform: translateX(-50%); }
        .crosshair::after  { height: 2px; width: 100%; top: 50%; transform: translateY(-50%); }

        /* 촬영된 이미지 */
        .captured-img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: contain;
          background: #000;
          border-radius: 16px;
          margin-bottom: 16px;
          display: block;
        }

        /* 카메라 오류 */
        .no-camera {
          aspect-ratio: 4/3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface, #1e293b);
          border-radius: 16px;
          margin-bottom: 16px;
          gap: 12px;
          text-align: center;
          padding: 24px;
        }
        .no-camera-icon { font-size: 48px; }
        .no-camera-title { font-size: 18px; font-weight: 700; }
        .no-camera-desc { font-size: 14px; color: #94a3b8; }

        /* 컨트롤 패널 */
        .control-panel {
          background: var(--surface, #1e293b);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .control-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .control-row:last-child { margin-bottom: 0; }
        .control-label {
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          min-width: 60px;
        }
        .control-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 6px;
          border-radius: 3px;
          background: #334155;
          outline: none;
        }
        .control-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: ${ACCENT};
          cursor: pointer;
          box-shadow: 0 2px 8px ${ACCENT}66;
        }
        .control-value {
          font-size: 14px;
          font-weight: 700;
          color: ${ACCENT};
          min-width: 36px;
          text-align: right;
        }

        /* 버튼 행 */
        .btn-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .btn {
          flex: 1;
          min-width: 80px;
          padding: 12px 8px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s;
          text-align: center;
        }
        .btn-primary {
          background: ${ACCENT};
          color: #fff;
        }
        .btn-primary:active { transform: scale(0.97); }
        .btn-secondary {
          background: var(--surface2, #334155);
          color: var(--text, #f1f5f9);
        }
        .btn-danger {
          background: #ef4444;
          color: #fff;
        }
        .btn-flash-on {
          background: #fbbf24;
          color: #000;
        }
        .btn-icon {
          padding: 12px 14px;
          flex: 0 0 auto;
          min-width: unset;
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* 캡처 버튼 크게 */
        .btn-capture {
          font-size: 20px;
          padding: 16px;
          letter-spacing: 0.5px;
        }

        /* 배율 표시 배지 */
        .zoom-badge {
          position: absolute;
          top: 12px; right: 12px;
          background: rgba(0,0,0,0.6);
          color: ${ACCENT};
          font-size: 18px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
          pointer-events: none;
        }

        /* OCR 결과 */
        .ocr-result {
          background: var(--surface, #1e293b);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 12px;
        }
        .ocr-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .ocr-result-title {
          font-size: 16px;
          font-weight: 700;
          color: ${ACCENT};
        }
        .ocr-result-text {
          font-size: ${(props) => props}px;
          line-height: 1.8;
          color: var(--text, #f1f5f9);
          white-space: pre-wrap;
          word-break: break-all;
        }
        .ocr-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px;
          color: #94a3b8;
          font-size: 16px;
        }
        .spinner {
          width: 24px; height: 24px;
          border: 3px solid #334155;
          border-top-color: ${ACCENT};
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* 폰트 크기 조절 */
        .font-size-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #334155;
        }

        /* 힌트 */
        .hint {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          padding: 8px;
        }

        @media (max-width: 480px) {
          .mag-wrap { padding: 12px; }
          .btn { font-size: 14px; padding: 11px 6px; }
          .btn-capture { font-size: 18px; }
        }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="DownTools" />

      <main className="mag-wrap">

        {/* 탭 */}
        <div className="mag-tabs">
          {t.tabs.map((name, i) => (
            <button key={i} className={`mag-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
              {t.tabIcons[i]} {name}
            </button>
          ))}
        </div>

        {/* ===== 탭0: 돋보기 ===== */}
        {tab === 0 && (
          <>
            {/* 카메라 뷰 */}
            {cameraError ? (
              <div className="no-camera">
                <div className="no-camera-icon">📷</div>
                <div className="no-camera-title">{t.noCamera}</div>
                <div className="no-camera-desc">{t.noCameraDesc}</div>
                <button className="btn btn-primary" onClick={startCamera}>다시 시도</button>
              </div>
            ) : captured ? (
              <img
                src={captured}
                alt={t.capturedImg}
                className="captured-img"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  className="camera-video"
                  playsInline
                  muted
                  style={{
                    transform: `scale(${zoom})`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  }}
                />
                <div className="camera-overlay">
                  <div className="zoom-badge">{zoom}×</div>
                  <div className="crosshair" />
                </div>
              </div>
            )}

            {/* 배율 슬라이더 */}
            {!captured && (
              <div className="control-panel">
                <div className="control-row">
                  <span className="control-label">🔍 {t.zoomLabel}</span>
                  <input
                    type="range" className="control-slider"
                    min="1" max="8" step="0.5"
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                  />
                  <span className="control-value">{zoom}×</span>
                </div>
                <div className="control-row">
                  <span className="control-label">☀️ {t.brightness}</span>
                  <input
                    type="range" className="control-slider"
                    min="50" max="200" step="5"
                    value={brightness}
                    onChange={e => setBrightness(Number(e.target.value))}
                  />
                  <span className="control-value">{brightness}%</span>
                </div>
                <div className="control-row">
                  <span className="control-label">◑ {t.contrast}</span>
                  <input
                    type="range" className="control-slider"
                    min="50" max="200" step="5"
                    value={contrast}
                    onChange={e => setContrast(Number(e.target.value))}
                  />
                  <span className="control-value">{contrast}%</span>
                </div>
              </div>
            )}

            {/* 버튼들 */}
            {!captured ? (
              <>
                <div className="btn-row">
                  <button className={`btn ${flashOn ? 'btn-flash-on' : 'btn-secondary'}`} onClick={() => setFlashOn(f => !f)}>
                    {flashOn ? '🔦 ' + t.flashOff : '🔦 ' + t.flashOn}
                  </button>
                  <button className="btn btn-secondary btn-icon" onClick={toggleCamera} title="카메라 전환">
                    🔄
                  </button>
                </div>
                <div className="btn-row">
                  <button className="btn btn-primary btn-capture" onClick={handleCapture}>
                    {t.capture}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="btn-row">
                  <button className="btn btn-secondary" onClick={handleRetake}>{t.retake}</button>
                  <button className="btn btn-secondary" onClick={handleRotate}>{t.rotate}</button>
                  <button className="btn btn-secondary" onClick={handleSaveImage}>{t.saveImg}</button>
                </div>
                <div className="btn-row">
                  <button className="btn btn-primary btn-capture" onClick={handleOCR} disabled={ocrLoading}>
                    {ocrLoading ? t.ocrLoading : t.ocrBtn}
                  </button>
                </div>
                <p className="hint">{t.ocrNote}</p>
              </>
            )}
          </>
        )}

        {/* ===== 탭1: 텍스트 인식 결과 ===== */}
        {tab === 1 && (
          <>
            {/* 촬영된 이미지 썸네일 */}
            {captured && (
              <img
                src={captured}
                alt={t.capturedImg}
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  background: '#000',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            )}

            {/* OCR 버튼 (캡처된 이미지가 있을 때) */}
            {captured && !ocrText && !ocrLoading && (
              <div className="btn-row">
                <button className="btn btn-primary btn-capture" onClick={handleOCR}>
                  {t.ocrBtn}
                </button>
              </div>
            )}

            {/* 로딩 */}
            {ocrLoading && (
              <div className="ocr-loading">
                <div className="spinner" />
                <span>{t.ocrLoading}</span>
              </div>
            )}

            {/* 결과 */}
            {ocrText && !ocrLoading && (
              <div className="ocr-result">
                <div className="ocr-result-header">
                  <span className="ocr-result-title">📖 {t.ocrResult}</span>
                  <button className="btn btn-secondary" style={{ flex: 0, padding: '8px 14px', fontSize: 14 }} onClick={handleCopy}>
                    {copied ? t.copyDone : t.copyBtn}
                  </button>
                </div>
                <div className="ocr-result-text" style={{ fontSize: `${fontSize}px` }}>
                  {ocrText}
                </div>
                {/* 폰트 크기 조절 */}
                <div className="font-size-row">
                  <span className="control-label" style={{ fontSize: 13 }}>🔤 {t.fontSize}</span>
                  <input
                    type="range" className="control-slider"
                    min="14" max="36" step="2"
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                  />
                  <span className="control-value">{fontSize}px</span>
                </div>
              </div>
            )}

            {/* 캡처 없을 때 안내 */}
            {!captured && (
              <div className="no-camera">
                <div className="no-camera-icon">📷</div>
                <div className="no-camera-title" style={{ fontSize: 16 }}>
                  {lang === 'ko' ? '먼저 돋보기 탭에서 사진을 촬영하세요' : 'Take a photo in the Magnifier tab first'}
                </div>
                <button className="btn btn-primary" onClick={() => setTab(0)}>
                  {lang === 'ko' ? '📷 돋보기로 이동' : '📷 Go to Magnifier'}
                </button>
              </div>
            )}
          </>
        )}

      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="DownTools" loaded={settingsLoaded} />
    </>
  )
}
