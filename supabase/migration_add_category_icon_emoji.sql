-- 기존 DB에 한 번 실행: 카테고리별 목록 표시 이모지
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_emoji TEXT;
