import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ACCENT = '#8b5cf6'

// 숫자 기억력 게임
function NumberMemoryGame({ lang, onScore }) {
  const [phase, setPhase] = useState('idle') // idle, show, input, result
  const [level, setLevel] = useState(3)
  const [numbers, setNumbers] = useState([])
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [showIdx, setShowIdx] = useState(-1)

  const start = () => {
    const nums = Array.from({ length: level }, () => Math.floor(Math.random() * 9) + 1)
    setNumbers(nums); setInput(''); setResult(null); setPhase('show'); setShowIdx(0)
  }

  useEffect(() => {
    if (phase === 'show' && showIdx >= 0) {
      if (showIdx < numbers.length) {
        const t = setTimeout(() => setShowIdx(i => i + 1), 1000)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setPhase('input'), 500)
        return () => clearTimeout(t)
      }
    }
  }, [phase, showIdx, numbers])

  const check = () => {
    const correct = numbers.join('') === input.replace(/\s/g, '')
    setResult(correct)
    setPhase('result')
    if (correct) { onScore(level * 10); setLevel(l => l + 1) }
    else { setLevel(l => Math.max(3, l - 1)) }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 8 }}>
        {lang === 'ko' ? `레벨 ${level} — 숫자 ${level}개를 기억하세요` : `Level ${level} — Remember ${level} numbers`}
      </div>
      {phase === 'idle' && (
        <button onClick={start} style={{ padding: '16px 40px', borderRadius: 14, background: ACCENT, color: '#fff', border: 'none', fontSize: 20, fontWeight: 800, cursor: 'pointer', marginTop: 16 }}>
          {lang === 'ko' ? '시작' : 'Start'}
        </button>
      )}
      {phase === 'show' && (
        <div style={{ fontSize: 80, fontWeight: 900, color: ACCENT, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showIdx < numbers.length ? numbers[showIdx] : ''}
        </div>
      )}
      {phase === 'input' && (
        <div>
          <div style={{ fontSize: 16, marginBottom: 12, color: 'var(--text2)' }}>
            {lang === 'ko' ? '본 숫자를 순서대로 입력하세요' : 'Enter the numbers in order'}
          </div>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            style={{ fontSize: 32, padding: '12px 20px', borderRadius: 12, border: `2px solid ${ACCENT}`, background: 'var(--surface2)', color: 'var(--text)', width: '100%', textAlign: 'center', outline: 'none', letterSpacing: 8 }}
            placeholder="_ _ _"
          />
          <button onClick={check} style={{ marginTop: 12, padding: '14px 40px', borderRadius: 12, background: ACCENT, color: '#fff', border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
            {lang === 'ko' ? '확인' : 'Check'}
          </button>
        </div>
      )}
      {phase === 'result' && (
        <div>
          <div style={{ fontSize: 60 }}>{result ? '🎉' : '😅'}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: result ? '#10b981' : '#ef4444', marginTop: 8 }}>
            {result ? (lang === 'ko' ? '정답!' : 'Correct!') : (lang === 'ko' ? '틀렸습니다' : 'Wrong')}
          </div>
          {!result && <div style={{ fontSize: 18, color: 'var(--text2)', marginTop: 4 }}>{lang === 'ko' ? `정답: ${numbers.join('')}` : `Answer: ${numbers.join('')}`}</div>}
          <button onClick={start} style={{ marginTop: 16, padding: '14px 40px', borderRadius: 12, background: ACCENT, color: '#fff', border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
            {lang === 'ko' ? '다시 도전' : 'Try Again'}
          </button>
        </div>
      )}
    </div>
  )
}

// 단어 퀴즈 (속담/격언)
const PROVERBS = [
  { q: '가는 말이 고와야 ____ 말이 곱다', a: '오는', hint: '주고받는 것' },
  { q: '____도 식으면 맛이 없다', a: '쇠', hint: '철 종류' },
  { q: '세 살 버릇 ____까지 간다', a: '여든', hint: '가장 늙은 나이' },
  { q: '고생 끝에 ____이 온다', a: '낙', hint: '즐거움' },
  { q: '원숭이도 나무에서 ____', a: '떨어진다', hint: '실수' },
  { q: '아니 땐 굴뚝에 ____나랴', a: '연기', hint: '불이 타면 나오는 것' },
  { q: '백지장도 ____ 낫다', a: '맞들면', hint: '함께하면' },
  { q: '병은 ____ 이 낫고 정은 ____이 낫다', a: '나눌수록', hint: '나누다' },
]

function ProverbGame({ lang, onScore }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * PROVERBS.length))
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [score, setScore] = useState(0)
  const p = PROVERBS[idx]

  const check = () => {
    const correct = input.trim() === p.a
    setResult(correct)
    if (correct) { onScore(20); setScore(s => s + 1) }
  }

  const next = () => {
    setIdx(Math.floor(Math.random() * PROVERBS.length))
    setInput(''); setResult(null)
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>💡 힌트: {p.hint}</div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.6, background: 'var(--surface)', borderRadius: 14, padding: '20px 16px', marginBottom: 20 }}>
        {p.q}
      </div>
      {result === null ? (
        <>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            style={{ fontSize: 24, padding: '12px 20px', borderRadius: 12, border: `2px solid ${ACCENT}`, background: 'var(--surface2)', color: 'var(--text)', width: '80%', textAlign: 'center', outline: 'none' }}
            placeholder={lang === 'ko' ? '빈칸 채우기' : 'Fill in the blank'}
          />
          <br />
          <button onClick={check} style={{ marginTop: 12, padding: '14px 40px', borderRadius: 12, background: ACCENT, color: '#fff', border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
            {lang === 'ko' ? '확인' : 'Check'}
          </button>
        </>
      ) : (
        <div>
          <div style={{ fontSize: 50 }}>{result ? '🎉' : '😅'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: result ? '#10b981' : '#ef4444' }}>
            {result ? (lang === 'ko' ? '정답!' : 'Correct!') : `${lang === 'ko' ? '정답:' : 'Answer:'} ${p.a}`}
          </div>
          <button onClick={next} style={{ marginTop: 16, padding: '14px 40px', borderRadius: 12, background: ACCENT, color: '#fff', border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
            {lang === 'ko' ? '다음 문제' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

// 색깔 맞추기 게임
const COLOR_NAMES = [
  { ko: '빨강', en: 'Red', color: '#ef4444' },
  { ko: '파랑', en: 'Blue', color: '#3b82f6' },
  { ko: '초록', en: 'Green', color: '#10b981' },
  { ko: '노랑', en: 'Yellow', color: '#f59e0b' },
  { ko: '보라', en: 'Purple', color: '#8b5cf6' },
  { ko: '주황', en: 'Orange', color: '#f97316' },
  { ko: '분홍', en: 'Pink', color: '#ec4899' },
  { ko: '하늘', en: 'Sky', color: '#06b6d4' },
]

function ColorGame({ lang, onScore }) {
  const [phase, setPhase] = useState('idle')
  const [target, setTarget] = useState(null)
  const [options, setOptions] = useState([])
  const [result, setResult] = useState(null)

  const start = () => {
    const t = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)]
    const others = COLOR_NAMES.filter(c => c.ko !== t.ko).sort(() => Math.random() - .5).slice(0, 3)
    const opts = [...others, t].sort(() => Math.random() - .5)
    setTarget(t); setOptions(opts); setResult(null); setPhase('play')
  }

  const pick = (c) => {
    const correct = c.ko === target.ko
    setResult(correct ? 'correct' : 'wrong')
    if (correct) onScore(15)
    setTimeout(() => start(), 1200)
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 12 }}>
        {lang === 'ko' ? '색깔 이름과 같은 색을 고르세요' : 'Pick the color that matches the word'}
      </div>
      {phase === 'idle' ? (
        <button onClick={start} style={{ padding: '16px 40px', borderRadius: 14, background: ACCENT, color: '#fff', border: 'none', fontSize: 20, fontWeight: 800, cursor: 'pointer' }}>
          {lang === 'ko' ? '시작' : 'Start'}
        </button>
      ) : (
        <>
          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text)', background: 'var(--surface)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
            {lang === 'ko' ? target?.ko : target?.en}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {options.map((c, i) => (
              <button key={i} onClick={() => result === null && pick(c)}
                style={{ height: 80, borderRadius: 14, background: c.color, border: '4px solid transparent', cursor: 'pointer', transition: 'transform .1s', transform: result && c.ko === target?.ko ? 'scale(1.05)' : 'scale(1)' }}>
              </button>
            ))}
          </div>
          {result && (
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 16, color: result === 'correct' ? '#10b981' : '#ef4444' }}>
              {result === 'correct' ? '🎉 ' + (lang === 'ko' ? '정답!' : 'Correct!') : '😅 ' + (lang === 'ko' ? '틀렸어요' : 'Wrong')}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BrainGame() {
  const [lang, setLang] = useState('ko')
  const [game, setGame] = useState(0) // 0: 숫자기억, 1: 속담, 2: 색깔
  const [totalScore, setTotalScore] = useState(0)
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved === 'en' || saved === 'ko') setLang(saved)
    const sc = localStorage.getItem('silver_brain_score')
    if (sc) setTotalScore(Number(sc))
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const addScore = (n) => {
    setTotalScore(s => {
      const next = s + n; localStorage.setItem('silver_brain_score', next); return next
    })
  }

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const GAMES = [
    { icon: '🔢', ko: '숫자 기억', en: 'Number Memory' },
    { icon: '📜', ko: '속담 퀴즈', en: 'Proverb Quiz' },
    { icon: '🎨', ko: '색깔 맞추기', en: 'Color Match' },
  ]

  return (
    <>
      <Head>
        <title>{lang === 'ko' ? '두뇌 게임 — 실버툴즈' : 'Brain Games — SilverTools'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        :root { --accent: ${ACCENT}; }
        .brain-wrap { max-width: 600px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
        .game-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .game-tab { flex: 1; padding: 12px 6px; border-radius: 12px; border: 2px solid transparent; background: var(--surface); color: var(--text); font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; transition: all .2s; }
        .game-tab.active { background: ${ACCENT}22; border-color: ${ACCENT}; color: ${ACCENT}; }
        .score-bar { background: var(--surface); border-radius: 14px; padding: 14px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
        .score-num { font-size: 28px; fontWeight: 900; color: ${ACCENT}; }
        .game-area { background: var(--surface); border-radius: 16px; padding: 20px; min-height: 300px; }
      `}</style>

      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />

      <main className="brain-wrap">
        <div className="score-bar">
          <div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>{lang === 'ko' ? '누적 점수' : 'Total Score'}</div>
            <div className="score-num">{totalScore}점</div>
          </div>
          <div style={{ fontSize: 36 }}>🧠</div>
        </div>

        <div className="game-tabs">
          {GAMES.map((g, i) => (
            <button key={i} className={`game-tab${game === i ? ' active' : ''}`} onClick={() => setGame(i)}>
              <div style={{ fontSize: 20 }}>{g.icon}</div>
              <div>{lang === 'ko' ? g.ko : g.en}</div>
            </button>
          ))}
        </div>

        <div className="game-area">
          {game === 0 && <NumberMemoryGame lang={lang} onScore={addScore} />}
          {game === 1 && <ProverbGame lang={lang} onScore={addScore} />}
          {game === 2 && <ColorGame lang={lang} onScore={addScore} />}
        </div>
      </main>

      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
