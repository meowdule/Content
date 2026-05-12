/**
 * Reads Notion-exported HTML drafts and writes supabase/seed.sql
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const draftDir = path.join(
  root,
  'reference',
  '개인 페이지 & 공유된 페이지',
  '게시글 초안 모음집',
  '게시글 초안'
)

const CAT_ROOT = 'c0ffee00-0000-4000-8000-000000000001'
const CAT_AI = 'c0ffee00-0000-4000-8000-000000000002'
const CAT_AUTO = 'c0ffee00-0000-4000-8000-000000000003'

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripTags(s) {
  return decodeEntities(
    s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
  ).trim()
}

function extractPageBody(html) {
  const marker = '<div class="page-body">'
  const start = html.indexOf(marker)
  if (start === -1) return ''
  let i = start + marker.length
  let depth = 1
  while (i < html.length && depth > 0) {
    const open = html.indexOf('<div', i)
    const close = html.indexOf('</div>', i)
    if (close === -1) break
    if (open !== -1 && open < close) {
      depth++
      i = open + 4
    } else {
      depth--
      i = close + 6
    }
  }
  return html.slice(start + marker.length, i - 6)
}

function extractTitle(html) {
  const m = html.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/i)
  if (!m) {
    const t = html.match(/<title>([^<]*)<\/title>/i)
    return t ? stripTags(t[1]) : '제목 없음'
  }
  const inner = stripTags(m[1])
  return inner || '제목 없음'
}

function extractSummary(html) {
  const m = html.match(
    /<tr class="property-row property-row-text"[^>]*>[\s\S]*?요약<\/th><td>([\s\S]*?)<\/td>/i
  )
  if (!m) return null
  return stripTags(m[1].replace(/<br\s*\/?>/gi, '\n'))
}

function htmlFragmentToMarkdown(fragment) {
  if (!fragment.trim()) return ''

  let s = fragment
  s = s.replace(/<nav[^>]*class="[^"]*table_of_contents[^"]*"[\s\S]*?<\/nav>/gi, '')

  const blocks = []
  const re =
    /<(h[23])[^>]*>([\s\S]*?)<\/\1>|<hr[^>]*\/?>|<blockquote[^>]*>([\s\S]*?)<\/blockquote>|<ol[^>]*>[\s\S]*?<li[^>]*>([\s\S]*?)<\/li>[\s\S]*?<\/ol>|<ul[^>]*>[\s\S]*?<li[^>]*>([\s\S]*?)<\/li>[\s\S]*?<\/ul>|<p[^>]*>([\s\S]*?)<\/p>/gi

  let last = 0
  let m
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      const gap = s.slice(last, m.index)
      if (stripTags(gap)) blocks.push(stripTags(gap))
    }
    if (m[1]) {
      const level = m[1].toLowerCase() === 'h2' ? '##' : '###'
      blocks.push(`${level} ${stripTags(m[2])}`)
    } else if (m[0].startsWith('<hr')) {
      blocks.push('---')
    } else if (m[3] !== undefined) {
      const q = stripTags(m[3]).replace(/\n+/g, ' ')
      if (q) blocks.push(`> ${q}`)
    } else if (m[4] !== undefined) {
      const item = stripTags(m[4])
      if (item) blocks.push(`1. ${item}`)
    } else if (m[5] !== undefined) {
      const item = stripTags(m[5])
      if (item) blocks.push(`- ${item}`)
    } else if (m[6] !== undefined) {
      const p = stripTags(m[6])
      if (p) blocks.push(p)
    }
    last = re.lastIndex
  }
  if (last < s.length) {
    const tail = stripTags(s.slice(last))
    if (tail) blocks.push(tail)
  }

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

function sqlString(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'"
}

function sqlDollar(s) {
  let tag
  do {
    tag = 'b' + Math.random().toString(36).slice(2, 12)
  } while (s.includes('$' + tag + '$'))
  return `$${tag}$${s}$${tag}$`
}

function pickCategory(filename, title, html) {
  if (
    filename.includes('AI 자동화 및 기획자 입장 게시글') ||
    filename.includes('35ec60fde0e48085ba48face25cf8900')
  ) {
    return CAT_AI
  }
  if (
    filename.includes('자동화 구현 기반 게시글') ||
    filename.includes('제목 없음') ||
    filename.includes('35ec60fde0e480d7b641dcee7abf83e7') ||
    filename.includes('35ec60fde0e4802ab264c1801d46419a')
  ) {
    return CAT_AUTO
  }
  if (/자동화 구현 기반 게시글/.test(html) && /상위 항목/.test(html)) {
    const m = html.match(/상위 항목<\/th><td>[\s\S]*?>([^<]+)</i)
    if (m && m[1].includes('자동화 구현')) return CAT_AUTO
  }
  return CAT_AI
}

function main() {
  const files = fs
    .readdirSync(draftDir)
    .filter((f) => f.endsWith('.html'))
    .sort()

  const posts = []
  for (const file of files) {
    const full = path.join(draftDir, file)
    const html = fs.readFileSync(full, 'utf8')
    const title = extractTitle(html)
    const summary = extractSummary(html)
    const bodyHtml = extractPageBody(html)
    let content = htmlFragmentToMarkdown(bodyHtml)
    if (!content) {
      content =
        '_(Notion HTML보내기 기준 본문 블록이 비어 있습니다.)_\n\n' +
        (summary ? `**요약:** ${summary}` : '')
    }
    posts.push({
      file,
      title,
      summary: summary || null,
      content,
      category_id: pickCategory(file, title, html),
    })
  }

  let out = `-- reference/개인 페이지 & 공유된 페이지/게시글 초안 모음집 에서 생성됨 (scripts/build-seed-from-notion-html.mjs)
-- 기존 데이터 전부 제거 후 카테고리 + 게시글 초안만 삽입합니다.

BEGIN;

DELETE FROM posts;
DELETE FROM foreign_references;
DELETE FROM categories WHERE parent_id IS NOT NULL;
DELETE FROM categories WHERE parent_id IS NULL;

INSERT INTO categories (id, name, parent_id, order_num, icon_emoji) VALUES
  ('${CAT_ROOT}', '게시글 · 초안 모음집', NULL, 0, '📚'),
  ('${CAT_AI}', 'AI 자동화 및 기획자 입장', '${CAT_ROOT}', 0, '🖊️'),
  ('${CAT_AUTO}', '자동화 구현 기반', '${CAT_ROOT}', 1, '⚙️');

`

  for (const p of posts) {
    const dollar = sqlDollar(p.content)
    const sum = p.summary ? sqlString(p.summary) : 'NULL'
    out += `INSERT INTO posts (title, content, category_id, summary, reference_links, publish_location, related_reference_ids, is_active) VALUES
  (${sqlString(p.title)}, ${dollar}, '${p.category_id}', ${sum === 'NULL' ? 'NULL' : sum}, ARRAY[]::text[], NULL, ARRAY[]::uuid[], true);

`
  }

  out += 'COMMIT;\n'
  fs.writeFileSync(path.join(root, 'supabase', 'seed.sql'), out, 'utf8')
  console.log('Wrote', posts.length, 'posts to supabase/seed.sql')
}

main()
