import type { LanguageSupport } from '@codemirror/language'
import type { MergeView } from '@codemirror/merge'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { ArrowLeftRight, CloudUpload, Copy, History as HistoryIcon, RotateCcw, Save, Share2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CodeMirrorMerge } from '@/components/common'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { compress, decompress } from '@/utils/compress'

import { useDragAndDrop } from '../../hooks/use-drag-and-drop'

type DropZone = 'original' | 'modified'
type Language = 'plain' | 'javascript' | 'typescript' | 'json'

interface DiffHistoryEntry {
  id: string
  title: string
  original: string
  modified: string
  language: Language
  createdAt: number
}

const HISTORY_STORAGE_KEY = 'tool-box-text-diff-history-v1'
const MAX_HISTORY_ENTRIES = 20

const DROP_ZONE = {
  ORIGINAL: 'original' as const,
  MODIFIED: 'modified' as const,
} satisfies Record<string, DropZone>

const LANGUAGE_OPTIONS: { value: Language, label: string }[] = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
]

function readHistory(): DiffHistoryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed))
      return []
    return parsed.filter((entry): entry is DiffHistoryEntry => (
      typeof entry?.id === 'string'
      && typeof entry?.title === 'string'
      && typeof entry?.original === 'string'
      && typeof entry?.modified === 'string'
      && typeof entry?.language === 'string'
      && typeof entry?.createdAt === 'number'
    )).slice(0, MAX_HISTORY_ENTRIES)
  }
  catch {
    return []
  }
}

function getLanguageExtension(lang: Language): LanguageSupport | undefined {
  switch (lang) {
    case 'javascript': return javascript({ jsx: true })
    case 'typescript': return javascript({ jsx: true, typescript: true })
    case 'json': return json()
    default: return undefined
  }
}

export function TextDiff() {
  const { locale, t } = useI18n()
  const [originalText, setOriginalText] = useState(
    'function hello() {\n  console.log("Hello World");\n}',
  )
  const [modifiedText, setModifiedText] = useState(
    'function hello() {\n  console.log("Hello, World!");\n  return "Hello";\n}',
  )
  const [language, setLanguage] = useState<Language>('plain')
  const [history, setHistory] = useState<DiffHistoryEntry[]>(readHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmingClearHistory, setConfirmingClearHistory] = useState(false)
  const mergeViewRef = useRef<MergeView | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('s')
    if (!shared)
      return
    void (async () => {
      try {
        const json = await decompress(shared)
        const { original, modified, lang } = JSON.parse(json)
        if (typeof original === 'string')
          setOriginalText(original)
        if (typeof modified === 'string')
          setModifiedText(modified)
        if (lang)
          setLanguage(lang)
        // Clean URL without reload
        window.history.replaceState({}, '', window.location.pathname)
      }
      catch {
        toast.error(t('Failed to load shared diff'))
      }
    })()
  }, [t])

  const formatContentIfJSON = (content: string): string => {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2)
      return formatted
    }
    catch {
      return content
    }
  }

  const readFile = (file: File, side: DropZone) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const rawContent = e.target?.result as string
      const content = formatContentIfJSON(rawContent)

      if (side === DROP_ZONE.ORIGINAL) {
        setOriginalText(content)
      }
      else {
        setModifiedText(content)
      }
    }
    reader.readAsText(file)
  }

  const {
    isDragging: isOriginalDragging,
    registerDropZone: registerOriginalDropZone,
  } = useDragAndDrop(null, {
    onFilesDrop: (files) => {
      const file = files[0]
      readFile(file, DROP_ZONE.ORIGINAL)
    },
  })

  const {
    isDragging: isModifiedDragging,
    registerDropZone: registerModifiedDropZone,
  } = useDragAndDrop(null, {
    onFilesDrop: (files) => {
      const file = files[0]
      readFile(file, DROP_ZONE.MODIFIED)
    },
  })

  const handleMount = (view: MergeView) => {
    mergeViewRef.current = view
    const aEditor = view.a.dom
    const bEditor = view.b.dom

    if (aEditor) {
      registerOriginalDropZone(aEditor)
    }
    if (bEditor) {
      registerModifiedDropZone(bEditor)
    }
  }

  const handleSwap = () => {
    setOriginalText(modifiedText)
    setModifiedText(originalText)
  }

  const handleClear = () => {
    setOriginalText('')
    setModifiedText('')
  }

  const persistHistory = (nextHistory: DiffHistoryEntry[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
      setHistory(nextHistory)
      setConfirmingClearHistory(false)
      return true
    }
    catch {
      toast.error(t('Unable to update diff history'))
      return false
    }
  }

  const historyTitle = () => {
    const firstLine = (value: string, fallback: string) => value
      .split('\n')
      .map(line => line.trim())
      .find(Boolean)
      ?.slice(0, 42) ?? fallback
    return `${firstLine(originalText, t('Original empty'))} → ${firstLine(modifiedText, t('Modified empty'))}`
  }

  const handleSaveHistory = () => {
    if (!originalText && !modifiedText) {
      toast.error(t('Input is empty'))
      return
    }

    const entry: DiffHistoryEntry = {
      id: crypto.randomUUID(),
      title: historyTitle(),
      original: originalText,
      modified: modifiedText,
      language,
      createdAt: Date.now(),
    }
    const nextHistory = [
      entry,
      ...history.filter(item => !(
        item.original === originalText
        && item.modified === modifiedText
        && item.language === language
      )),
    ].slice(0, MAX_HISTORY_ENTRIES)

    if (persistHistory(nextHistory))
      toast.success(t('Current diff saved'))
  }

  const handleRestoreHistory = (entry: DiffHistoryEntry) => {
    setOriginalText(entry.original)
    setModifiedText(entry.modified)
    setLanguage(entry.language)
    setHistoryOpen(false)
    toast.success(t('Diff restored'))
  }

  const handleDeleteHistory = (id: string) => {
    if (persistHistory(history.filter(entry => entry.id !== id)))
      toast.success(t('History entry deleted'))
  }

  const handleClearHistory = () => {
    if (persistHistory([]))
      toast.success(t('Diff history cleared'))
  }

  const handleShare = async () => {
    try {
      const payload = JSON.stringify({ original: originalText, modified: modifiedText, lang: language })
      const compressed = await compress(payload)
      const param = encodeURIComponent(compressed)
      if (param.length > 4096) {
        toast.warning(t('Link generated but may be too long to share reliably (content exceeds ~4KB)'))
      }
      const url = `${window.location.origin}${window.location.pathname}?s=${param}`
      await navigator.clipboard.writeText(url)
      toast.success(t('Share link copied to clipboard'))
    }
    catch {
      toast.error(t('Failed to generate share link'))
    }
  }

  const handleCopyDiff = async () => {
    if (!mergeViewRef.current)
      return
    const orig = originalText.split('\n')
    const mod = modifiedText.split('\n')
    const lines: string[] = []
    const maxLen = Math.max(orig.length, mod.length)
    for (let i = 0; i < maxLen; i++) {
      if (i >= orig.length) {
        lines.push(`+ ${mod[i]}`)
      }
      else if (i >= mod.length) {
        lines.push(`- ${orig[i]}`)
      }
      else if (orig[i] !== mod[i]) {
        lines.push(`- ${orig[i]}`)
        lines.push(`+ ${mod[i]}`)
      }
      else {
        lines.push(`  ${orig[i]}`)
      }
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    toast.success(t('Diff copied to clipboard'))
  }

  const getDiffStats = () => {
    const orig = originalText.split('\n')
    const mod = modifiedText.split('\n')
    let added = 0
    let removed = 0
    const maxLen = Math.max(orig.length, mod.length)
    for (let i = 0; i < maxLen; i++) {
      if (i >= orig.length) {
        added++
      }
      else if (i >= mod.length) {
        removed++
      }
      else if (orig[i] !== mod[i]) {
        added++
        removed++
      }
    }
    return { added, removed }
  }

  const stats = getDiffStats()
  const langExtension = getLanguageExtension(language)

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border/70 bg-card/80 px-3 py-2.5 sm:gap-2 sm:px-4">
        <Select value={language} onValueChange={v => setLanguage(v as Language)}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LANGUAGE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.label)}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <Button variant="ghost" size="sm" onClick={handleSwap} title={t('Swap original and modified')}>
          <ArrowLeftRight data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Swap')}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopyDiff} title={t('Copy diff')}>
          <Copy data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Copy Diff')}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleClear} title={t('Clear both sides')}>
          <Trash2 data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Clear')}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleShare} title={t('Copy share link')}>
          <Share2 data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Share')}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSaveHistory} title={t('Save current diff')}>
          <Save data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Save')}</span>
        </Button>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" title={t('Open diff history')}>
              <HistoryIcon data-icon="inline-start" />
              <span className="hidden sm:inline">{t('History')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full gap-0 p-0 sm:max-w-md" closeLabel={t('Close')}>
            <SheetHeader className="border-b border-border text-left">
              <SheetTitle>{t('Diff history')}</SheetTitle>
              <SheetDescription>{t('Saved locally in this browser.')}</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <Typography variant="muted" className="text-xs">
                  {history.length}
                  {' / '}
                  {MAX_HISTORY_ENTRIES}
                </Typography>
                {confirmingClearHistory
                  ? (
                      <div className="flex items-center gap-1">
                        <Typography variant="muted" className="mr-1 text-xs">{t('Clear all saved diff history?')}</Typography>
                        <Button variant="destructive" size="xs" onClick={handleClearHistory}>{t('Confirm')}</Button>
                        <Button variant="ghost" size="xs" onClick={() => setConfirmingClearHistory(false)}>{t('Cancel')}</Button>
                      </div>
                    )
                  : (
                      <Button variant="ghost" size="xs" disabled={history.length === 0} onClick={() => setConfirmingClearHistory(true)}>
                        <Trash2 data-icon="inline-start" />
                        {t('Clear all')}
                      </Button>
                    )}
              </div>

              {history.length === 0
                ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                      <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <HistoryIcon className="size-4" />
                      </span>
                      <Typography variant="small">{t('No saved diffs')}</Typography>
                      <Typography variant="muted" className="max-w-60 text-xs">
                        {t('Save the current diff to revisit it later.')}
                      </Typography>
                    </div>
                  )
                : (
                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                      {history.map(entry => (
                        <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
                          <button type="button" className="cursor-pointer text-left" onClick={() => handleRestoreHistory(entry)}>
                            <Typography className="truncate text-sm font-medium" title={entry.title}>{entry.title || t('Untitled diff')}</Typography>
                            <Typography variant="muted" className="mt-1 text-xs">
                              {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(entry.createdAt)}
                              {' · '}
                              {t(LANGUAGE_OPTIONS.find(option => option.value === entry.language)?.label ?? 'Plain Text')}
                            </Typography>
                          </button>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="xs" onClick={() => handleRestoreHistory(entry)}>
                              <RotateCcw data-icon="inline-start" />
                              {t('Restore')}
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteHistory(entry.id)} aria-label={t('Delete')} title={t('Delete')}>
                              <Trash2 data-icon="inline-start" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </SheetContent>
        </Sheet>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <div className="flex items-center gap-2">
          {stats.added > 0 && (
            <Typography variant="small" className="font-mono text-emerald-600 dark:text-emerald-400">
              +
              {stats.added}
            </Typography>
          )}
          {stats.removed > 0 && (
            <Typography variant="small" className="font-mono text-destructive">
              -
              {stats.removed}
            </Typography>
          )}
          {stats.added === 0 && stats.removed === 0 && (
            <Typography variant="muted" className="text-xs">{t('No differences')}</Typography>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex-1 overflow-hidden bg-card">
        <CodeMirrorMerge
          originalValue={originalText}
          modifiedValue={modifiedText}
          onOriginalChange={setOriginalText}
          onModifiedChange={setModifiedText}
          onOriginalPaste={formatContentIfJSON}
          onModifiedPaste={formatContentIfJSON}
          language={langExtension}
          onMount={handleMount}
        />

        {/* Original Drop Overlay */}
        {isOriginalDragging && (
          <div className="absolute top-0 left-0 w-1/2 h-full pointer-events-none bg-primary/20 border-2 border-primary border-dashed">
            <div className="flex items-center justify-center h-full">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <CloudUpload className="size-[18px]" />
                  <Typography variant="small">
                    {t('Drag to update original content')}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modified Drop Overlay */}
        {isModifiedDragging && (
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none bg-accent/20 border-2 border-accent-foreground border-dashed">
            <div className="flex items-center justify-center h-full">
              <div className="bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <CloudUpload className="size-[18px]" />
                  <Typography variant="small">
                    {t('Drag to update modified content')}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
