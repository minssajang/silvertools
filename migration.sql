-- =============================================
-- 실버툴즈 (SilverTools) Supabase 마이그레이션
-- Supabase 대시보드 > SQL Editor 에서 실행
-- =============================================

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS silver_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT UNIQUE NOT NULL,          -- 전화번호 (010-0000-0000)
  password    TEXT NOT NULL,                 -- bcrypt 해시
  name        TEXT,
  role        TEXT DEFAULT 'senior',        -- 'senior' | 'family'
  invite_code TEXT UNIQUE,                  -- 어르신 계정의 6자리 초대코드
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 가족 연동 테이블 (자녀 ↔ 어르신)
CREATE TABLE IF NOT EXISTS silver_family_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id  UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  family_id  UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'active',         -- 'active' | 'revoked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(senior_id, family_id)
);

-- 3. 약 정보 테이블
CREATE TABLE IF NOT EXISTS silver_medications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  dose       TEXT,
  times      JSONB NOT NULL DEFAULT '[]',   -- ["08:00", "13:00", "20:00"]
  days       JSONB NOT NULL DEFAULT '[]',   -- [0,1,2,3,4,5,6] (0=일요일)
  color      TEXT DEFAULT '#f59e0b',
  memo       TEXT,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 복약 기록 테이블
CREATE TABLE IF NOT EXISTS silver_med_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  med_id     UUID REFERENCES silver_medications(id) ON DELETE CASCADE,
  date       DATE NOT NULL,                 -- '2025-01-15'
  time       TEXT NOT NULL,                 -- '08:00'
  taken      BOOLEAN DEFAULT FALSE,
  taken_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(med_id, date, time)
);

-- 5. 건강 기록 테이블
CREATE TABLE IF NOT EXISTS silver_health_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,                 -- 'bp' | 'sugar' | 'weight' | 'temp'
  v1         NUMERIC NOT NULL,              -- 주값 (혈압: 수축기, 혈당, 체중, 체온)
  v2         NUMERIC,                       -- 혈압 이완기
  memo       TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOS 연락처 테이블
CREATE TABLE IF NOT EXISTS silver_sos_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  relation   TEXT,
  memo       TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 내 의료 정보 테이블
CREATE TABLE IF NOT EXISTS silver_my_info (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES silver_users(id) ON DELETE CASCADE,
  name       TEXT,
  birth      TEXT,
  blood_type TEXT,
  disease    TEXT,
  allergy    TEXT,
  address    TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 화면공유 시그널링 테이블 (WebRTC)
CREATE TABLE IF NOT EXISTS silver_share_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code  TEXT UNIQUE NOT NULL,          -- 6자리 공유 코드
  host_id     UUID REFERENCES silver_users(id) ON DELETE CASCADE,
  offer       TEXT,                          -- WebRTC SDP offer
  answer      TEXT,                          -- WebRTC SDP answer
  host_ice    JSONB DEFAULT '[]',            -- host ICE candidates
  guest_ice   JSONB DEFAULT '[]',            -- guest ICE candidates
  status      TEXT DEFAULT 'waiting',        -- 'waiting'|'connected'|'ended'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- =============================================
-- RLS (Row Level Security) 설정
-- =============================================

ALTER TABLE silver_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_family_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_medications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_med_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_health_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_sos_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_my_info           ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_share_sessions    ENABLE ROW LEVEL SECURITY;

-- service_role은 RLS 우회 (서버 API에서 사용)
-- anon/authenticated 접근은 API를 통해서만

-- share_sessions는 코드로 조회 가능하도록 (시그널링용)
CREATE POLICY "share_sessions_by_code" ON silver_share_sessions
  FOR ALL USING (true);

-- =============================================
-- 인덱스
-- =============================================

CREATE INDEX IF NOT EXISTS idx_med_logs_user_date    ON silver_med_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_records_user   ON silver_health_records(user_id, type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_medications_user      ON silver_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_family_links_senior   ON silver_family_links(senior_id);
CREATE INDEX IF NOT EXISTS idx_family_links_family   ON silver_family_links(family_id);
CREATE INDEX IF NOT EXISTS idx_share_code            ON silver_share_sessions(share_code);
CREATE INDEX IF NOT EXISTS idx_users_phone           ON silver_users(phone);
CREATE INDEX IF NOT EXISTS idx_users_invite_code     ON silver_users(invite_code);
