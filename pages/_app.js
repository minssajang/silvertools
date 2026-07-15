import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import PopupDisplay from '../components/PopupDisplay'

// 도구 페이지 경로 → 이름 매핑
const TOOL_NAMES = {
  '/magnifier-down': '돋보기',
  '/medicine': '복약관리',
  '/hospital': '병원찾기',
  '/sos': '긴급SOS',
  '/brain-game': '두뇌게임',
  '/health-record': '건강기록',
  '/big-news': '큰글씨뉴스',
  '/transit': '대중교통',
}

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url) => {
      const path = url.split('?')[0]
      // 도구 페이지 진입 이벤트
      if (TOOL_NAMES[path]) {
        window.gtag?.('event', 'tool_use', {
          tool_name: TOOL_NAMES[path],
          tool_path: path,
        })
      }
      // 블로그 글 진입 이벤트
      if (path.startsWith('/blog/') && path !== '/blog/') {
        window.gtag?.('event', 'blog_read', {
          blog_slug: path.replace('/blog/', ''),
        })
      }
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    // 최초 진입도 체크
    handleRouteChange(router.asPath)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router])

  return (
    <>
      <Head>
        {/* Google Fonts preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* 검색엔진 인증 */}
        <meta name="google-site-verification" content="828Mf-hRlCpwvG4M6VOXjZidjk3eV0a5Pe4OVnXhq0Y" />
        <meta name="google-site-verification" content="wmEuMs0GN6krWw8tY9eziKXjvvN4nROS0D_6s6j4-vY" />
        <meta name="naver-site-verification" content="c684c5f62177e061e405ce1be7874e0c2b52650b" />
        <meta name="yandex-verification" content="a82be56a5e332038" />

        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2161169464776476"
          crossOrigin="anonymous"
        />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1FRFSVVNNZ" />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1FRFSVVNNZ');
          `
        }} />
      </Head>
      <Component {...pageProps} />
      <PopupDisplay />
    </>
  )
}
