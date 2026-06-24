-- =============================================
-- 실버툴즈 (SilverTools) Supabase 마이그레이션
-- Supabase Auth 기반
-- =============================================

-- 1. 프로필 테이블 (Supabase Auth users 확장)
CREATE TABLE IF NOT EXISTS silver_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       TEXT UNIQUE,
  name        TEXT,
  invite_code TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 가족 연동
CREATE TABLE IF NOT EXISTS silver_family_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id  UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  family_id  UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(senior_id, family_id)
);

-- 3. 약 정보
CREATE TABLE IF NOT EXISTS silver_medications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  dose       TEXT,
  times      JSONB NOT NULL DEFAULT '[]',
  days       JSONB NOT NULL DEFAULT '[]',
  color      TEXT DEFAULT '#f59e0b',
  memo       TEXT,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 복약 기록
CREATE TABLE IF NOT EXISTS silver_med_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  med_id     UUID REFERENCES silver_medications(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  time       TEXT NOT NULL,
  taken      BOOLEAN DEFAULT FALSE,
  taken_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(med_id, date, time)
);

-- 5. 건강 기록
CREATE TABLE IF NOT EXISTS silver_health_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  v1          NUMERIC NOT NULL,
  v2          NUMERIC,
  memo        TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOS 연락처
CREATE TABLE IF NOT EXISTS silver_sos_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  relation   TEXT,
  memo       TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 내 의료 정보
CREATE TABLE IF NOT EXISTS silver_my_info (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES silver_profiles(id) ON DELETE CASCADE,
  name       TEXT,
  birth      TEXT,
  blood_type TEXT,
  disease    TEXT,
  allergy    TEXT,
  address    TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 화면공유 시그널링
CREATE TABLE IF NOT EXISTS silver_share_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT UNIQUE NOT NULL,
  host_id    UUID REFERENCES silver_profiles(id) ON DELETE CASCADE,
  offer      TEXT,
  answer     TEXT,
  host_ice   JSONB DEFAULT '[]',
  guest_ice  JSONB DEFAULT '[]',
  status     TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- =============================================
-- RLS 활성화
-- =============================================
ALTER TABLE silver_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_family_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_medications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_med_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_health_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_sos_contacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_my_info         ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver_share_sessions  ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책
-- =============================================

-- 프로필: 본인만 조회/수정
CREATE POLICY "profiles_own" ON silver_profiles
  FOR ALL USING (auth.uid() = id);

-- 약 정보: 본인 + 연동된 가족
CREATE POLICY "meds_own" ON silver_medications
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM silver_family_links
      WHERE senior_id = silver_medications.user_id
      AND family_id = auth.uid()
      AND status = 'active'
    )
  );

-- 복약 기록: 본인 + 연동된 가족
CREATE POLICY "med_logs_own" ON silver_med_logs
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM silver_family_links
      WHERE senior_id = silver_med_logs.user_id
      AND family_id = auth.uid()
      AND status = 'active'
    )
  );

-- 건강 기록: 본인 + 연동된 가족
CREATE POLICY "health_own" ON silver_health_records
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM silver_family_links
      WHERE senior_id = silver_health_records.user_id
      AND family_id = auth.uid()
      AND status = 'active'
    )
  );

-- SOS: 본인 + 연동된 가족
CREATE POLICY "sos_own" ON silver_sos_contacts
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM silver_family_links
      WHERE senior_id = silver_sos_contacts.user_id
      AND family_id = auth.uid()
      AND status = 'active'
    )
  );

-- 내 의료정보: 본인 + 연동된 가족
CREATE POLICY "myinfo_own" ON silver_my_info
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM silver_family_links
      WHERE senior_id = silver_my_info.user_id
      AND family_id = auth.uid()
      AND status = 'active'
    )
  );

-- 가족 연동: 본인이 포함된 링크만
CREATE POLICY "family_links_own" ON silver_family_links
  FOR ALL USING (
    auth.uid() = senior_id OR auth.uid() = family_id
  );

-- 화면공유: 코드로 조회 가능 (시그널링용)
CREATE POLICY "share_sessions_all" ON silver_share_sessions
  FOR ALL USING (true);

-- =============================================
-- 신규 유저 가입 시 프로필 자동 생성 트리거
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite TEXT;
BEGIN
  -- 유니크 초대코드 생성
  LOOP
    invite := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM silver_profiles WHERE invite_code = invite);
  END LOOP;

  INSERT INTO silver_profiles (id, phone, name, invite_code)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.phone),
    invite
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_med_logs_user_date   ON silver_med_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_user_type     ON silver_health_records(user_id, type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_meds_user            ON silver_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_family_senior        ON silver_family_links(senior_id);
CREATE INDEX IF NOT EXISTS idx_family_member        ON silver_family_links(family_id);
CREATE INDEX IF NOT EXISTS idx_share_code           ON silver_share_sessions(share_code);
CREATE INDEX IF NOT EXISTS idx_profiles_phone       ON silver_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_invite      ON silver_profiles(invite_code);

-- =============================================
-- MCP / 키워드 관리 테이블 (관리자용)
-- =============================================

-- 키워드 검색량 통계
CREATE TABLE IF NOT EXISTS keyword_stats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hint        TEXT NOT NULL,
  keyword     TEXT NOT NULL,
  pc          INT DEFAULT 0,
  mobile      INT DEFAULT 0,
  total       INT DEFAULT 0,
  competition TEXT,
  doc_count   INT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hint, keyword)
);

-- 찜한 키워드
CREATE TABLE IF NOT EXISTS keyword_picks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    TEXT NOT NULL,
  keyword    TEXT NOT NULL,
  memo       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_id, keyword)
);

-- 블로그 발행 배치 로그
CREATE TABLE IF NOT EXISTS doc_batch_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL,
  tool_id    TEXT,
  keyword    TEXT,
  title      TEXT,
  slug       TEXT,
  status     TEXT DEFAULT 'done',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사이트 설정 (관리자)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- keyword_stats 요약 RPC 함수
CREATE OR REPLACE FUNCTION keyword_stats_summary()
RETURNS TABLE(hint TEXT, keyword_count BIGINT, max_total INT, avg_total NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT hint,
         COUNT(*)::BIGINT AS keyword_count,
         MAX(total)       AS max_total,
         ROUND(AVG(total), 0) AS avg_total
  FROM keyword_stats
  GROUP BY hint
  ORDER BY max_total DESC;
$$;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_keyword_stats_hint  ON keyword_stats(hint);
CREATE INDEX IF NOT EXISTS idx_keyword_stats_total ON keyword_stats(total DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_picks_tool  ON keyword_picks(tool_id);
CREATE INDEX IF NOT EXISTS idx_doc_batch_date      ON doc_batch_log(date DESC);

-- RLS (service_role만 접근 - 관리자 전용)
ALTER TABLE keyword_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_picks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_batch_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "keyword_stats_service_only"  ON keyword_stats  FOR ALL USING (false);
CREATE POLICY "keyword_picks_service_only"  ON keyword_picks  FOR ALL USING (false);
CREATE POLICY "doc_batch_log_service_only"  ON doc_batch_log  FOR ALL USING (false);
CREATE POLICY "settings_service_only"       ON settings       FOR ALL USING (false);
