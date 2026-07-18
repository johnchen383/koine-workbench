import type { ChapterData, DataIndex } from './types'

const base = import.meta.env.BASE_URL

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base}data/${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)
  return res.json()
}

export const loadIndex = () => getJson<DataIndex>('index.json')

export const loadChapter = (book: string, chapter: number | string) =>
  getJson<ChapterData>(`${book}/${chapter}.json`)
