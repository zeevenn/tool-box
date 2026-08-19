import type { LanguageSupport } from '@codemirror/language'
import type { MergeView } from '@codemirror/merge'
import type { DiffLanguage, DiffSide, DiffSnapshot } from './use-diff-session'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { ArrowLeftRight, CloudUpload, Copy, History as HistoryIcon, RotateCcw, Save, Share2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { useCopyText } from '@/hooks/use-copy-text'

import { useDragAndDrop } from '../../hooks/use-drag-and-drop'
import {
  DIFF_LANGUAGE_OPTIONS,
  MAX_DIFF_SNAPSHOTS,
  normalizeDiffText,
  useDiffSession,
} from './use-diff-session'

const DROP_ZONE = {
  ORIGINAL: 'original' as const satisfies DiffSide,
  MODIFIED: 'modified' as const satisfies DiffSide,
}

function getLanguageExtension(lang: DiffLanguage): LanguageSupport | undefined {
  switch (lang) {
    case 'javascript': return javascript({ jsx: true })
    case 'typescript': return javascript({ jsx: true, typescript: true })
    case 'json': return json()
    default: return undefined
  }
}

export function TextDiff() {
  const { locale, t } = useI18n()
  const copyText = useCopyText()
  const {
    originalText,
    modifiedText,
    language,
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
  } = useDiffSession()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmingClearHistory, setConfirmingClearHistory] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('s')
    if (!shared)
      return
    void (async () => {
      try {
        await loadShareToken(shared)
        // Clean URL without reload
        window.history.replaceState({}, '', window.location.pathname)
      }
      catch {
        toast.error(t('Failed to load shared diff'))
      }
    })()
  }, [loadShareToken, t])

  const readFile = useCallback(async (file: File, side: DiffSide) => {
    setSideText(side, normalizeDiffText(await file.text()))
  }, [setSideText])

  const {
    isDragging: isOriginalDragging,
    registerDropZone: registerOriginalDropZone,
  } = useDragAndDrop(null, {
    onFilesDrop: (files) => {
      const file = files[0]
      void readFile(file, DROP_ZONE.ORIGINAL)
    },
  })

  const {
    isDragging: isModifiedDragging,
    registerDropZone: registerModifiedDropZone,
  } = useDragAndDrop(null, {
    onFilesDrop: (files) => {
      const file = files[0]
      void readFile(file, DROP_ZONE.MODIFIED)
    },
  })

  const handleMount = useCallback((view: MergeView) => {
    const aEditor = view.a.dom
    const bEditor = view.b.dom

    if (aEditor) {
      registerOriginalDropZone(aEditor)
    }
    if (bEditor) {
      registerModifiedDropZone(bEditor)
    }
  }, [registerModifiedDropZone, registerOriginalDropZone])

  const handleSaveHistory = () => {
    try {
      if (!saveSnapshot()) {
        toast.error(t('Input is empty'))
        return
      }
      toast.success(t('Current diff saved'))
    }
    catch {
      toast.error(t('Unable to update diff history'))
    }
  }

  const handleRestoreHistory = (entry: DiffSnapshot) => {
    restoreSnapshot(entry)
    setHistoryOpen(false)
    toast.success(t('Diff restored'))
  }

  const handleDeleteHistory = (id: string) => {
    try {
      deleteSnapshot(id)
      toast.success(t('History entry deleted'))
    }
    catch {
      toast.error(t('Unable to update diff history'))
    }
  }

  const handleClearHistory = () => {
    try {
      clearHistory()
      setConfirmingClearHistory(false)
      toast.success(t('Diff history cleared'))
    }
    catch {
      toast.error(t('Unable to update diff history'))
    }
  }

  const handleShare = async () => {
    let url: string
    try {
      const param = encodeURIComponent(await createShareToken())
      if (param.length > 4096) {
        toast.warning(t('Link generated but may be too long to share reliably (content exceeds ~4KB)'))
      }
      url = `${window.location.origin}${window.location.pathname}?s=${param}`
    }
    catch {
      toast.error(t('Failed to generate share link'))
      return
    }
    await copyText(url, t('Share link copied to clipboard'))
  }

  const handleCopyDiff = () => copyText(copyableDiff, t('Diff copied to clipboard'))
  const langExtension = getLanguageExtension(language)

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border/70 bg-card/80 px-3 py-2.5 sm:gap-2 sm:px-4">
        <Select value={language} onValueChange={v => setLanguage(v as DiffLanguage)}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {DIFF_LANGUAGE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.label)}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <Button variant="ghost" size="sm" onClick={swap} title={t('Swap original and modified')}>
          <ArrowLeftRight data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Swap')}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopyDiff} title={t('Copy diff')}>
          <Copy data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Copy Diff')}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={clear} title={t('Clear both sides')}>
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
              <SheetDescription>{t('Save diffs to revisit them later.')}</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <Typography variant="muted" className="text-xs">
                  {history.length}
                  {' / '}
                  {MAX_DIFF_SNAPSHOTS}
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
                              {t(DIFF_LANGUAGE_OPTIONS.find(option => option.value === entry.language)?.label ?? 'Plain Text')}
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
          onOriginalPaste={normalizeDiffText}
          onModifiedPaste={normalizeDiffText}
          language={langExtension}
          originalAriaLabel={t('Original text')}
          modifiedAriaLabel={t('Modified text')}
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
