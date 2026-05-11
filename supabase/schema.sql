-- 콘텐츠 허브 스키마
-- PostgreSQL 예약어 충돌을 피하기 위해 해외 링크 테이블명은 foreign_references 를 사용합니다.

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  order_num   INTEGER DEFAULT 0,
  icon_emoji  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS foreign_references (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  link        TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  written_at  DATE,
  summary     TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE foreign_references ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  content               TEXT NOT NULL,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  summary               TEXT,
  reference_links       TEXT[] DEFAULT '{}',
  publish_location      TEXT,
  related_reference_ids UUID[] DEFAULT '{}',
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS: 공개 읽기/쓰기 (익명 포함)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories', 'foreign_references', 'posts']
  LOOP
    EXECUTE format('CREATE POLICY "public read" ON %I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "public insert" ON %I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public update" ON %I FOR UPDATE USING (true)', t);
    EXECUTE format('CREATE POLICY "public delete" ON %I FOR DELETE USING (true)', t);
  END LOOP;
END $$;
