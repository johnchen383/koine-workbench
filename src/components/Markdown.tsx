import { useMemo } from 'react'
import { marked } from 'marked'

// Note bodies and rule explanations ship with the site (repo-reviewed), so
// rendering without a sanitizer is acceptable here.
export function Markdown({ children, className }: { children: string; className?: string }) {
  const html = useMemo(() => marked.parse(children, { async: false }) as string, [children])
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
