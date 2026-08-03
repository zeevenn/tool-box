import type { TranslationKey } from '@/i18n/messages'
import { useCallback, useMemo, useState } from 'react'

import { compress, decompress } from '@/utils/compress'

export type DiffLanguage = 'plain' | 'javascript' | 'typescript' | 'json'
export type DiffSide = 'original' | 'modified'

export interface DiffSnapshot {
  id: string
  title: string
  original: string
  modified: string
  language: DiffLanguage
  createdAt: number
}

interface SharedDiff {
  original: string
  modified: string
  lang: DiffLanguage
}

const HISTORY_STORAGE_KEY = 'tool-box-text-diff-history-v1'
export const MAX_DIFF_SNAPSHOTS = 20

export const DIFF_LANGUAGE_OPTIONS: { value: DiffLanguage, label: TranslationKey }[] = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
]

const DEFAULT_DIFF: SharedDiff = {
  original: 'function hello() {\n  console.log("Hello World");\n}',
  modified: 'function hello() {\n  console.log("Hello, World!");\n  return "Hello";\n}',
  lang: 'plain',
}

function isDiffLanguage(value: unknown): value is DiffLanguage {
  return DIFF_LANGUAGE_OPTIONS.some(option => option.value === value)
}

function isDiffSnapshot(value: unknown): value is DiffSnapshot {
  if (!value || typeof value !== 'object')
    return false
  const snapshot = value as Partial<DiffSnapshot>
  return typeof snapshot.id === 'string'
    && typeof snapshot.title === 'string'
    && typeof snapshot.original === 'string'
    && typeof snapshot.modified === 'string'
    && isDiffLanguage(snapshot.language)
    && typeof snapshot.createdAt === 'number'
}

function readSnapshots(): DiffSnapshot[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter(isDiffSnapshot).slice(0, MAX_DIFF_SNAPSHOTS)
      : []
  }
  catch {
    return []
  }
}

function writeSnapshots(snapshots: DiffSnapshot[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(snapshots))
}

function snapshotTitle(original: string, modified: string) {
  const firstLine = (value: string) => value
    .split('\n')
    .map(line => line.trim())
    .find(Boolean)
    ?.slice(0, 42) ?? '∅'
  return `${firstLine(original)} → ${firstLine(modified)}`
}

function diffStats(original: string, modified: string) {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  let added = 0
  let removed = 0
  const maxLength = Math.max(originalLines.length, modifiedLines.length)

  for (let index = 0; index < maxLength; index++) {
    if (index >= originalLines.length) {
      added++
    }
    else if (index >= modifiedLines.length) {
      removed++
    }
    else if (originalLines[index] !== modifiedLines[index]) {
      added++
      removed++
    }
  }
  return { added, removed }
}

function serializeDiff(original: string, modified: string) {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  const lines: string[] = []
  const maxLength = Math.max(originalLines.length, modifiedLines.length)

  for (let index = 0; index < maxLength; index++) {
    if (index >= originalLines.length) {
      lines.push(`+ ${modifiedLines[index]}`)
    }
    else if (index >= modifiedLines.length) {
      lines.push(`- ${originalLines[index]}`)
    }
    else if (originalLines[index] !== modifiedLines[index]) {
      lines.push(`- ${originalLines[index]}`)
      lines.push(`+ ${modifiedLines[index]}`)
    }
    else {
      lines.push(`  ${originalLines[index]}`)
    }
  }
  return lines.join('\n')
}

export function normalizeDiffText(content: string) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  }
  catch {
    return content
  }
}

export function useDiffSession() {
  const [diff, setDiff] = useState<SharedDiff>(DEFAULT_DIFF)
  const [history, setHistory] = useState<DiffSnapshot[]>(readSnapshots)

  const setOriginalText = useCallback((original: string) => {
    setDiff(current => ({ ...current, original }))
  }, [])

  const setModifiedText = useCallback((modified: string) => {
    setDiff(current => ({ ...current, modified }))
  }, [])

  const setLanguage = useCallback((lang: DiffLanguage) => {
    setDiff(current => ({ ...current, lang }))
  }, [])

  const setSideText = useCallback((side: DiffSide, value: string) => {
    setDiff(current => ({ ...current, [side]: value }))
  }, [])

  const swap = useCallback(() => {
    setDiff(current => ({ ...current, original: current.modified, modified: current.original }))
  }, [])

  const clear = useCallback(() => {
    setDiff(current => ({ ...current, original: '', modified: '' }))
  }, [])

  const saveSnapshot = useCallback(() => {
    if (!diff.original && !diff.modified)
      return null

    const snapshot: DiffSnapshot = {
      id: crypto.randomUUID(),
      title: snapshotTitle(diff.original, diff.modified),
      original: diff.original,
      modified: diff.modified,
      language: diff.lang,
      createdAt: Date.now(),
    }
    const nextHistory = [
      snapshot,
      ...history.filter(item => !(
        item.original === diff.original
        && item.modified === diff.modified
        && item.language === diff.lang
      )),
    ].slice(0, MAX_DIFF_SNAPSHOTS)

    writeSnapshots(nextHistory)
    setHistory(nextHistory)
    return snapshot
  }, [diff, history])

  const restoreSnapshot = useCallback((snapshot: DiffSnapshot) => {
    setDiff({ original: snapshot.original, modified: snapshot.modified, lang: snapshot.language })
  }, [])

  const deleteSnapshot = useCallback((id: string) => {
    const nextHistory = history.filter(snapshot => snapshot.id !== id)
    writeSnapshots(nextHistory)
    setHistory(nextHistory)
  }, [history])

  const clearHistory = useCallback(() => {
    writeSnapshots([])
    setHistory([])
  }, [])

  const createShareToken = useCallback(async () => {
    return compress(JSON.stringify({ original: diff.original, modified: diff.modified, lang: diff.lang }))
  }, [diff])

  const loadShareToken = useCallback(async (token: string) => {
    const parsed = JSON.parse(await decompress(token)) as Partial<SharedDiff>
    if (typeof parsed.original !== 'string' || typeof parsed.modified !== 'string' || !isDiffLanguage(parsed.lang))
      throw new Error('Invalid shared diff')
    setDiff({ original: parsed.original, modified: parsed.modified, lang: parsed.lang })
  }, [])

  const stats = useMemo(() => diffStats(diff.original, diff.modified), [diff.original, diff.modified])
  const copyableDiff = useMemo(() => serializeDiff(diff.original, diff.modified), [diff.original, diff.modified])

  return {
    originalText: diff.original,
    modifiedText: diff.modified,
    language: diff.lang,
    history,
    stats,
    copyableDiff,
    setOriginalText,
    setModifiedText,
    setLanguage,
    setSideText,
    swap,
    clear,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    clearHistory,
    createShareToken,
    loadShareToken,
  }
}
