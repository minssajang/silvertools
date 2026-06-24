import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const I18N = {
  ko: {
    metaTitle: '이용약관 - 실버툴즈',
    metaDesc: '실버툴즈 이용약관',
    title: '이용약관',
    content: `이용약관

제1조 (목적)
본 약관은 실버툴즈(이하 "서비스")가 제공하는 돋보기, 복약관리, 병원찾기, 긴급SOS, 두뇌게임, 건강기록, 큰글씨뉴스, 대중교통, 화면공유 등 일체의 도구 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 제공)
서비스는 어르신과 가족을 위한 편의 도구를 제공합니다. 서비스 내용은 운영상·기술상 필요에 따라 사전 고지 없이 변경되거나 중단될 수 있습니다.

제3조 (회원가입 및 개인정보)
회원가입 시 전화번호와 비밀번호를 등록합니다. 입력하신 개인정보는 서비스 제공 목적으로만 사용되며, 제3자에게 제공하지 않습니다.

제4조 (이용자의 의무)
이용자는 관계 법령 및 본 약관을 준수해야 하며, 타인의 권리를 침해하는 행위를 하지 않습니다.

제5조 (면책조항)
서비스는 천재지변, 시스템 점검 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다. 건강 관련 정보는 참고용이며, 의료진 상담을 대체하지 않습니다.`,
  },
  en: {
    metaTitle: 'Terms of Use - SilverTools',
    metaDesc: 'SilverTools Terms of Use',
    title: 'Terms of Use',
    content: `Terms of Use

Article 1 (Purpose)
These terms govern the use of SilverTools services including magnifier, medication management, hospital finder, emergency SOS, brain games, health records, large-print news, public transit, and screen sharing.

Article 2 (Service Provision)
The service provides convenience tools for seniors and their families. Service content may be changed or suspended without prior notice.

Article 3 (Membership)
Registration requires a phone number and password. Personal information is used only for service provision and is not shared with third parties.

Article 4 (User Obligations)
Users must comply with applicable laws and these terms, and must not infringe on the rights of others.

Article 5 (Disclaimer)
The service is not liable for service interruptions due to force majeure. Health-related information is for reference only and does not replace medical consultation.`,
  },
}

export default function Terms() {
  const [lang, setLang] = useState('ko')
  const [adsOn, setAdsOn] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dt_lang')
    if (saved) setLang(saved)
    fetch('/api/settings/get').then(r => r.json()).then(d => {
      if (d.adsOn !== undefined) setAdsOn(d.adsOn)
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  const toggleLang = () => {
    const next = lang === 'ko' ? 'en' : 'ko'
    setLang(next); localStorage.setItem('dt_lang', next)
  }

  const t = I18N[lang]

  return (
    <>
      <Head>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.metaDesc} />
      </Head>
      <Header lang={lang} onToggleLang={toggleLang} siteName="SilverTools" />
      <main style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>{t.title}</h1>
        <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
          {t.content}
        </div>
      </main>
      <Footer lang={lang} adsOn={adsOn} siteName="SilverTools" loaded={settingsLoaded} />
    </>
  )
}
