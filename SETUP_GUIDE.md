# 실버툴즈 (SilverTools) 배포 가이드

## 전체 흐름

```
[1] Supabase 프로젝트 생성 + DB 테이블 생성 (10분)
        ↓
[2] .env.local 환경변수 설정 (5분)
        ↓
[3] GitHub 푸시 → Vercel 자동 배포 (3분)
        ↓
[4] claude.ai에 MCP 커넥터 등록 (2분)
        ↓
완료
```

---

## 1단계 — Supabase DB 설정

1. https://supabase.com 접속 → 새 프로젝트 생성
2. 프로젝트 생성 후 **SQL Editor** 탭 클릭
3. `migration.sql` 파일 내용 전체 복사 → SQL Editor에 붙여넣고 **Run** 클릭
4. 왼쪽 **Settings → API** 에서 아래 4개 값 복사해두기:
   - **Project URL** → `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2단계 — 환경변수 설정

`.env.example` 파일을 `.env.local`로 복사 후 값 입력:

```bash
cp .env.example .env.local
```

### 필수 항목

| 변수 | 값 | 설명 |
|------|-----|------|
| `SUPABASE_URL` | https://xxx.supabase.co | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... | service_role 키 (서버 전용) |
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | 위와 동일 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... | anon public 키 |
| `SILVER_PW_SALT` | 아무 문자열 | 비밀번호 해싱용 솔트 (한번 설정 후 변경 금지) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 관리자비번 | 관리자 페이지 접근 비밀번호 |
| `MCP_SHARED_SECRET` | 아무 문자열 | MCP 서버 보안 토큰 |

### MCP / 블로그 기능 (네이버 API)

네이버 블로그 자동발행, 키워드 검색량 조회 기능을 사용하려면:

1. https://searchad.naver.com 접속 → API 신청
2. 발급받은 값 입력:

| 변수 | 설명 |
|------|------|
| `NAVER_CLIENT_ID` | 네이버 개발자센터 앱 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 개발자센터 앱 Client Secret |
| `NAVER_AD_API_KEY` | 검색광고 API ACCESS LICENSE |
| `NAVER_AD_SECRET_KEY` | 검색광고 API SECRET KEY |
| `NAVER_AD_CUSTOMER_ID` | 검색광고 CUSTOMER ID |

### 광고 (선택)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Google AdSense ca-pub-xxx |
| `NEXT_PUBLIC_AD_SLOT_TOP` | 상단 광고 슬롯 ID |
| `NEXT_PUBLIC_AD_SLOT_FOOTER` | 하단 광고 슬롯 ID |

---

## 3단계 — GitHub 푸시 → Vercel 배포

```bash
git add .
git commit -m "feat: 실버툴즈 초기 배포"
git push
```

Vercel과 GitHub 연결이 되어 있으면 자동 배포됩니다.

### Vercel에 환경변수 등록

로컬 `.env.local` 외에 Vercel 대시보드에도 등록해야 실제 배포에 적용됩니다:

1. https://vercel.com → 프로젝트 → **Settings → Environment Variables**
2. `.env.local`의 모든 항목을 동일하게 입력
3. 저장 후 **Redeploy**

---

## 4단계 — claude.ai MCP 커넥터 등록

1. claude.ai → 설정 → 커넥터
2. 커넥터 추가 → URL 입력:
   ```
   https://your-domain.vercel.app/api/mcp
   ```
3. `MCP_SHARED_SECRET` 값을 인증 토큰으로 입력
4. **연결됨** 표시 확인

---

## 완료 후 기능 확인

| URL | 기능 |
|-----|------|
| `/` | 실버툴즈 메인 |
| `/login` | 회원가입 / 로그인 |
| `/magnifier-down` | 돋보기 + OCR |
| `/medicine` | 복약 관리 |
| `/hospital` | 병원 찾기 |
| `/sos` | 긴급 SOS |
| `/brain-game` | 두뇌 게임 |
| `/health-record` | 건강 기록 |
| `/big-news` | 큰글씨 뉴스 |
| `/transit` | 대중교통 |
| `/screen-share` | 화면공유 (어르신용) |
| `/screen-view` | 화면보기 (자녀용) |
| `/family-dashboard` | 가족 대시보드 |
| `/admin` | 관리자 페이지 |

---

## 문제 해결

**빌드 실패 시**
- Vercel 로그에서 에러 확인
- 환경변수가 모두 등록됐는지 확인

**화면공유가 안 될 때**
- HTTPS 환경에서만 동작합니다 (localhost 제외)
- 브라우저가 WebRTC를 지원하는지 확인 (Chrome, Safari 최신버전)

**복약 알림이 안 올 때**
- 브라우저 알림 권한 허용 필요
- 모바일은 화면이 켜진 상태에서만 동작 (PWA 추후 지원 예정)
