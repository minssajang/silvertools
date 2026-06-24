# 🌿 실버툴즈 (SilverTools)

> 어르신을 위한 무료 스마트폰 도우미

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com)

---

## 📱 주요 기능

| 기능 | 설명 |
|------|------|
| 🔍 **돋보기** | 실시간 카메라 확대 · 확대 촬영 · OCR 텍스트 인식 · 한자 풀이 |
| 💊 **복약 관리** | 약 복용 시간 알림 · 복약 기록 · 요일별 관리 |
| 🏥 **병원 찾기** | 내 주변 병원·약국 · 진료과목별 검색 · 긴급 전화번호 |
| 🆘 **긴급 SOS** | 원터치 긴급 발신 · 가족 연락처 · 내 의료정보 카드 |
| 🧠 **두뇌 게임** | 치매 예방 · 숫자 기억 · 속담 퀴즈 · 색깔 맞추기 |
| 🩺 **건강 기록** | 혈압·혈당·체중·체온 기록 · 정상 범위 표시 |
| 📰 **큰글씨 뉴스** | 글자 크기 조절 · AI 뉴스 요약 · 포털 바로가기 |
| 🚌 **대중교통** | 길찾기 · 지하철 노선 · 65세 이상 무료 안내 |
| 📺 **화면공유** | WebRTC 기반 · 6자리 코드 · 자녀가 실시간으로 화면 보기 |
| 👨‍👩‍👧 **가족 대시보드** | 자녀가 부모님 복약·건강·SOS 현황 원격 확인 |

---

## 🛠 기술 스택

- **Frontend**: Next.js 14.2.5, React 18
- **Backend**: Next.js API Routes (Pages Router + App Router)
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (JWT, bcrypt)
- **화면공유**: WebRTC (P2P) + Supabase 시그널링
- **AI**: Claude API (OCR, 뉴스 요약)
- **MCP**: Model Context Protocol (블로그 자동화)
- **배포**: Vercel

---

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/minssajang/silvertools.git
cd silvertools
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 값 입력 (자세한 내용은 `SETUP_GUIDE.md` 참고)

### 3. Supabase DB 설정

Supabase 대시보드 → SQL Editor → `migration.sql` 실행

### 4. 로컬 실행

```bash
npm run dev
```

---

## 📁 프로젝트 구조

```
silvertools/
├── pages/
│   ├── index.js              # 메인 랜딩페이지
│   ├── login.js              # 로그인 / 회원가입
│   ├── magnifier-down.js     # 돋보기
│   ├── medicine.js           # 복약 관리
│   ├── hospital.js           # 병원 찾기
│   ├── sos.js                # 긴급 SOS
│   ├── brain-game.js         # 두뇌 게임
│   ├── health-record.js      # 건강 기록
│   ├── big-news.js           # 큰글씨 뉴스
│   ├── transit.js            # 대중교통
│   ├── screen-share.js       # 화면공유 (어르신)
│   ├── screen-view.js        # 화면보기 (자녀)
│   ├── family-dashboard.js   # 가족 대시보드
│   ├── admin.js              # 관리자 페이지
│   └── api/
│       ├── silver/           # 실버툴즈 API
│       │   ├── auth.js       # 인증 (Supabase Auth)
│       │   ├── medicine.js   # 복약 API
│       │   ├── health.js     # 건강기록 / SOS API
│       │   └── signal.js     # WebRTC 시그널링
│       ├── settings/         # 관리자 설정
│       └── tools/            # MCP 키워드 도구
├── app/
│   └── api/mcp/route.js      # MCP 서버 (Claude 연동)
├── components/
│   ├── Header.js
│   ├── Footer.js
│   ├── AdSlot.js
│   └── admin/                # 관리자 컴포넌트
├── lib/
│   ├── supabaseClient.js     # Supabase 클라이언트
│   ├── useAuth.js            # 인증 헬퍼
│   └── blogCategories.js
├── migration.sql             # DB 테이블 생성 SQL
└── .env.example              # 환경변수 템플릿
```

---

## 🔐 보안

- **인증**: Supabase Auth (bcrypt 비밀번호, JWT 토큰 자동 갱신)
- **API 보안**: 모든 API 요청 Bearer 토큰 검증
- **DB 보안**: Row Level Security (RLS) — 본인 데이터만 접근 가능
- **가족 연동**: 초대코드 기반 명시적 권한 부여
- **화면공유**: WebRTC P2P — 서버에 영상 저장 없음

---

## 📋 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `SUPABASE_URL` | ✅ | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서버 API용 service_role 키 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | 클라이언트용 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 클라이언트용 anon 키 |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | ✅ | 관리자 페이지 비밀번호 |
| `MCP_SHARED_SECRET` | ✅ | MCP 서버 인증 토큰 |
| `ADMIN_SECRET_TOKEN` | ✅ | 관리자 API 토큰 |
| `NAVER_CLIENT_ID` | MCP용 | 네이버 검색 API |
| `NAVER_AD_API_KEY` | MCP용 | 네이버 검색광고 API |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 광고 | Google AdSense |

전체 목록은 `.env.example` 참고

---

## 📖 배포 가이드

자세한 배포 방법은 **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** 를 참고하세요.

---

## 📄 라이선스

MIT License © 2025 SilverTools
