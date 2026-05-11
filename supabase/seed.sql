-- 예시 데이터 (한 번만 실행 권장)
-- 해외 링크용 카테고리 트리와 게시글용 카테고리 트리는 ID 가 완전히 분리되어 있습니다.

BEGIN;

-- 기존 시드 UUID 충돌 시에만 제거 (선택)
DELETE FROM posts WHERE id IN (
  '33333333-3333-3333-3333-333333333301',
  '33333333-3333-3333-3333-333333333302',
  '33333333-3333-3333-3333-333333333303'
);
DELETE FROM foreign_references WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
);
-- categories: 자기 FK 때문에 하위부터 삭제
DELETE FROM categories WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222211'
);
DELETE FROM categories WHERE id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202'
);

-- ========== 해외 참고 링크 전용 카테고리 (상위 2 + 1번 하위 1개) ==========
INSERT INTO categories (id, name, parent_id, order_num, icon_emoji) VALUES
  ('11111111-1111-1111-1111-111111111101', '해외링크 · 리서치·리포트', NULL, 0, '📊'),
  ('11111111-1111-1111-1111-111111111102', '해외링크 · 도구·플랫폼', NULL, 1, '🔧'),
  ('11111111-1111-1111-1111-111111111111', '해외링크 · 리서치·리포트 / 인터랙션', '11111111-1111-1111-1111-111111111101', 0, '✨');

-- ========== 게시글 전용 카테고리 (상위 2 + 1번 하위 1개) ==========
INSERT INTO categories (id, name, parent_id, order_num, icon_emoji) VALUES
  ('22222222-2222-2222-2222-222222222201', '게시글 · 사내 공유', NULL, 0, '📌'),
  ('22222222-2222-2222-2222-222222222202', '게시글 · 에디토리얼', NULL, 1, '✍️'),
  ('22222222-2222-2222-2222-222222222211', '게시글 · 사내 공유 / 주간 요약', '22222222-2222-2222-2222-222222222201', 0, '📅');

-- ========== 해외 참고 링크 2건 (링크용 카테고리만 참조) ==========
INSERT INTO foreign_references (id, title, link, category_id, written_at, summary, is_active) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Nielsen Norman Group — UX 리서치 아티클 모음',
    'https://www.nngroup.com/articles/',
    '11111111-1111-1111-1111-111111111111',
    '2025-03-15',
    'UX·사용성 관련 짧은 리서치 글과 가이드가 많은 레퍼런스 사이트입니다.',
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Figma — 디자인 시스템 문서',
    'https://help.figma.com/hc/en-us/categories/360002002533-Design-systems',
    '11111111-1111-1111-1111-111111111102',
    '2025-01-10',
    '컴포넌트·디자인 토큰·문서화 패턴을 찾을 때 참고하기 좋은 공식 도움말입니다.',
    true
  );

-- ========== 게시글 3건 (게시글 전용 카테고리만 참조) ==========
INSERT INTO posts (
  id, title, content, category_id, summary,
  reference_links, publish_location, related_reference_ids, is_active
) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '주간 AX 레퍼런스 스크랩 (3월 2주)',
    E'# 개요\n이번 주에 읽은 해외 글·도구 링크를 모았습니다.\n\n## 체크리스트\n- [ ] 인터랙션 패턴 정리\n- [ ] 디자인 시스템 용어 통일\n',
    '22222222-2222-2222-2222-222222222211',
    'NN/g·Figma 문서 등 이번 주 스크랩 요약.',
    ARRAY['https://www.nngroup.com/articles/', 'https://help.figma.com/']::text[],
    '내부 위키 / AX 채널',
    ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid],
    true
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '에디토리얼: 왜 우리는 “콘텐츠 허브”를 쓰는가',
    E'# 한 줄 요지\n**한곳에 모으고**, **같은 카테고리 규칙으로 찾기** 쉽게 만든다.\n\n> 링크 트리와 글 트리는 **서로 다른 카테고리 ID**를 쓴다.\n',
    '22222222-2222-2222-2222-222222222202',
    '허브 도입 배경을 팀 외부에도 공유하기 위한 짧은 글.',
    ARRAY[]::text[],
    NULL,
    ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid],
    true
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '사내 공유: 온보딩 체크리스트 v0.2',
    E'## 온보딩\n1. Supabase 프로젝트 URL 확인\n2. RLS 정책 검토\n3. 시드 SQL은 **한 번만** 실행\n',
    '22222222-2222-2222-2222-222222222201',
    '신규 입사자용으로 정리한 최소 체크리스트.',
    ARRAY['https://supabase.com/docs/guides/database']::text[],
    'Notion · 온보딩 보드',
    ARRAY[]::uuid[],
    true
  );

COMMIT;
