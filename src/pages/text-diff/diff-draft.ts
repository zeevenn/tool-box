import type { ToolState } from '@/context/tool-state-provider'

export const DIFF_DRAFT_STORAGE_KEY = 'tool-box-text-diff-draft-v1'

export function readDiffDraft(): ToolState['textDiff'] | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(DIFF_DRAFT_STORAGE_KEY) ?? 'null') as Partial<ToolState['textDiff']> | null
    if (saved
      && typeof saved.original === 'string'
      && typeof saved.modified === 'string'
      && typeof saved.language === 'string'
      && ['plain', 'javascript', 'typescript', 'json'].includes(saved.language)) {
      return { original: saved.original, modified: saved.modified, language: saved.language }
    }
  }
  catch {
    // Missing or unavailable browser storage must not prevent editing.
  }
}
