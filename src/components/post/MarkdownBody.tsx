import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownBody({
  markdown,
  className = '',
}: {
  markdown: string
  /** 추가 래퍼 클래스 (예: 상세 페이지에서 크기 조절) */
  className?: string
}) {
  return (
    <div
      className={`prose-hub prose prose-base max-w-none leading-relaxed dark:prose-invert prose-headings:scroll-mt-20 prose-blockquote:border-l-[#FF8A50] prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
